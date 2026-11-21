import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useIsCoachSpace, useOzaBase } from "../../../../components/oza/use-oza-base";
import ExerciseThumb from "../../../../components/exercise-thumb";
import GradientFill from "../../../../components/gradient-fill";
import { Colors } from "../../../../constants/colors";
import { EXERCISE_LIBRARY } from "../../../../constants/exercise-library";
import { OZA_NIVEAUX, OzaSport } from "../../../../constants/oza-sports";
import { Type } from "../../../../constants/tokens";
import { auth } from "../../../../firebase";
import {
  deleteOzaProgram,
  setOzaProgramStatut,
  getOzaProgram,
  isOzaAdmin,
  resetOzaProgress,
  getOzaSport,
  getOzaUserState,
  OzaProgram,
  OzaUserState,
  programProgress,
  seanceKey,
  startOzaProgram,
  toggleOzaFavorite,
} from "../../../../services/oza-programs";
import ConfirmModal from "../../../../components/confirm-modal";
import { assignCopyToSportif, estimateSeanceMinutes, Programme } from "../../../../services/programmes";
import { getMySportifs, SportifSummary } from "../../../../services/tracking";
import { showAlert } from "../../../../utils/alert";

const LIB = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));

// Page d'un programme : infos du cycle, qualités, semaine par semaine, séances,
// favori, démarrer / reprendre.
export default function OzaProgramScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const uid = auth.currentUser?.uid;
  const base = useOzaBase();
  const isCoach = useIsCoachSpace();
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete" | "reset">(null);
  const [myAthletes, setMyAthletes] = useState<SportifSummary[]>([]);
  const [program, setProgram] = useState<OzaProgram | null | undefined>(undefined);
  const [sport, setSport] = useState<OzaSport | null>(null);
  const [state, setState] = useState<OzaUserState | null>(null);
  const [week, setWeek] = useState(1);

  useEffect(() => {
    if (!programId) return;
    getOzaProgram(programId)
      .then((p) => {
        setProgram(p);
        if (p) getOzaSport(p.sportId).then(setSport);
      })
      .catch(() => setProgram(null));
    if (uid) getOzaUserState(uid).then((s) => {
      setState(s);
    });
  }, [programId, uid]);

  const progress = program && state ? state.progress[program.id] : undefined;
  useEffect(() => {
    if (progress) setWeek(progress.currentWeek);
  }, [progress?.currentWeek]);

  const current = useMemo(() => program?.semaines.find((w) => w.numero === week) ?? program?.semaines[0], [program, week]);

  if (program === undefined) return <View style={styles.container}><ActivityIndicator style={{ marginTop: 120 }} color={Colors.primary} /></View>;
  if (program === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Programme introuvable</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Retour</Text></TouchableOpacity>
      </View>
    );
  }

  const fav = !!state?.favorites.includes(program.id);
  const pct = Math.round(programProgress(program, progress) * 100);
  const resumeSeance = progress?.currentSeanceId
    ? program.semaines.flatMap((w) => w.seances.map((s) => ({ w: w.numero, s }))).find((x) => x.s.id === progress.currentSeanceId)
    : null;

  async function onToggleFavorite() {
    if (!uid) return;
    setState(await (async () => {
      const next = await toggleOzaFavorite(uid, program!.id);
      return next;
    })());
  }

  async function onStart() {
    if (!uid || !program) return;
    const next = await startOzaProgram(uid, program);
    setState(next);
    const first = program.semaines[0]?.seances[0];
    const target = next.progress[program.id]?.currentSeanceId ?? first?.id;
    const targetWeek = next.progress[program.id]?.currentWeek ?? 1;
    if (target) router.push(`${base}/seance/${program.id}/${target}?week=${targetWeek}` as never);
  }

  // Coach : donne ce programme à un sportif (copie dans ses programmes).
  async function openAssign() {
    if (!uid) return;
    if (myAthletes.length === 0) setMyAthletes(await getMySportifs(uid));
    setAssignOpen(true);
  }

  async function assignTo(athlete: SportifSummary) {
    if (!uid || !program) return;
    const asProgramme: Programme = {
      id: program.id,
      kind: "programme",
      objectif: null,
      coachId: uid,
      sportifId: athlete.uid,
      sportifName: `${athlete.firstName} ${athlete.lastName}`.trim(),
      nom: program.nom,
      seances: program.semaines.flatMap((w) => w.seances),
      updatedAt: new Date(),
    };
    try {
      await assignCopyToSportif(asProgramme, athlete.uid, asProgramme.sportifName ?? "");
      setAssignOpen(false);
      showAlert("Assigné", `${program.nom} est maintenant dans les programmes de ${athlete.firstName}.`);
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  const from = sport?.couleurs.from ?? Colors.primaryDark;
  const to = sport?.couleurs.to ?? Colors.canard;
  const light = sport?.variant === "clean";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroInner}>
          <View style={styles.heroTop}>
            <TouchableOpacity style={[styles.circle, light && styles.circleLight]} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={light ? Colors.primaryDark : Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circle, light && styles.circleLight]} onPress={onToggleFavorite}>
              <Ionicons name={fav ? "star" : "star-outline"} size={19} color={fav ? Colors.riskMedium : light ? Colors.primaryDark : Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.eyebrow, { color: light ? Colors.primary : Colors.primaryLight }]}>
            {sport?.nom.toUpperCase()} · {sport?.positions.find((p) => p.id === program.positionId)?.nom.toUpperCase() ?? "TOUS POSTES"}
          </Text>
          <Text style={[styles.title, { color: light ? Colors.primaryDark : Colors.white }]}>{program.nom}</Text>
          {!!program.objectif && <Text style={[styles.objectif, { color: light ? "rgba(6,45,43,0.75)" : "rgba(255,255,255,0.85)" }]}>{program.objectif}</Text>}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Meta icon="calendar-outline" text={`${program.dureeSemaines} semaines`} />
            <Meta icon="repeat-outline" text={`${program.seancesParSemaine} séances / sem.`} />
            <Meta icon="speedometer-outline" text={OZA_NIVEAUX.find((n) => n.key === program.niveau)?.label ?? ""} />
          </View>
          {program.materiel.length > 0 && <Text style={styles.line}><Text style={styles.lineLabel}>Matériel : </Text>{program.materiel.join(", ")}</Text>}
          {!!program.publicCible && <Text style={styles.line}><Text style={styles.lineLabel}>Pour qui : </Text>{program.publicCible}</Text>}

          {program.qualites.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Répartition des qualités physiques</Text>
              {program.qualites.map((q) => (
                <View key={q.nom} style={styles.qRow}>
                  <Text style={styles.qName}>{q.nom}</Text>
                  <View style={styles.qTrack}><View style={[styles.qFill, { width: `${Math.min(100, q.pct)}%` }]} /></View>
                  <Text style={styles.qPct}>{q.pct}%</Text>
                </View>
              ))}
            </View>
          )}

          {progress && (
            <View style={styles.progressCard}>
              <Text style={styles.progressText}>{pct} % du cycle réalisé</Text>
              <View style={styles.qTrack}><View style={[styles.qFill, { width: `${pct}%` }]} /></View>
            </View>
          )}

          <Text style={styles.section}>Semaines</Text>
          {program.semaines.length === 0 ? (
            <Text style={styles.line}>Les semaines de ce programme sont en cours de rédaction.</Text>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                {program.semaines.map((w) => {
                  const allDone = w.seances.length > 0 && w.seances.every((s) => progress?.done.includes(seanceKey(w.numero, s.id)));
                  const on = week === w.numero;
                  return (
                    <TouchableOpacity key={w.numero} style={[styles.weekPill, allDone && styles.weekDone, on && styles.weekOn]} onPress={() => setWeek(w.numero)}>
                      {on && <GradientFill />}
                      <Text style={[styles.weekText, on && { color: Colors.white }]}>{w.numero}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {!!current?.theme && <Text style={styles.weekTheme}>{current.theme}</Text>}
              {!!current?.consignes && <Text style={styles.line}>{current.consignes}</Text>}

              {current?.seances.map((s) => {
                const done = !!progress?.done.includes(seanceKey(current.numero, s.id));
                const first = s.blocs.flatMap((b) => b.exercices)[0];
                const count = s.blocs.reduce((n, b) => n + b.exercices.length, 0);
                return (
                  <TouchableOpacity key={s.id} style={styles.seanceRow} activeOpacity={0.88} onPress={() => router.push(`${base}/seance/${program.id}/${s.id}?week=${current.numero}` as never)}>
                    <ExerciseThumb exercise={first ? LIB.get(first.exerciceId) : null} size={50} radius={12} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.seanceName} numberOfLines={1}>{s.nom}</Text>
                      <Text style={styles.seanceMeta}>{count} exercices{estimateSeanceMinutes(s) > 0 ? ` · ≈ ${estimateSeanceMinutes(s)} min` : ""}</Text>
                    </View>
                    <View style={[styles.check, done && styles.checkOn]}>{done && <Ionicons name="checkmark" size={15} color={Colors.white} />}</View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {progress && !isCoach && (
            <TouchableOpacity onPress={() => setConfirm("reset")} style={styles.dangerLink}>
              <Text style={styles.dangerText}>Réinitialiser ma progression</Text>
            </TouchableOpacity>
          )}
          {isOzaAdmin(auth.currentUser?.email) && (
            <TouchableOpacity
              onPress={async () => {
                const next = program.statut === "publie" ? "brouillon" : "publie";
                try {
                  await setOzaProgramStatut(program.id, next);
                  setProgram({ ...program, statut: next });
                  showAlert(next === "publie" ? "Programme publié" : "Repassé en brouillon", next === "publie" ? "Il est maintenant visible par tous les utilisateurs." : "Il n'est plus visible que par toi.");
                } catch (error) {
                  showAlert("Erreur", error instanceof Error ? error.message : String(error));
                }
              }}
              style={styles.dangerLink}
            >
              <Text style={[styles.dangerText, { color: Colors.primary }]}>
                {program.statut === "publie" ? "Administrateur : repasser en brouillon" : "Administrateur : publier ce programme"}
              </Text>
            </TouchableOpacity>
          )}
          {isOzaAdmin(auth.currentUser?.email) && (
            <TouchableOpacity onPress={() => setConfirm("delete")} style={styles.dangerLink}>
              <Text style={styles.dangerText}>Administrateur : supprimer ce programme</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={confirm !== null}
        title={confirm === "delete" ? "Supprimer ce programme" : "Réinitialiser la progression"}
        message={
          confirm === "delete"
            ? "Le programme disparaît de la bibliothèque OZA Programs pour tout le monde. Action définitive."
            : "Tes séances terminées dans ce programme sont effacées de ta progression (ton historique de séances reste). Ton favori est conservé."
        }
        confirmLabel={confirm === "delete" ? "Supprimer" : "Réinitialiser"}
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const action = confirm;
          setConfirm(null);
          try {
            if (action === "delete") {
              await deleteOzaProgram(program.id);
              router.back();
            } else if (uid) {
              setState(await resetOzaProgress(uid, program.id));
            }
          } catch (error) {
            showAlert("Erreur", error instanceof Error ? error.message : String(error));
          }
        }}
      />

      {assignOpen && (
        <View style={styles.assignBackdrop}>
          <View style={styles.assignSheet}>
            <Text style={styles.assignTitle}>Assigner à…</Text>
            <ScrollView style={{ maxHeight: 340 }}>
              {myAthletes.map((a) => (
                <TouchableOpacity key={a.uid} style={styles.assignRow} onPress={() => assignTo(a)}>
                  <Text style={styles.assignName}>{a.firstName} {a.lastName}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
              {myAthletes.length === 0 && <Text style={styles.line}>Aucun sportif suivi pour l'instant.</Text>}
            </ScrollView>
            <TouchableOpacity onPress={() => setAssignOpen(false)}><Text style={[styles.link, { textAlign: "center", padding: 12 }]}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {program.semaines.length > 0 && (
        <View style={styles.bar}>
          {resumeSeance && (
            <TouchableOpacity style={styles.resume} onPress={() => router.push(`${base}/seance/${program.id}/${resumeSeance.s.id}?week=${resumeSeance.w}` as never)}>
              <Text style={styles.resumeText}>Reprendre · Semaine {resumeSeance.w} · {resumeSeance.s.nom}</Text>
              <Ionicons name="play" size={14} color={Colors.primaryLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cta} onPress={isCoach ? openAssign : onStart} activeOpacity={0.88}>
            <GradientFill />
            <Text style={styles.ctaText}>
              {isCoach ? "Assigner à un sportif" : progress ? "Continuer le programme" : "Démarrer le programme"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={14} color={Colors.canard} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: { fontFamily: Type.heading, fontSize: 22, color: Colors.text },
  link: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  hero: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 26, alignItems: "stretch", borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroInner: { width: "100%", maxWidth: 760, alignSelf: "center" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 26 },
  circle: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  circleLight: { backgroundColor: "rgba(255,255,255,0.7)" },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.6 },
  title: { fontFamily: Type.heading, fontSize: 32, lineHeight: 36, marginTop: 4 },
  objectif: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  body: { padding: 20, gap: 12, width: "100%", maxWidth: 760, alignSelf: "center" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.accentTint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  metaText: { fontSize: 12.5, fontWeight: "700", color: Colors.primaryDark },
  line: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  lineLabel: { fontWeight: "700", color: Colors.text },
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: Colors.text },
  qRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qName: { width: 100, fontSize: 12.5, color: Colors.text, fontWeight: "600" },
  qTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Colors.grayLight, overflow: "hidden" },
  qFill: { height: "100%", backgroundColor: Colors.turquoise, borderRadius: 4 },
  qPct: { width: 38, textAlign: "right", fontSize: 12, fontWeight: "700", color: Colors.primaryDark },
  progressCard: { backgroundColor: Colors.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 8 },
  progressText: { fontSize: 13, fontWeight: "700", color: Colors.text },
  section: { fontFamily: Type.heading, fontSize: 22, color: Colors.text, marginTop: 8 },
  weekPill: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  weekDone: { backgroundColor: Colors.accentTint },
  weekOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  weekText: { fontSize: 15, fontWeight: "800", color: Colors.text },
  weekTheme: { fontSize: 15, fontWeight: "800", color: Colors.primaryDark, marginTop: 4 },
  seanceRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: Colors.border },
  seanceName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  seanceMeta: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 2 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: Colors.grayMedium, alignItems: "center", justifyContent: "center" },
  checkOn: { backgroundColor: Colors.turquoise, borderColor: Colors.turquoise },
  assignBackdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end", zIndex: 10 } as any,
  assignSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 26 },
  assignTitle: { fontFamily: Type.heading, fontSize: 22, color: Colors.text, marginBottom: 8 },
  assignRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  assignName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  dangerLink: { alignItems: "center", paddingVertical: 10 },
  dangerText: { fontSize: 13, fontWeight: "700", color: Colors.riskHigh },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 22, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8, alignItems: "center" },
  resume: { width: "100%", maxWidth: 760, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.primaryDark, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  resumeText: { fontSize: 12.5, fontWeight: "700", color: Colors.white, flex: 1 },
  cta: { width: "100%", maxWidth: 760, overflow: "hidden", height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary },
  ctaText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
});
