import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ExerciseSetEditor, { SetEntry } from "../../../../../components/exercise-set-editor";
import PhotoBackground from "../../../../../components/photo-background";
import ProgressionChart, { ProgressionPoint } from "../../../../../components/progression-chart";
import PulseDot from "../../../../../components/pulse-dot";
import RestTimerBar from "../../../../../components/rest-timer-bar";
import SessionCompleteOverlay from "../../../../../components/session-complete-overlay";
import { Colors } from "../../../../../constants/colors";
import { auth, db } from "../../../../../firebase";
import { useRestTimer } from "../../../../../hooks/use-rest-timer";
import { ChargeType, getProgramme, Programme } from "../../../../../services/programmes";
import {
  addSession,
  detectPersonalRecords,
  ExerciseLog,
  getSessionsForSportif,
  PersonalRecord,
  SessionRecord,
} from "../../../../../services/tracking";
import { showAlert } from "../../../../../utils/alert";

const REST_DURATION_SECONDS = 90;

const CHARGE_LABELS: Record<ChargeType, string> = {
  "1rm": "% 1RM",
  rpe: "RPE",
  libre: "kg",
};

const RPE_SCALE = Array.from({ length: 11 }, (_, i) => i);

type ExerciseState = {
  exerciceId: string;
  exerciceNom: string;
  seriesPrescrites: string;
  repetitionsPrescrites: string;
  sets: SetEntry[];
  complete: boolean;
};

// Charge la plus élevée parmi les séries réellement saisies — c'est ce qui
// alimente la détection de record et la progression par exercice (ce sont
// eux qui font foi, pas le détail série par série).
function maxCharge(sets: SetEntry[]): string {
  const values = sets.map((s) => parseFloat(s.charge)).filter((n) => !isNaN(n));
  return values.length > 0 ? String(Math.max(...values)) : "";
}

function ExerciceCheck({
  complete,
  name,
  onToggle,
}: {
  complete: boolean;
  name: string;
  onToggle: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    onToggle();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  }

  return (
    <TouchableOpacity style={styles.exerciceHeader} onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={complete ? "checkmark-circle" : "ellipse-outline"}
          size={22}
          color={complete ? Colors.primary : Colors.grayMedium}
        />
      </Animated.View>
      <Text style={styles.exerciceName}>{name}</Text>
    </TouchableOpacity>
  );
}

// Le ressenti quotidien (Hooper) est enregistré séparément via le check-in
// du jour (app/sportif/checkin.tsx), indépendamment du fait qu'une séance
// soit loggée ou non — cet écran ne couvre donc que l'exécution de la
// séance et le RPE.
export default function SeanceExecutionScreen() {
  const { id, seanceId } = useLocalSearchParams<{ id: string; seanceId: string }>();
  const [uid, setUid] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
  const [rpe, setRpe] = useState<number | null>(null);
  const [duration, setDuration] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<{
    rpe: number;
    duration: number;
    load: number;
    personalRecords: PersonalRecord[];
  } | null>(null);
  const [pastSessions, setPastSessions] = useState<SessionRecord[]>([]);
  const [expandedExerciceId, setExpandedExerciceId] = useState<string | null>(null);
  const restTimer = useRestTimer();

  // Historique de charge par nom d'exercice, à partir des séances déjà
  // loggées — même logique que app/sportif/historique.tsx, réutilisée ici
  // pour afficher l'évolution directement au moment où l'exercice est refait.
  const progressionByExercice = useMemo(() => {
    const map: Record<string, ProgressionPoint[]> = {};
    pastSessions.forEach((session) => {
      session.exerciseLogs?.forEach((log) => {
        const value = parseFloat(log.chargeReelle);
        if (isNaN(value)) return;
        if (!map[log.exerciceNom]) map[log.exerciceNom] = [];
        map[log.exerciceNom].push({ date: session.date, value });
      });
    });
    Object.values(map).forEach((points) => points.sort((a, b) => a.date.localeCompare(b.date)));
    return map;
  }, [pastSessions]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      const [snap, sessions] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getSessionsForSportif(user.uid),
      ]);
      setCoachId(snap.exists() ? snap.data().coachId ?? null : null);
      setPastSessions(sessions);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!id) return;
    getProgramme(id).then((p) => {
      setProgramme(p ?? null);
      const seance = p?.seances.find((s) => s.id === seanceId);
      if (!seance) return;
      const states: Record<string, ExerciseState> = {};
      for (const bloc of seance.blocs) {
        for (const ex of bloc.exercices) {
          const setCount = parseInt(ex.series, 10);
          const initialSets: SetEntry[] = Array.from(
            { length: !isNaN(setCount) && setCount > 0 ? setCount : 1 },
            () => ({ repetitions: ex.repetitions, charge: ex.poidsIndicatif ?? "" })
          );
          states[ex.id] = {
            exerciceId: ex.id,
            exerciceNom: ex.exerciceNom,
            seriesPrescrites: ex.series,
            repetitionsPrescrites: ex.repetitions,
            sets: initialSets,
            complete: false,
          };
        }
      }
      setExerciseStates(states);
    }).catch(() => setProgramme(null));
  }, [id, seanceId]);

  function updateExercise(exerciceId: string, patch: Partial<ExerciseState>) {
    setExerciseStates((prev) => ({ ...prev, [exerciceId]: { ...prev[exerciceId], ...patch } }));
  }

  function toggleComplete(exerciceId: string) {
    updateExercise(exerciceId, { complete: !exerciseStates[exerciceId].complete });
  }

  async function handleSubmit() {
    if (!uid || !programme) return;
    const seance = programme.seances.find((s) => s.id === seanceId);
    if (!seance) return;

    const durationNumber = parseInt(duration, 10);
    if (rpe === null) {
      showAlert("RPE manquant", "Sélectionnez votre ressenti d'effort (0 à 10).");
      return;
    }
    if (!durationNumber || durationNumber <= 0) {
      showAlert("Durée invalide", "Renseignez la durée réelle de la séance.");
      return;
    }

    const exerciseLogs: ExerciseLog[] = Object.values(exerciseStates).map((ex) => ({
      exerciceNom: ex.exerciceNom,
      seriesPrescrites: ex.seriesPrescrites,
      repetitionsPrescrites: ex.repetitionsPrescrites,
      seriesReelles: String(ex.sets.length),
      repetitionsReelles: ex.sets.map((s) => s.repetitions).join("/"),
      chargeReelle: maxCharge(ex.sets),
      sets: ex.sets,
      complete: ex.complete,
    }));

    const personalRecords = detectPersonalRecords(pastSessions, exerciseLogs);

    setSubmitting(true);
    try {
      await addSession({
        sportifUid: uid,
        coachId,
        rpe,
        duration: durationNumber,
        commentaire,
        programmeInfo: {
          programmeId: programme.id,
          programmeNom: programme.nom,
          seanceNom: seance.nom,
          exerciseLogs,
        },
      });
      setCompletedSummary({ rpe, duration: durationNumber, load: rpe * durationNumber, personalRecords });
    } finally {
      setSubmitting(false);
    }
  }

  if (!programme) {
    return <View style={styles.container} />;
  }

  const seance = programme.seances.find((s) => s.id === seanceId);
  if (!seance) {
    return <View style={styles.container} />;
  }

  const doneCount = Object.values(exerciseStates).filter((e) => e.complete).length;
  const totalCount = Object.values(exerciseStates).length;

  return (
    <View style={{ flex: 1 }}>
    <PhotoBackground variant="seances" />
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.textOnDark} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{seance.nom}</Text>
      <Text style={styles.subtitle}>
        {programme.nom} · {doneCount}/{totalCount} exercices faits
      </Text>

      <Text style={styles.sectionTitle}>Exercices</Text>
      {seance.blocs.map((bloc) => (
        <View key={bloc.id} style={[styles.blocCard, { borderLeftColor: bloc.couleur }]}>
          <Text style={styles.blocNom}>{bloc.nom}</Text>

          {bloc.exercices.map((ex) => {
            const state = exerciseStates[ex.id];
            if (!state) return null;
            const history = progressionByExercice[ex.exerciceNom] ?? [];
            const last = history[history.length - 1];
            const prev = history[history.length - 2];
            const delta = last && prev ? last.value - prev.value : null;
            const expanded = expandedExerciceId === ex.id;
            return (
              <View key={ex.id} style={styles.exerciceCard}>
                <ExerciceCheck
                  complete={state.complete}
                  name={ex.exerciceNom}
                  onToggle={() => toggleComplete(ex.id)}
                />
                <Text style={styles.prescrit}>
                  Prescrit : {ex.series} × {ex.repetitions}
                  {ex.chargeValeur ? ` · ${ex.chargeValeur} ${CHARGE_LABELS[ex.chargeType]}` : ""}
                  {ex.poidsIndicatif ? ` · ~${ex.poidsIndicatif}kg` : ""}
                </Text>

                {history.length > 0 && (
                  <TouchableOpacity
                    style={styles.evolutionRow}
                    onPress={() => setExpandedExerciceId(expanded ? null : ex.id)}
                  >
                    <Text style={styles.lastPerfText}>
                      Dernière fois : {last.value}kg
                      {delta !== null && delta !== 0 ? (
                        <Text style={{ color: delta > 0 ? Colors.riskLow : Colors.riskHigh }}>
                          {"  "}
                          {delta > 0 ? "+" : ""}
                          {delta}kg
                        </Text>
                      ) : null}
                    </Text>
                    <View style={styles.evolutionLink}>
                      <Text style={styles.evolutionLinkText}>Évolution</Text>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={13}
                        color={Colors.primary}
                      />
                    </View>
                  </TouchableOpacity>
                )}

                {expanded && (
                  <View style={styles.progressionWrap}>
                    <ProgressionChart points={history} />
                  </View>
                )}

                <ExerciseSetEditor
                  sets={state.sets}
                  onChange={(sets) => updateExercise(ex.id, { sets })}
                />

                <TouchableOpacity
                  style={styles.restButton}
                  onPress={() => restTimer.start(REST_DURATION_SECONDS)}
                >
                  <Ionicons name="time-outline" size={16} color={Colors.primary} />
                  <Text style={styles.restButtonText}>Repos {REST_DURATION_SECONDS}s</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Bilan de la séance</Text>
      <Text style={styles.fieldLabel}>
        RPE de séance — échelle de Borg (0 = repos, 10 = effort maximal)
      </Text>
      <View style={styles.rpeRow}>
        {RPE_SCALE.map((value) => (
          <PulseDot
            key={value}
            style={[styles.rpeDot, rpe === value && styles.rpeDotActive]}
            onPress={() => setRpe(value)}
          >
            <Text style={[styles.rpeDotText, rpe === value && styles.rpeDotTextActive]}>
              {value}
            </Text>
          </PulseDot>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Durée réelle de la séance (minutes)</Text>
      <TextInput
  placeholderTextColor={Colors.textSecondary}
        style={styles.input}
        placeholder="60"
        keyboardType="number-pad"
        value={duration}
        onChangeText={setDuration}
      />

      {rpe !== null && duration ? (
        <View style={styles.loadPreview}>
          <Ionicons name="flash-outline" size={18} color={Colors.primary} />
          <Text style={styles.loadPreviewText}>
            Charge estimée : {rpe * (parseInt(duration, 10) || 0)} UA
          </Text>
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Commentaire (optionnel)</Text>
      <TextInput
  placeholderTextColor={Colors.textSecondary}
        style={styles.commentInput}
        placeholder="Ressenti, points à retenir..."
        multiline
        numberOfLines={3}
        value={commentaire}
        onChangeText={setCommentaire}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Terminer la séance</Text>
        )}
      </TouchableOpacity>

      <SessionCompleteOverlay
        visible={!!completedSummary}
        rpe={completedSummary?.rpe ?? 0}
        duration={completedSummary?.duration ?? 0}
        load={completedSummary?.load ?? 0}
        personalRecords={completedSummary?.personalRecords ?? []}
        onDone={() => {
          setCompletedSummary(null);
          router.push("/sportif");
        }}
      />
    </ScrollView>

    {restTimer.active && (
      <RestTimerBar
        secondsLeft={restTimer.secondsLeft}
        totalSeconds={restTimer.totalSeconds}
        running={restTimer.running}
        onPauseResume={() => (restTimer.running ? restTimer.pause() : restTimer.resume())}
        onAdjust={restTimer.addSeconds}
        onDismiss={restTimer.dismiss}
      />
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backText: {
    fontSize: 14,
    color: Colors.textOnDark,
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textOnDark,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textOnDarkSecondary,
    marginTop: 4,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginBottom: 12,
  },

  blocCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  blocNom: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },

  exerciceCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },

  exerciceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  exerciceName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  prescrit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },

  evolutionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: -4,
    marginBottom: 12,
  },

  lastPerfText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  evolutionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  evolutionLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  progressionWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },

  restButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.accentTint,
  },

  restButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
    marginBottom: 12,
  },

  rpeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },

  rpeDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },

  rpeDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  rpeDotText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  rpeDotTextActive: {
    color: Colors.white,
  },

  input: {
    color: Colors.text,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },

  commentInput: {
    color: Colors.text,
    minHeight: 90,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 24,
    textAlignVertical: "top",
  },

  loadPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.accentTint,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  loadPreviewText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
