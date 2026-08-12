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

import { Colors } from "../../../../constants/colors";
import { auth, db } from "../../../../firebase";
import { getRelation } from "../../../../services/relations";
import { addSession } from "../../../../services/tracking";
import { showAlert } from "../../../../utils/alert";

const RPE_SCALE = Array.from({ length: 11 }, (_, i) => i); // 0 à 10

export default function CoachNouvelleSeanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
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
        setAuthorized(rel?.type === "principal");
      } catch {
        setAuthorized(false);
      }
    });

    return unsubscribe;
  }, [id]);

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

    setSubmitting(true);
    try {
      await addSession({
        sportifUid: id,
        coachId: coachUid,
        rpe,
        duration: durationNumber,
        commentaire,
        loggedBy: "coach",
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
        <View style={styles.centeredEmpty}>
          <Ionicons name="lock-closed-outline" size={40} color={Colors.grayMedium} />
          <Text style={styles.emptyTitle}>Accès non autorisé</Text>
          <Text style={styles.emptyText}>
            Seul le coach principal de ce sportif peut ajouter une séance.
          </Text>
        </View>
      </View>
    );
  }

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

      <Text style={styles.title}>Nouvelle séance</Text>
      <Text style={styles.subtitle}>Séance encadrée avec {name}</Text>

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
    fontSize: 14,
    color: Colors.textSecondary,
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
    color: Colors.text,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
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
    color: Colors.text,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },

  commentInput: {
    color: Colors.text,
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
