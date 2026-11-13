import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import DateField from "../../components/date-field";
import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import { describeSegment, getCardioReferences, targetFor } from "../../services/cardio";
import {
  generateRacePlan,
  PHASE_LABEL,
  RACE_DISTANCES,
  RACE_NIVEAUX,
  RaceDistance,
  RaceNiveau,
} from "../../services/race-plan";
import { addScheduledSession } from "../../services/schedule";
import { getMySportifs, SportifSummary } from "../../services/tracking";
import { showAlert } from "../../utils/alert";

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoOf(d);
}

function formatShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Plan de course sur mesure : se calcule à partir de la date de course, puis
// pose chaque séance cardio dans le planning du sportif.
export default function CoachPlanCourseScreen() {
  const params = useLocalSearchParams<{ sportif?: string }>();
  const [uid, setUid] = useState<string | null>(null);
  const [sportifs, setSportifs] = useState<SportifSummary[]>([]);
  const [sportifId, setSportifId] = useState<string | null>(params.sportif ?? null);

  const [distance, setDistance] = useState<RaceDistance>("10k");
  const [niveau, setNiveau] = useState<RaceNiveau>("intermediaire");
  const [raceDate, setRaceDate] = useState(inDays(70));
  const [semaines, setSemaines] = useState(10);
  const [jours, setJours] = useState<number[]>([1, 3, 6]);
  const [vmaText, setVmaText] = useState("");
  const [blessure, setBlessure] = useState(false);
  const [openWeek, setOpenWeek] = useState<number | null>(0);
  const [saving, setSaving] = useState(false);

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

  // VMA pré-remplie depuis les références cardio du sportif.
  useEffect(() => {
    if (!sportifId) return;
    let cancelled = false;
    getCardioReferences(sportifId)
      .then((refs) => {
        if (!cancelled) setVmaText(refs.vma ? String(refs.vma).replace(".", ",") : "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sportifId]);

  const vma = useMemo(() => {
    const n = parseFloat(vmaText.replace(",", "."));
    return Number.isFinite(n) && n > 5 && n < 30 ? n : null;
  }, [vmaText]);

  const today = isoOf(new Date());
  const tooFewDays = jours.length < 2;
  const raceInPast = !raceDate || raceDate <= today;

  const plan = useMemo(
    () =>
      tooFewDays || raceInPast
        ? null
        : generateRacePlan({ distance, niveau, raceDate, semaines, jours, vma, blessure, today }),
    [distance, niveau, raceDate, semaines, jours, vma, blessure, today, tooFewDays, raceInPast]
  );

  const sportif = sportifs.find((s) => s.uid === sportifId) ?? null;
  const refs = { vma, pma: null, fcMax: null };

  function toggleJour(i: number) {
    setJours((prev) => {
      if (prev.includes(i)) return prev.filter((j) => j !== i);
      if (prev.length >= 6) return prev;
      return [...prev, i].sort((a, b) => a - b);
    });
  }

  function pickDistance(d: RaceDistance) {
    setDistance(d);
    setSemaines(RACE_DISTANCES.find((x) => x.key === d)!.defaultWeeks);
  }

  async function handleCreate() {
    if (!uid || !sportif || !plan) return;
    setSaving(true);
    try {
      await Promise.all(
        plan.sessions.map((s) =>
          addScheduledSession({
            coachId: uid,
            sportifId: sportif.uid,
            date: s.date,
            kind: "cardio",
            titre: s.titre,
            programmeId: null,
            programmeNom: null,
            seanceId: null,
            seanceNom: null,
            cardio: s.spec,
          })
        )
      );
      router.replace(`/coach/sportif/${sportif.uid}/planning`);
    } catch (error) {
      setSaving(false);
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Plan de course sur mesure</Text>
      <Text style={styles.subtitle}>
        Date, séances, niveau : le plan se calcule tout seul, puis chaque séance est posée dans le planning du sportif.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Pour</Text>
        {sportifs.length === 0 ? (
          <Text style={styles.hint}>Aucun sportif suivi pour l'instant.</Text>
        ) : (
          <View style={styles.chipRow}>
            {sportifs.map((s) => (
              <Chip
                key={s.uid}
                label={`${s.firstName} ${s.lastName}`}
                active={sportifId === s.uid}
                onPress={() => setSportifId(s.uid)}
              />
            ))}
          </View>
        )}

        <Text style={styles.label}>Course</Text>
        <View style={styles.chipRow}>
          {RACE_DISTANCES.map((d) => (
            <Chip key={d.key} label={d.label} active={distance === d.key} onPress={() => pickDistance(d.key)} />
          ))}
        </View>

        <Text style={styles.label}>Date de la course</Text>
        <DateField value={raceDate} onChange={setRaceDate} />
        {raceInPast && <Text style={styles.warning}>Choisis une date de course à venir.</Text>}

        <Text style={styles.label}>Durée du plan</Text>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepButton} onPress={() => setSemaines((n) => Math.max(6, n - 1))}>
            <Ionicons name="remove" size={18} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.stepValue}>{semaines} semaines</Text>
          <TouchableOpacity style={styles.stepButton} onPress={() => setSemaines((n) => Math.min(24, n + 1))}>
            <Ionicons name="add" size={18} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Niveau</Text>
        <View style={styles.chipRow}>
          {RACE_NIVEAUX.map((n) => (
            <Chip key={n.key} label={n.label} active={niveau === n.key} onPress={() => setNiveau(n.key)} />
          ))}
        </View>

        <Text style={styles.label}>Jours de course ({jours.length} cochés — la sortie longue va sur le dernier)</Text>
        <View style={styles.chipRow}>
          {JOURS.map((j, i) => (
            <Chip key={j} label={j} active={jours.includes(i)} onPress={() => toggleJour(i)} />
          ))}
        </View>
        {tooFewDays && <Text style={styles.warning}>Coche au moins 2 jours.</Text>}

        <Text style={styles.label}>VMA (km/h)</Text>
        <TextInput
          style={styles.input}
          value={vmaText}
          onChangeText={setVmaText}
          placeholder="Ex : 15,5"
          placeholderTextColor={Colors.textSecondary}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity style={styles.toggleRow} onPress={() => setBlessure((v) => !v)}>
          <Ionicons name={blessure ? "checkbox" : "square-outline"} size={20} color={Colors.primary} />
          <Text style={styles.toggleText}>Blessure dans les 12 derniers mois (progression plus lente)</Text>
        </TouchableOpacity>
      </View>

      {plan && (
        <>
          <View style={styles.card}>
            <Text style={styles.previewTitle}>
              {RACE_DISTANCES.find((d) => d.key === distance)!.label} le {formatShort(raceDate)}
            </Text>
            <Text style={styles.previewMeta}>
              {plan.semaines.length} semaines · {plan.sessions.length} séances
              {plan.tempsEstime ? ` · temps estimé ${plan.tempsEstime}` : ""}
            </Text>
            {plan.notes.map((n) => (
              <View key={n} style={styles.noteRow}>
                <Ionicons
                  name={plan.raccourci && n.startsWith("La course") ? "alert-circle-outline" : "information-circle-outline"}
                  size={16}
                  color={plan.raccourci && n.startsWith("La course") ? "#C2410C" : Colors.primary}
                />
                <Text style={styles.noteText}>{n}</Text>
              </View>
            ))}
          </View>

          {plan.semaines.map((w) => {
            const sessions = plan.sessions.filter((s) => s.semaine === w.index);
            const open = openWeek === w.index;
            return (
              <View key={w.index} style={styles.weekCard}>
                <TouchableOpacity style={styles.weekHeader} onPress={() => setOpenWeek(open ? null : w.index)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weekTitle}>
                      S{w.index + 1} · {PHASE_LABEL[w.phase]}
                      {w.allegee ? " · allégée" : ""}
                    </Text>
                    <Text style={styles.weekMeta}>
                      Semaine du {formatShort(w.monday)} · {sessions.length} séance{sessions.length > 1 ? "s" : ""} · ≈ {w.minutes} min
                    </Text>
                  </View>
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
                {open &&
                  sessions.map((s) => (
                    <View key={s.date + s.titre} style={styles.session}>
                      <Text style={styles.sessionTitle}>
                        {JOURS[(new Date(`${s.date}T12:00:00`).getDay() + 6) % 7]} {formatShort(s.date)} ·{" "}
                        {s.titre.replace(/^S\d+ · /, "")}
                      </Text>
                      {s.spec.segments.map((seg, k) => {
                        const target = targetFor("vma", seg.effortPct, refs);
                        return (
                          <Text key={k} style={styles.segment}>
                            {describeSegment(seg)}
                            {target ? ` (${target})` : ""}
                          </Text>
                        );
                      })}
                    </View>
                  ))}
              </View>
            );
          })}

          <TouchableOpacity
            style={[styles.primaryButton, !sportif && styles.primaryButtonDisabled]}
            onPress={handleCreate}
            disabled={saving || !sportif || !uid}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {sportif ? `Planifier ${plan.sessions.length} séances pour ${sportif.firstName}` : "Choisis un sportif"}
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
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.surfaceAlt },
  chipActive: { backgroundColor: Colors.primaryDark },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.text },
  chipTextActive: { color: Colors.white },
  stepper: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  stepValue: { fontSize: 15, fontWeight: "700", color: Colors.text, minWidth: 100, textAlign: "center" },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 10 },
  toggleText: { flex: 1, fontSize: 13, color: Colors.text },
  hint: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  warning: { fontSize: 13, color: "#C2410C", marginBottom: 10 },
  previewTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  previewMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, marginBottom: 10 },
  noteRow: { flexDirection: "row", gap: 6, marginTop: 6, alignItems: "flex-start" },
  noteText: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },
  weekCard: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
  weekHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  weekTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  weekMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  session: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.grayLight },
  sessionTitle: { fontSize: 13, fontWeight: "700", color: Colors.text, marginBottom: 4 },
  segment: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  primaryButtonDisabled: { backgroundColor: Colors.grayMedium },
  primaryButtonText: { color: Colors.white, fontSize: 15, fontWeight: "700" },
});
