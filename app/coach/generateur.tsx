import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import DateField from "../../components/date-field";
import { Colors } from "../../constants/colors";
import { Materiel } from "../../constants/exercise-library";
import { auth } from "../../firebase";
import {
  GEN_MATERIELS,
  GEN_NIVEAUX,
  GEN_OBJECTIFS,
  GenCharge,
  GenNiveau,
  GenObjectif,
  generateBlock,
} from "../../services/block-generator";
import { blocModeLabel, createProgrammeWithSeances } from "../../services/programmes";
import { addDays, addScheduledSession, mondayOf } from "../../services/schedule";
import { getMySportifs, SportifSummary } from "../../services/tracking";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Premier lundi à partir de cette date (la date elle-même si c'est un lundi).
function firstMondayFrom(iso: string): string {
  const monday = mondayOf(iso);
  return monday === iso ? monday : addDays(monday, 7);
}

function formatShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

type ChipProps = { label: string; active: boolean; onPress: () => void };

function Chip({ label, active, onPress }: ChipProps) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function CoachGenerateurScreen() {
  const params = useLocalSearchParams<{ sportif?: string }>();
  const [uid, setUid] = useState<string | null>(null);
  const [sportifs, setSportifs] = useState<SportifSummary[]>([]);

  const [objectif, setObjectif] = useState<GenObjectif>("hypertrophie");
  const [niveau, setNiveau] = useState<GenNiveau>("intermediaire");
  const [semaines, setSemaines] = useState(4);
  const [jours, setJours] = useState<number[]>([0, 2, 4]);
  const [charge, setCharge] = useState<GenCharge>("rpe");
  const [materiel, setMateriel] = useState<Materiel[]>(["Barre", "Haltères", "Machine"]);
  const [deload, setDeload] = useState(true);
  const [sportifId, setSportifId] = useState<string | null>(params.sportif ?? null);
  const [startDate, setStartDate] = useState(todayIso());
  const [previewWeek, setPreviewWeek] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      try {
        setSportifs(await getMySportifs(user.uid));
      } catch {
        setSportifs([]);
      }
    });
    return unsubscribe;
  }, []);

  const tooFewDays = jours.length < 2;
  const block = useMemo(
    () => (tooFewDays ? null : generateBlock({ objectif, niveau, semaines, jours, materiel, charge, deload })),
    [objectif, niveau, semaines, jours, materiel, charge, deload, tooFewDays]
  );

  useEffect(() => {
    if (previewWeek >= semaines) setPreviewWeek(0);
  }, [semaines, previewWeek]);

  const sportif = sportifs.find((s) => s.uid === sportifId) ?? null;
  const firstMonday = firstMondayFrom(startDate || todayIso());

  function toggleJour(i: number) {
    setJours((prev) => {
      if (prev.includes(i)) return prev.filter((j) => j !== i);
      if (prev.length >= 6) return prev;
      return [...prev, i].sort((a, b) => a - b);
    });
  }

  function toggleMateriel(m: Materiel) {
    setMateriel((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function handleCreate() {
    if (!uid || !block) return;
    setSaving(true);
    setError(null);
    try {
      const sportifName = sportif ? `${sportif.firstName} ${sportif.lastName}`.trim() : null;
      const id = await createProgrammeWithSeances(
        uid,
        block.nom,
        block.seances,
        sportif?.uid ?? null,
        sportifName,
        block.objectifBibliotheque
      );
      if (sportif) {
        // Chaque séance est posée sur son jour dans le planning du sportif.
        await Promise.all(
          block.seances.map((s, i) =>
            addScheduledSession({
              coachId: uid,
              sportifId: sportif.uid,
              date: addDays(firstMonday, block.seanceWeek[i] * 7 + block.seanceDay[i]),
              kind: "programme",
              titre: s.nom,
              programmeId: id,
              programmeNom: block.nom,
              seanceId: s.id,
              seanceNom: s.nom,
              cardio: null,
            })
          )
        );
      }
      router.replace(`/coach/programme/${id}`);
    } catch {
      setError("La création a échoué. Vérifie ta connexion et réessaie.");
      setSaving(false);
    }
  }

  const weekSeances = block
    ? block.seances.map((s, i) => ({ s, i })).filter(({ i }) => block.seanceWeek[i] === previewWeek)
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Générer un bloc</Text>
      <Text style={styles.subtitle}>
        Les séances se construisent selon le niveau et l'objectif. Tu les relis et les modifies ensuite dans l'éditeur.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Objectif</Text>
        <View style={styles.chipRow}>
          {GEN_OBJECTIFS.map((o) => (
            <Chip key={o.key} label={o.label} active={objectif === o.key} onPress={() => setObjectif(o.key)} />
          ))}
        </View>

        <Text style={styles.label}>Niveau</Text>
        <View style={styles.chipRow}>
          {GEN_NIVEAUX.map((n) => (
            <Chip key={n.key} label={n.label} active={niveau === n.key} onPress={() => setNiveau(n.key)} />
          ))}
        </View>

        <Text style={styles.label}>Durée</Text>
        <View style={styles.chipRow}>
          {[3, 4, 5, 6].map((n) => (
            <Chip key={n} label={`${n} semaines`} active={semaines === n} onPress={() => setSemaines(n)} />
          ))}
        </View>

        <Text style={styles.label}>Jours des séances ({jours.length} par semaine)</Text>
        <View style={styles.chipRow}>
          {JOURS.map((j, i) => (
            <Chip key={j} label={j} active={jours.includes(i)} onPress={() => toggleJour(i)} />
          ))}
        </View>
        {tooFewDays && <Text style={styles.warning}>Coche au moins 2 jours.</Text>}

        <Text style={styles.label}>Intensité en</Text>
        <View style={styles.chipRow}>
          <Chip label="RPE" active={charge === "rpe"} onPress={() => setCharge("rpe")} />
          <Chip label="% 1RM" active={charge === "1rm"} onPress={() => setCharge("1rm")} />
        </View>

        <Text style={styles.label}>Matériel disponible (poids du corps toujours inclus)</Text>
        <View style={styles.chipRow}>
          {GEN_MATERIELS.map((m) => (
            <Chip key={m} label={m} active={materiel.includes(m)} onPress={() => toggleMateriel(m)} />
          ))}
        </View>

        <TouchableOpacity style={styles.toggleRow} onPress={() => setDeload((v) => !v)}>
          <Ionicons name={deload ? "checkbox" : "square-outline"} size={20} color={Colors.primary} />
          <Text style={styles.toggleText}>Dernière semaine allégée (moins de séries, charge réduite)</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Pour</Text>
        <View style={styles.chipRow}>
          <Chip label="Bibliothèque (sans sportif)" active={sportifId === null} onPress={() => setSportifId(null)} />
          {sportifs.map((s) => (
            <Chip
              key={s.uid}
              label={`${s.firstName} ${s.lastName}`}
              active={sportifId === s.uid}
              onPress={() => setSportifId(s.uid)}
            />
          ))}
        </View>

        {sportif && (
          <>
            <Text style={styles.label}>Début (premier lundi à partir de cette date)</Text>
            <DateField value={startDate} onChange={setStartDate} />
            <Text style={styles.hint}>
              Les séances seront posées dans son planning à partir du lundi {formatShort(firstMonday)}.
            </Text>
          </>
        )}
      </View>

      {block && (
        <>
          <View style={styles.card}>
            <Text style={styles.previewTitle}>{block.nom}</Text>
            <Text style={styles.previewMeta}>
              {block.planification} · {block.seances.length} séances
            </Text>
            {block.notes.map((n) => (
              <View key={n} style={styles.noteRow}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
                <Text style={styles.noteText}>{n}</Text>
              </View>
            ))}
          </View>

          <View style={styles.weekRow}>
            {block.semaines.map((w) => (
              <TouchableOpacity
                key={w.index}
                style={[styles.weekChip, previewWeek === w.index && styles.weekChipActive]}
                onPress={() => setPreviewWeek(w.index)}
              >
                <Text style={[styles.weekNum, previewWeek === w.index && styles.weekTextActive]}>S{w.index + 1}</Text>
                <Text style={[styles.weekLabel, previewWeek === w.index && styles.weekTextActive]} numberOfLines={1}>
                  {w.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {weekSeances.map(({ s, i }) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.seanceTitle}>
                {s.nom}
                <Text style={styles.seanceDay}>
                  {"  "}
                  {JOURS[block.seanceDay[i]]}
                  {sportif ? ` ${formatShort(addDays(firstMonday, block.seanceWeek[i] * 7 + block.seanceDay[i]))}` : ""}
                </Text>
              </Text>
              {s.blocs.map((b) => (
                <View key={b.id} style={[styles.bloc, { borderLeftColor: b.couleur }]}>
                  <Text style={styles.blocName}>
                    {b.nom}
                    {blocModeLabel(b) ? ` · ${blocModeLabel(b)}` : ""}
                  </Text>
                  {b.exercices.map((e) => (
                    <View key={e.id} style={styles.exRow}>
                      <Text style={styles.exName} numberOfLines={1}>
                        {e.exerciceNom}
                      </Text>
                      <Text style={styles.exDose}>
                        {e.series} × {e.repetitions} ·{" "}
                        {e.chargeType === "1rm" ? `${e.chargeValeur} % 1RM` : `RPE ${e.chargeValeur}`} · R {e.reposSeries}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}

          {!!error && <Text style={styles.warning}>{error}</Text>}

          <TouchableOpacity style={styles.primaryButton} onPress={handleCreate} disabled={saving || !uid}>
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {sportif ? `Créer et planifier pour ${sportif.firstName}` : "Créer dans la bibliothèque"}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 70, paddingBottom: 80, maxWidth: 820, width: "100%", alignSelf: "center" },
  backButton: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backText: { fontSize: 14, color: Colors.text, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 20 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "700", color: Colors.text, marginBottom: 8, marginTop: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceAlt,
  },
  chipActive: { backgroundColor: Colors.primaryDark },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.text },
  chipTextActive: { color: Colors.white },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 10 },
  toggleText: { flex: 1, fontSize: 13, color: Colors.text },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: -6 },
  warning: { fontSize: 13, color: "#C2410C", marginBottom: 10 },
  previewTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  previewMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, marginBottom: 10 },
  noteRow: { flexDirection: "row", gap: 6, marginTop: 6, alignItems: "flex-start" },
  noteText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },
  weekRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  weekChip: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  weekChipActive: { backgroundColor: Colors.primaryDark },
  weekNum: { fontSize: 13, fontWeight: "700", color: Colors.text },
  weekLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  weekTextActive: { color: Colors.white },
  seanceTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  seanceDay: { fontSize: 12, fontWeight: "500", color: Colors.textSecondary },
  bloc: { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10 },
  blocName: { fontSize: 13, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  exRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, paddingVertical: 2 },
  exName: { flex: 1, fontSize: 13, color: Colors.text },
  exDose: { fontSize: 12, color: Colors.textSecondary },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
});
