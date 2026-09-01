import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ExerciseSetEditor, { SetEntry } from "../../../../components/exercise-set-editor";
import PhotoBackground from "../../../../components/photo-background";
import PulseDot from "../../../../components/pulse-dot";
import { Colors } from "../../../../constants/colors";
import { auth, db } from "../../../../firebase";
import { ChargeType, getProgrammesForCoachAndSportif, Programme } from "../../../../services/programmes";
import { getRelation } from "../../../../services/relations";
import { addSession, ExerciseLog } from "../../../../services/tracking";
import { showAlert } from "../../../../utils/alert";

const RPE_SCALE = Array.from({ length: 11 }, (_, i) => i); // 0 à 10

const CHARGE_LABELS: Record<ChargeType, string> = {
  "1rm": "% 1RM",
  rpe: "RPE",
  libre: "kg",
};

type ExerciseState = {
  exerciceId: string;
  exerciceNom: string;
  seriesPrescrites: string;
  repetitionsPrescrites: string;
  sets: SetEntry[];
};

// Charge la plus élevée parmi les séries saisies — même convention que côté
// sportif (app/sportif/programme/[id]/seance/[seanceId].tsx), pour que la
// détection de record et la progression par exercice lisent la même chose
// peu importe qui a loggé la séance.
function maxCharge(sets: SetEntry[]): string {
  const values = sets.map((s) => parseFloat(s.charge)).filter((n) => !isNaN(n));
  return values.length > 0 ? String(Math.max(...values)) : "";
}

export default function CoachNouvelleSeanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | null>(null);
  const [selectedSeanceId, setSelectedSeanceId] = useState<string | null>(null);
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
  const [rpe, setRpe] = useState<number | null>(null);
  const [duration, setDuration] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setCoachUid(user.uid);

      try {
        const userSnap = await getDoc(doc(db, "users", id));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setName(`${data.firstName} ${data.lastName}`);
        }

        const rel = await getRelation(id, user.uid);
        const isPrincipal = rel?.type === "principal";
        setAuthorized(isPrincipal);

        if (isPrincipal) {
          const programmeData = await getProgrammesForCoachAndSportif(user.uid, id);
          setProgrammes(programmeData);
        }
      } catch {
        setAuthorized(false);
      }
    });

    return unsubscribe;
  }, [id]);

  const selectedProgramme = programmes.find((p) => p.id === selectedProgrammeId) ?? null;
  const selectedSeance = selectedProgramme?.seances.find((s) => s.id === selectedSeanceId) ?? null;

  function selectSeance(programme: Programme, seanceId: string) {
    const seance = programme.seances.find((s) => s.id === seanceId);
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
        };
      }
    }
    setExerciseStates(states);
    setSelectedProgrammeId(programme.id);
    setSelectedSeanceId(seanceId);
  }

  function clearSeance() {
    setSelectedProgrammeId(null);
    setSelectedSeanceId(null);
    setExerciseStates({});
  }

  function updateExercise(exerciceId: string, patch: Partial<ExerciseState>) {
    setExerciseStates((prev) => ({ ...prev, [exerciceId]: { ...prev[exerciceId], ...patch } }));
  }

  async function handleSubmit() {
    if (!coachUid || !id) return;

    const durationNumber = parseInt(duration, 10);
    if (rpe === null) {
      showAlert("RPE manquant", "Sélectionnez le ressenti d'effort (0 à 10).");
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
      complete: true,
    }));

    setSubmitting(true);
    try {
      await addSession({
        sportifUid: id,
        coachId: coachUid,
        rpe,
        duration: durationNumber,
        commentaire,
        loggedBy: "coach",
        programmeInfo:
          selectedProgramme && selectedSeance
            ? {
                programmeId: selectedProgramme.id,
                programmeNom: selectedProgramme.nom,
                seanceNom: selectedSeance.nom,
                exerciseLogs,
              }
            : undefined,
      });
      showAlert("Séance enregistrée", "La charge d'entraînement a été calculée.");
      router.back();
    } catch {
      showAlert("Erreur", "Impossible d'enregistrer la séance pour le moment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authorized === null || !name) {
    return <View style={styles.container} />;
  }

  if (!authorized) {
    return (
      <View style={styles.container}>
        <PhotoBackground variant="seances" />
        <View style={styles.centeredEmpty}>
          <Ionicons name="lock-closed-outline" size={40} color={Colors.textOnDarkSecondary} />
          <Text style={styles.emptyTitle}>Accès non autorisé</Text>
          <Text style={styles.emptyText}>
            Seul le coach principal de ce sportif peut ajouter une séance.
          </Text>
        </View>
      </View>
    );
  }

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

      <Text style={styles.title}>Nouvelle séance</Text>
      <Text style={styles.subtitle}>Séance encadrée avec {name}</Text>

      {programmes.length > 0 && (
        <>
          <Text style={styles.fieldLabel}>Séance liée à un programme (optionnel)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, !selectedProgrammeId && styles.chipActive]}
              onPress={clearSeance}
            >
              <Text style={[styles.chipText, !selectedProgrammeId && styles.chipTextActive]}>
                Séance libre
              </Text>
            </TouchableOpacity>
            {programmes.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, selectedProgrammeId === p.id && styles.chipActive]}
                onPress={() => {
                  setSelectedProgrammeId(p.id);
                  setSelectedSeanceId(null);
                  setExerciseStates({});
                }}
              >
                <Text style={[styles.chipText, selectedProgrammeId === p.id && styles.chipTextActive]}>
                  {p.nom}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedProgramme && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {selectedProgramme.seances.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, selectedSeanceId === s.id && styles.chipActive]}
                  onPress={() => selectSeance(selectedProgramme, s.id)}
                >
                  <Text style={[styles.chipText, selectedSeanceId === s.id && styles.chipTextActive]}>
                    {s.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {selectedSeance && (
        <View style={{ marginBottom: 8 }}>
          {selectedSeance.blocs.map((bloc) => (
            <View key={bloc.id} style={[styles.blocCard, { borderLeftColor: bloc.couleur }]}>
              <Text style={styles.blocNom}>{bloc.nom}</Text>
              {bloc.exercices.map((ex) => {
                const state = exerciseStates[ex.id];
                if (!state) return null;
                return (
                  <View key={ex.id} style={styles.exerciceCard}>
                    <Text style={styles.exerciceName}>{ex.exerciceNom}</Text>
                    <Text style={styles.prescrit}>
                      Prescrit : {ex.series} × {ex.repetitions}
                      {ex.chargeValeur ? ` · ${ex.chargeValeur} ${CHARGE_LABELS[ex.chargeType]}` : ""}
                      {ex.poidsIndicatif ? ` · ~${ex.poidsIndicatif}kg` : ""}
                    </Text>
                    <ExerciseSetEditor
                      sets={state.sets}
                      onChange={(sets) => updateExercise(ex.id, { sets })}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}

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
          <Text style={styles.primaryButtonText}>Enregistrer la séance</Text>
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
    fontSize: 14,
    color: Colors.textOnDarkSecondary,
    marginTop: 4,
    marginBottom: 24,
  },

  centeredEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.textOnDarkSecondary,
    textAlign: "center",
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
    marginBottom: 12,
  },

  chipRow: {
    marginBottom: 12,
  },

  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    marginRight: 8,
  },

  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textOnDark,
  },

  chipTextActive: {
    color: Colors.white,
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

  exerciceName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },

  prescrit: {
    fontSize: 12,
    color: Colors.textSecondary,
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
