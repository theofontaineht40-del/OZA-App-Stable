import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../constants/colors";
import { addReview, getMyReview } from "../services/reviews";

type Props = {
  visible: boolean;
  coachId: string;
  coachName: string;
  sportifId: string;
  sportifName: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export default function ReviewModal({
  visible,
  coachId,
  coachName,
  sportifId,
  sportifName,
  onClose,
  onSubmitted,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getMyReview(coachId, sportifId).then((existing) => {
      setRating(existing?.rating ?? 0);
      setComment(existing?.comment ?? "");
      setLoading(false);
    });
  }, [visible, coachId, sportifId]);

  async function handleSubmit() {
    if (rating === 0) return;
    setSaving(true);
    try {
      await addReview(coachId, sportifId, sportifName, rating, comment.trim());
      onSubmitted?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Votre avis sur {coachName}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close-circle" size={26} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 30 }} />
          ) : (
            <>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} hitSlop={6}>
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={36}
                      color={Colors.riskMedium}
                      style={styles.star}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Commentaire (optionnel)</Text>
              <TextInput
                style={styles.textarea}
                placeholder="Partagez votre expérience avec ce coach..."
                placeholderTextColor={Colors.textSecondary}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={rating === 0 || saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Publier mon avis</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },

  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },

  star: {
    marginHorizontal: 4,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },

  textarea: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: "top",
    marginBottom: 20,
  },

  submitButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  submitButtonDisabled: {
    backgroundColor: Colors.grayMedium,
  },

  submitButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
