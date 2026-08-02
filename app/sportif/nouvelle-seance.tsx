import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
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

import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { addSession, addWellnessEntry } from "../../services/tracking";

const WELLNESS_ITEMS: { key: WellnessKey; label: string }[] = [
  { key: "sommeil", label: "Qualité du sommeil" },
  { key: "fatigue", label: "Fatigue (5 = en forme)" },
  { key: "courbatures", label: "Courbatures (5 = aucune)" },
  { key: "stress", label: "Stress (5 = détendu)" },
  { key: "humeur", label: "Humeur" },
];

type WellnessKey = "sommeil" | "fatigue" | "courbatures" | "stress" | "humeur";
type WellnessState = Record<WellnessKey, number>;

const RPE_SCALE = Array.from({ length: 11 }, (_, i) => i); // 0 à 10

export default function NouvelleSeanceScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [wellness, setWellness] = useState<WellnessState>({
    sommeil: 3,
    fatigue: 3,
    courbatures: 3,
    stress: 3,
    humeur: 3,
  });
  const [rpe, setRpe] = useState<number | null>(null);
  const [duration, setDuration] = useState("");
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

  function setWellnessValue(key: WellnessKey, value: number) {
    setWellness((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!uid) return;

    const durationNumber = parseInt(duration, 10);
    if (rpe === null) {
      Alert.alert("RPE manquant", "Sélectionnez votre ressenti d'effort (0 à 10).");
      return;
    }
    if (!durationNumber || durationNumber <= 0) {
      Alert.alert("Durée invalide", "Renseignez la durée réelle de la séance.");
      return;
    }

    setSubmitting(true);
    try {
      await addWellnessEntry(uid, wellness);
      await addSession(uid, coachId, rpe, durationNumber);
      Alert.alert("Séance enregistrée", "Votre charge d'entraînement a été calculée.");
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Nouvelle séance</Text>
      <Text style={styles.subtitle}>
        {step === 1
          ? "Comment vous sentez-vous aujourd'hui ?"
          : "Comment s'est passée votre séance ?"}
      </Text>

      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
        <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
      </View>

      {step === 1 && (
        <View>
          {WELLNESS_ITEMS.map((item) => (
            <View key={item.key} style={styles.wellnessRow}>
              <Text style={styles.wellnessLabel}>{item.label}</Text>
              <View style={styles.scaleRow}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.scaleDot,
                      wellness[item.key] === value && styles.scaleDotActive,
                    ]}
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

          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
            <Text style={styles.primaryButtonText}>Continuer</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View>
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
                <Text
                  style={[
                    styles.rpeDotText,
                    rpe === value && styles.rpeDotTextActive,
                  ]}
                >
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

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButtonFlex}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingTop: 70,
    paddingBottom: 60,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  stepIndicator: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },

  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grayMedium,
  },

  stepDotActive: {
    backgroundColor: Colors.primary,
  },

  wellnessRow: {
    marginBottom: 20,
  },

  wellnessLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 10,
  },

  scaleRow: {
    flexDirection: "row",
    gap: 10,
  },

  scaleDot: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  scaleDotTextActive: {
    color: Colors.white,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
    marginTop: 4,
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

  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  primaryButtonFlex: {
    flex: 1,
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

  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: Colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
});
