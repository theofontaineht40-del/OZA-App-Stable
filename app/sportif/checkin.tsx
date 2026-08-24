import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import PhotoBackground from "../../components/photo-background";
import PulseDot from "../../components/pulse-dot";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { addWellnessEntry, getLatestWellnessScore, SorenessInput } from "../../services/tracking";

// Hooper Index (Hooper & Mackinnon, 1995) adapté sur une échelle 1-10 (au
// lieu de 1-7 dans la version originale) pour rester cohérent avec le reste
// de l'UI. Chaque libellé reste formulé dans le sens positif affiché (10 =
// bon état) ; la conversion vers le sens Hooper (1 = bon état) et le calcul
// de l'index total se font à l'enregistrement, voir
// services/load.ts::computeHooperValues.
const WELLNESS_ITEMS: { key: WellnessKey; label: string }[] = [
  { key: "sommeil", label: "Qualité du sommeil (10 = très très bon)" },
  { key: "stress", label: "Niveau de stress (10 = très très bas)" },
  { key: "fatigue", label: "Niveau de fatigue (10 = très très basse)" },
  { key: "courbatures", label: "Courbatures (10 = très très basses)" },
];

type WellnessKey = "sommeil" | "fatigue" | "courbatures" | "stress";
type WellnessState = Record<WellnessKey, number>;

type GeneType = "musculaire" | "articulaire";

const GENE_TYPES: { key: GeneType; label: string }[] = [
  { key: "musculaire", label: "Musculaire" },
  { key: "articulaire", label: "Articulaire" },
];

// Purement informatif (n'entre ni dans le hooper_index ni dans l'ACWR) —
// permet au coach de distinguer une gêne musculaire (ajustement de volume
// normal) d'une gêne articulaire (alerte prioritaire), voir
// services/tracking.ts::SorenessInput.
const ZONES_MUSCULAIRES: { key: string; label: string }[] = [
  { key: "epaules", label: "Épaules" },
  { key: "pectoraux", label: "Pectoraux" },
  { key: "dos", label: "Dos" },
  { key: "bras", label: "Bras" },
  { key: "abdos", label: "Abdos / gainage" },
  { key: "fessiers", label: "Fessiers" },
  { key: "jambes_avant", label: "Jambes (avant)" },
  { key: "jambes_arriere", label: "Jambes (arrière) / mollets" },
];

const ZONES_ARTICULAIRES: { key: string; label: string }[] = [
  { key: "cervicales", label: "Cervicales" },
  { key: "epaules", label: "Épaules" },
  { key: "coudes", label: "Coudes" },
  { key: "poignets", label: "Poignets" },
  { key: "lombaires", label: "Lombaires" },
  { key: "hanches", label: "Hanches" },
  { key: "genoux", label: "Genoux" },
  { key: "chevilles", label: "Chevilles" },
];

function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// Check-in quotidien indépendant d'une séance : les sportifs s'entraînant
// moins souvent que tous les jours renseignaient jusque-là leur ressenti
// (sommeil/fatigue/stress...) uniquement en loggant une séance. La collection
// `wellness` fait déjà un upsert par jour (services/tracking.ts), donc ce
// nouvel écran réutilise exactement le même service sans rien changer côté
// données — seul le déclenchement change.
export default function CheckinScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [wellness, setWellness] = useState<WellnessState>({
    sommeil: 5,
    fatigue: 5,
    courbatures: 5,
    stress: 5,
  });
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [hasPain, setHasPain] = useState(false);
  const [typeGene, setTypeGene] = useState<GeneType[]>([]);
  const [zonesMusculaires, setZonesMusculaires] = useState<string[]>([]);
  const [zonesArticulaires, setZonesArticulaires] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      const [userSnap, todayScore] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getLatestWellnessScore(user.uid),
      ]);
      setCoachId(userSnap.exists() ? userSnap.data().coachId ?? null : null);
      setAlreadyDone(todayScore !== null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  function setWellnessValue(key: WellnessKey, value: number) {
    setWellness((prev) => ({ ...prev, [key]: value }));
  }

  function toggleGeneType(type: GeneType) {
    setTypeGene((prev) => {
      const next = toggleInArray(prev, type) as GeneType[];
      // Décocher un type efface les zones associées, sinon elles restent
      // stockées sans être affichables/modifiables nulle part.
      if (!next.includes("musculaire")) setZonesMusculaires([]);
      if (!next.includes("articulaire")) setZonesArticulaires([]);
      return next;
    });
  }

  async function handleSubmit() {
    if (!uid) return;
    setSubmitting(true);
    try {
      const soreness: SorenessInput = hasPain
        ? { typeGene, zonesMusculaires, zonesArticulaires }
        : { typeGene: [], zonesMusculaires: [], zonesArticulaires: [] };
      await addWellnessEntry(uid, wellness, coachId, soreness);
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={{ flex: 1 }}>
    <PhotoBackground variant="profil" />
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Check-in du jour</Text>
      <Text style={styles.subtitle}>Comment vous sentez-vous aujourd'hui ?</Text>

      {alreadyDone && (
        <View style={styles.doneBanner}>
          <Text style={styles.doneBannerText}>
            Déjà complété aujourd'hui — vous pouvez le modifier ci-dessous.
          </Text>
        </View>
      )}

      {WELLNESS_ITEMS.map((item) => (
        <View key={item.key} style={styles.wellnessRow}>
          <Text style={styles.wellnessLabel}>{item.label}</Text>
          <View style={styles.scaleRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <PulseDot
                key={value}
                style={[styles.scaleDot, wellness[item.key] === value && styles.scaleDotActive]}
                onPress={() => setWellnessValue(item.key, value)}
              >
                <Text
                  style={[
                    styles.scaleDotText,
                    wellness[item.key] === value && styles.scaleDotTextActive,
                  ]}
                >
                  {value}
                </Text>
              </PulseDot>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.wellnessLabel}>Avez-vous des douleurs aujourd'hui ?</Text>
      <View style={styles.painToggleRow}>
        <TouchableOpacity
          style={[styles.painToggleButton, !hasPain && styles.painToggleButtonActive]}
          onPress={() => setHasPain(false)}
        >
          <Text style={[styles.painToggleText, !hasPain && styles.painToggleTextActive]}>Non</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.painToggleButton, hasPain && styles.painToggleButtonActive]}
          onPress={() => setHasPain(true)}
        >
          <Text style={[styles.painToggleText, hasPain && styles.painToggleTextActive]}>Oui</Text>
        </TouchableOpacity>
      </View>

      {hasPain && (
        <View style={styles.painSection}>
          <Text style={styles.wellnessLabel}>Type de gêne</Text>
          <View style={styles.chipRow}>
            {GENE_TYPES.map((type) => {
              const active = typeGene.includes(type.key);
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleGeneType(type.key)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {typeGene.includes("musculaire") && (
            <View style={styles.zoneGroup}>
              <Text style={styles.zoneGroupLabel}>Zones musculaires</Text>
              <View style={styles.chipRow}>
                {ZONES_MUSCULAIRES.map((zone) => {
                  const active = zonesMusculaires.includes(zone.key);
                  return (
                    <TouchableOpacity
                      key={zone.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setZonesMusculaires((prev) => toggleInArray(prev, zone.key))}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{zone.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {typeGene.includes("articulaire") && (
            <View style={styles.zoneGroup}>
              <Text style={styles.zoneGroupLabel}>Zones articulaires</Text>
              <View style={styles.chipRow}>
                {ZONES_ARTICULAIRES.map((zone) => {
                  const active = zonesArticulaires.includes(zone.key);
                  return (
                    <TouchableOpacity
                      key={zone.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setZonesArticulaires((prev) => toggleInArray(prev, zone.key))}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{zone.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Valider</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    padding: 32,
    paddingTop: 70,
    paddingBottom: 60,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.textOnDark,
  },

  subtitle: {
    fontSize: 15,
    color: Colors.textOnDarkSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  doneBanner: {
    backgroundColor: Colors.accentTint,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  doneBannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  wellnessRow: {
    marginBottom: 34,
  },

  wellnessLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
    marginBottom: 12,
  },

  scaleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  scaleDot: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  scaleDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  scaleDotText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  scaleDotTextActive: {
    color: Colors.white,
  },

  painToggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  painToggleButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
    justifyContent: "center",
    alignItems: "center",
  },

  painToggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  painToggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
  },

  painToggleTextActive: {
    color: Colors.white,
  },

  painSection: {
    marginBottom: 20,
  },

  zoneGroup: {
    marginTop: 20,
  },

  zoneGroupLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textOnDarkSecondary,
    marginBottom: 10,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
  },

  chipTextActive: {
    color: Colors.white,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
