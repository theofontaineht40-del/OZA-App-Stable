import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useIsCoachSpace } from "../../../../../components/oza/use-oza-base";
import ExerciseThumb from "../../../../../components/exercise-thumb";
import GradientFill from "../../../../../components/gradient-fill";
import SessionCompleteOverlay from "../../../../../components/session-complete-overlay";
import { Colors } from "../../../../../constants/colors";
import { EXERCISE_LIBRARY } from "../../../../../constants/exercise-library";
import { Type } from "../../../../../constants/tokens";
import { auth } from "../../../../../firebase";
import { completeOzaSeance, getOzaProgram, OzaProgram, startOzaProgram } from "../../../../../services/oza-programs";
import { Bloc, BlocExercice, BlocRole, estimateSeanceMinutes, Seance } from "../../../../../services/programmes";
import { addSession } from "../../../../../services/tracking";
import { showAlert } from "../../../../../utils/alert";

const LIB = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));

const ROLE_LABEL: Record<BlocRole, string> = {
  echauffement: "Échauffement",
  specifique: "Préparation spécifique",
  principal: "Exercices",
};

function describe(ex: BlocExercice): string {
  const parts = [`${ex.series} × ${ex.repetitions}`];
  if (ex.reposSeries) parts.push(`repos ${ex.reposSeries}`);
  if (ex.tempo) parts.push(`tempo ${ex.tempo}`);
  if (ex.chargeValeur) parts.push(ex.chargeType === "rpe" ? `RPE ${ex.chargeValeur}` : ex.chargeType === "1rm" ? `${ex.chargeValeur} % 1RM` : `${ex.chargeValeur} kg`);
  return parts.join(" · ");
}

// Détail d'une séance OZA Programs : blocs (échauffement, préparation
// spécifique, exercices), séries / répétitions / repos / tempo / RPE, consignes
// techniques au tap. « Terminer » enregistre la séance dans l'historique et
// avance le point de reprise.
export default function OzaSeanceScreen() {
  const { programId, seanceId, week } = useLocalSearchParams<{ programId: string; seanceId: string; week?: string }>();
  const weekNumber = Number(week ?? 1) || 1;
  const uid = auth.currentUser?.uid;
  const isCoach = useIsCoachSpace();
  const [program, setProgram] = useState<OzaProgram | null | undefined>(undefined);
  const [openId, setOpenId] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ rpe: number; duration: number; load: number } | null>(null);

  useEffect(() => {
    if (!programId) return;
    getOzaProgram(programId).then(setProgram).catch(() => setProgram(null));
  }, [programId]);

  const seance: Seance | undefined = program?.semaines.flatMap((w) => w.seances).find((s) => s.id === seanceId);

  useEffect(() => {
    // Ouvrir une séance démarre le programme s'il ne l'était pas (point de reprise).
    if (uid && program && !isCoach) startOzaProgram(uid, program).catch(() => {});
  }, [uid, program?.id]);

  useEffect(() => {
    if (seance && !duration) setDuration(String(estimateSeanceMinutes(seance) || 45));
  }, [seance?.id]);

  if (program === undefined) return <View style={styles.container}><ActivityIndicator style={{ marginTop: 120 }} color={Colors.primary} /></View>;
  if (!program || !seance) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", gap: 10 }]}>
        <Text style={styles.title}>Séance introuvable</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Retour</Text></TouchableOpacity>
      </View>
    );
  }

  // Les blocs sans rôle (programmes importés) sont traités comme travail principal.
  const blocs: Bloc[] = seance.blocs;

  async function finish() {
    if (!uid || !program || !seance || rpe === null) return;
    const minutes = Math.max(1, parseInt(duration, 10) || 0);
    setSaving(true);
    try {
      const record = await addSession({
        sportifUid: uid,
        coachId: null,
        rpe,
        duration: minutes,
        programmeInfo: { programmeId: program.id, programmeNom: program.nom, seanceId: seance.id, seanceNom: seance.nom, exerciseLogs: [] },
      });
      await completeOzaSeance(uid, program, weekNumber, seance.id);
      setFinishing(false);
      setDone({ rpe, duration: minutes, load: record.load });
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.eyebrow}>{program.nom.toUpperCase()} · SEMAINE {weekNumber}</Text>
          <Text style={styles.title}>{seance.nom}</Text>
          <Text style={styles.sub}>
            {blocs.reduce((n, b) => n + b.exercices.length, 0)} exercices{estimateSeanceMinutes(seance) > 0 ? ` · ≈ ${estimateSeanceMinutes(seance)} min` : ""}
          </Text>
        </View>

        <View style={styles.body}>
          {blocs.map((bloc) => (
            <View key={bloc.id} style={styles.bloc}>
              <View style={styles.blocHead}>
                <Text style={styles.blocName}>{bloc.role ? ROLE_LABEL[bloc.role] : bloc.nom}</Text>
                {!!bloc.objectif && <Text style={styles.blocObjectif}>{bloc.objectif}</Text>}
              </View>
              {bloc.exercices.map((ex, i) => {
                const open = openId === ex.id;
                return (
                  <TouchableOpacity key={ex.id} style={[styles.exRow, i > 0 && styles.exBorder]} onPress={() => setOpenId(open ? null : ex.id)} activeOpacity={0.85}>
                    <ExerciseThumb exercise={LIB.get(ex.exerciceId)} size={54} radius={12} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.exName}>{ex.exerciceNom}</Text>
                      <Text style={styles.exMeta}>{describe(ex)}</Text>
                      {open && (
                        <Text style={styles.exConsigne}>
                          {ex.commentaires ? ex.commentaires : "Pas de consigne technique pour cet exercice."}
                        </Text>
                      )}
                    </View>
                    <Ionicons name={open ? "chevron-up" : "information-circle-outline"} size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          {blocs.length === 0 && <Text style={styles.sub}>Cette séance est en cours de rédaction.</Text>}
        </View>
      </ScrollView>

      {/* Le coach consulte la séance ; seul le sportif l'enregistre. */}
      {!isCoach && (
      <View style={styles.bar}>
        <TouchableOpacity style={styles.cta} onPress={() => setFinishing(true)} activeOpacity={0.88}>
          <GradientFill />
          <Text style={styles.ctaText}>Terminer la séance</Text>
        </TouchableOpacity>
      </View>
      )}

      {finishing && (
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Comment s'est passée la séance ?</Text>
            <Text style={styles.sheetLabel}>RPE (0 = repos, 10 = effort maximal)</Text>
            <View style={styles.rpeRow}>
              {Array.from({ length: 11 }, (_, i) => (
                <TouchableOpacity key={i} style={[styles.rpeChip, rpe === i && styles.rpeOn]} onPress={() => setRpe(i)}>
                  <Text style={[styles.rpeText, rpe === i && { color: Colors.white }]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sheetLabel}>Durée (minutes)</Text>
            <TextInput style={styles.input} value={duration} onChangeText={setDuration} keyboardType="numeric" />
            <View style={styles.sheetActions}>
              <TouchableOpacity onPress={() => setFinishing(false)} disabled={saving}><Text style={styles.cancel}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.save, rpe === null && { opacity: 0.4 }]} onPress={finish} disabled={rpe === null || saving}>
                <GradientFill />
                {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Enregistrer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <SessionCompleteOverlay
        visible={done !== null}
        rpe={done?.rpe ?? 0}
        duration={done?.duration ?? 0}
        load={done?.load ?? 0}
        onDone={() => {
          setDone(null);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 18, width: "100%", maxWidth: 760, alignSelf: "center" },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.4, color: Colors.primary },
  title: { fontFamily: Type.heading, fontSize: 32, color: Colors.text, marginTop: 4 },
  sub: { fontSize: 13.5, color: Colors.textSecondary, marginTop: 4 },
  link: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  body: { paddingHorizontal: 20, gap: 14, width: "100%", maxWidth: 760, alignSelf: "center" },
  bloc: { backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  blocHead: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: Colors.accentTint },
  blocName: { fontSize: 12, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase", color: Colors.canard },
  blocObjectif: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  exRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  exBorder: { borderTopWidth: 1, borderTopColor: Colors.grayLight },
  exName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  exMeta: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 2 },
  exConsigne: { fontSize: 13, color: Colors.text, marginTop: 8, lineHeight: 19, backgroundColor: Colors.surfaceAlt, borderRadius: 10, padding: 10 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 22, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: "center" },
  cta: { width: "100%", maxWidth: 760, overflow: "hidden", height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary },
  ctaText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  sheetBackdrop: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" } as any,
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30, gap: 8 },
  sheetTitle: { fontFamily: Type.heading, fontSize: 22, color: Colors.text },
  sheetLabel: { fontSize: 12.5, fontWeight: "700", color: Colors.textSecondary, marginTop: 6 },
  rpeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  rpeChip: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface },
  rpeOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rpeText: { fontSize: 14, fontWeight: "700", color: Colors.text },
  input: { height: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14, fontSize: 16, color: Colors.text },
  sheetActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  cancel: { fontSize: 15, fontWeight: "600", color: Colors.textSecondary, padding: 10 },
  save: { overflow: "hidden", minWidth: 150, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary },
  saveText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
