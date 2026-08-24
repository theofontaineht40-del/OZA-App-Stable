import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
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

import PhotoBackground from "../../components/photo-background";
import PulseDot from "../../components/pulse-dot";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { addSession } from "../../services/tracking";
import { showAlert } from "../../utils/alert";

const RPE_SCALE = Array.from({ length: 11 }, (_, i) => i); // 0 à 10

// Le ressenti quotidien (Hooper Index : sommeil/fatigue/courbatures/stress)
// est enregistré séparément via le check-in du jour (app/sportif/checkin.tsx),
// indépendamment du fait qu'une séance soit loggée ou non — cet écran ne
// couvre donc plus que le RPE de la séance elle-même.
export default function NouvelleSeanceScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [coachId, setCoachId] = useState<string | null>(null);
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

  async function handleSubmit() {
    if (!uid) return;

    const durationNumber = parseInt(duration, 10);
    if (rpe === null) {
      showAlert("RPE manquant", "Sélectionnez votre ressenti d'effort (0 à 10).");
      return;
    }
    if (!durationNumber || durationNumber <= 0) {
      showAlert("Durée invalide", "Renseignez la durée réelle de la séance.");
      return;
    }

    setSubmitting(true);
    try {
      await addSession({
        sportifUid: uid,
        coachId,
        rpe,
        duration: durationNumber,
        commentaire,
      });
      showAlert("Séance enregistrée", "Votre charge d'entraînement a été calculée.");
      router.back();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
    <PhotoBackground variant="seances" />
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Nouvelle séance</Text>
      <Text style={styles.subtitle}>Comment s'est passée votre séance ?</Text>

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
          <Text style={styles.primaryButtonText}>Enregistrer</Text>
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

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
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
    marginTop: 8,
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
