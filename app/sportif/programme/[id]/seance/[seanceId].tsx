import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../../../../../constants/colors";
import { auth, db } from "../../../../../firebase";
import { getProgramme, Programme } from "../../../../../services/programmes";
import { addSession, addWellnessEntry, ExerciseLog } from "../../../../../services/tracking";

type WellnessKey = "sommeil" | "fatigue" | "courbatures" | "stress" | "humeur";
type WellnessState = Record<WellnessKey, number>;

const WELLNESS_ITEMS: { key: WellnessKey; label: string }[] = [
  { key: "sommeil", label: "Sommeil" },
  { key: "fatigue", label: "Fatigue" },
  { key: "courbatures", label: "Courbatures" },
  { key: "stress", label: "Stress" },
  { key: "humeur", label: "Humeur" },
];

const RPE_SCALE = Array.from({ length: 11 }, (_, i) => i);

type ExerciseState = {
  exerciceId: string;
  exerciceNom: string;
  seriesPrescrites: string;
  repetitionsPrescrites: string;
  seriesReelles: string;
  repetitionsReelles: string;
  chargeReelle: string;
  complete: boolean;
};

export default function SeanceExecutionScreen() {
  const { id, seanceId } = useLocalSearchParams<{ id: string; seanceId: string }>();
  const [uid, setUid] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
  const [wellness, setWellness] = useState<WellnessState>({
    sommeil: 3,
    fatigue: 3,
    courbatures: 3,
    stress: 3,
    humeur: 3,
  });
  const [rpe, setRpe] = useState<number | null>(null);
  const [duration, setDuration] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      setCoachId(snap.exists() ? snap.data().coachId ?? null : null);
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
          states[ex.id] = {
            exerciceId: ex.id,
            exerciceNom: ex.exerciceNom,
            seriesPrescrites: ex.series,
            repetitionsPrescrites: ex.repetitions,
            seriesReelles: ex.series,
            repetitionsReelles: ex.repetitions,
            chargeReelle: ex.chargeValeur,
            complete: false,
          };
        }
      }
      setExerciseStates(states);
    }).catch(() => setProgramme(null));
  }, [id, seanceId]);

  function setWellnessValue(key: WellnessKey, value: number) {
    setWellness((prev) => ({ ...prev, [key]: value }));
  }

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
      Alert.alert("RPE manquant", "Sélectionnez votre ressenti d'effort (0 à 10).");
      return;
    }
    if (!durationNumber || durationNumber <= 0) {
      Alert.alert("Durée invalide", "Renseignez la durée réelle de la séance.");
      return;
    }

    const exerciseLogs: ExerciseLog[] = Object.values(exerciseStates).map((ex) => ({
      exerciceNom: ex.exerciceNom,
      seriesPrescrites: ex.seriesPrescrites,
      repetitionsPrescrites: ex.repetitionsPrescrites,
      seriesReelles: ex.seriesReelles,
      repetitionsReelles: ex.repetitionsReelles,
      chargeReelle: ex.chargeReelle,
      complete: ex.complete,
    }));

    setSubmitting(true);
    try {
      await addWellnessEntry(uid, wellness, coachId);
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
      Alert.alert("Séance enregistrée", "Votre charge d'entraînement a été calculée.");
      router.push("/sportif");
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{seance.nom}</Text>
      <Text style={styles.subtitle}>
        {programme.nom} · {doneCount}/{totalCount} exercices faits
      </Text>

      <Text style={styles.sectionTitle}>Comment vous sentez-vous ?</Text>
      <View style={styles.wellnessGrid}>
        {WELLNESS_ITEMS.map((item) => (
          <View key={item.key} style={styles.wellnessItem}>
            <Text style={styles.wellnessLabel}>{item.label}</Text>
            <View style={styles.scaleRow}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
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
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Exercices</Text>
      {seance.blocs.map((bloc) => (
        <View key={bloc.id} style={[styles.blocCard, { borderLeftColor: bloc.couleur }]}>
          <Text style={styles.blocNom}>{bloc.nom}</Text>

          {bloc.exercices.map((ex) => {
            const state = exerciseStates[ex.id];
            if (!state) return null;
            return (
              <View key={ex.id} style={styles.exerciceCard}>
                <TouchableOpacity
                  style={styles.exerciceHeader}
                  onPress={() => toggleComplete(ex.id)}
                >
                  <Ionicons
                    name={state.complete ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={state.complete ? Colors.primary : Colors.grayMedium}
                  />
                  <Text style={styles.exerciceName}>{ex.exerciceNom}</Text>
                </TouchableOpacity>
                <Text style={styles.prescrit}>
                  Prescrit : {ex.series} × {ex.repetitions}
                  {ex.chargeValeur ? ` · ${ex.chargeValeur}` : ""}
                </Text>

                <View style={styles.actualRow}>
                  <View style={styles.actualField}>
                    <Text style={styles.actualLabel}>Séries</Text>
                    <TextInput
                      style={styles.actualInput}
                      value={state.seriesReelles}
                      onChangeText={(t) => updateExercise(ex.id, { seriesReelles: t })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.actualField}>
                    <Text style={styles.actualLabel}>Répétitions</Text>
                    <TextInput
                      style={styles.actualInput}
                      value={state.repetitionsReelles}
                      onChangeText={(t) => updateExercise(ex.id, { repetitionsReelles: t })}
                    />
                  </View>
                  <View style={styles.actualField}>
                    <Text style={styles.actualLabel}>Charge</Text>
                    <TextInput
                      style={styles.actualInput}
                      value={state.chargeReelle}
                      onChangeText={(t) => updateExercise(ex.id, { chargeReelle: t })}
                    />
                  </View>
                </View>
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
          <TouchableOpacity
            key={value}
            style={[styles.rpeDot, rpe === value && styles.rpeDotActive]}
            onPress={() => setRpe(value)}
          >
            <Text style={[styles.rpeDotText, rpe === value && styles.rpeDotTextActive]}>
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Durée réelle de la séance (minutes)</Text>
      <TextInput
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },

  wellnessGrid: {
    marginBottom: 24,
  },

  wellnessItem: {
    marginBottom: 14,
  },

  wellnessLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },

  scaleRow: {
    flexDirection: "row",
    gap: 8,
  },

  scaleDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  scaleDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  scaleDotText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  scaleDotTextActive: {
    color: Colors.white,
  },

  blocCard: {
    backgroundColor: Colors.white,
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

  actualRow: {
    flexDirection: "row",
    gap: 10,
  },

  actualField: {
    flex: 1,
  },

  actualLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  actualInput: {
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.white,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
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
    borderWidth: 1,
    borderColor: Colors.grayMedium,
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
    height: 52,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },

  commentInput: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
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
    backgroundColor: "#FFF1F7",
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
