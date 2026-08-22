import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import PhotoBackground from "../../components/photo-background";
import PulseDot from "../../components/pulse-dot";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { addWellnessEntry, getLatestWellnessScore } from "../../services/tracking";

// Chaque libellé est formulé dans le sens positif de l'échelle (10 = bon
// état) : "Fatigue"/"Courbatures"/"Stress" sont des notions négatives qui
// entraient en conflit avec ce sens (10 = pas fatigué demande de "penser à
// l'envers"), d'où "Énergie"/"Récupération"/"Détente" à la place — le mot
// pointe directement vers ce que représente un score élevé.
const WELLNESS_ITEMS: { key: WellnessKey; label: string }[] = [
  { key: "sommeil", label: "Qualité du sommeil (10 = excellent)" },
  { key: "fatigue", label: "Énergie du jour (10 = en pleine forme)" },
  { key: "courbatures", label: "Récupération musculaire (10 = bien récupéré)" },
  { key: "stress", label: "Détente (10 = très détendu)" },
  { key: "humeur", label: "Humeur (10 = excellente)" },
];

type WellnessKey = "sommeil" | "fatigue" | "courbatures" | "stress" | "humeur";
type WellnessState = Record<WellnessKey, number>;

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
    humeur: 5,
  });
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit() {
    if (!uid) return;
    setSubmitting(true);
    try {
      await addWellnessEntry(uid, wellness, coachId);
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
