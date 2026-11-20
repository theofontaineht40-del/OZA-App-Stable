import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { SessionFeedback } from "../services/session-feedback";

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

// « Retour de ton coach » sur l'accueil sportif : le mot du coach sur une
// séance qu'il vient de faire. Reste affiché jusqu'à ce que le sportif le
// marque comme lu.
export default function SessionFeedbackCard({
  feedback,
  onSeen,
}: {
  feedback: SessionFeedback;
  onSeen: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="chatbubble-ellipses" size={18} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Retour de {feedback.coachName || "ton coach"}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {feedback.sessionLabel} · {dateLabel(feedback.sessionDate)}
          </Text>
        </View>
      </View>
      <Text style={styles.text}>{feedback.text}</Text>
      <TouchableOpacity style={styles.button} onPress={onSeen} activeOpacity={0.8}>
        <Ionicons name="checkmark" size={16} color={Colors.primaryDark} />
        <Text style={styles.buttonText}>Bien reçu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: "#0B2E2D",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontWeight: "800", color: Colors.text },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, textTransform: "capitalize" },
  text: { fontSize: 14.5, lineHeight: 21, color: Colors.text },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: Colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonText: { fontSize: 13, fontWeight: "700", color: Colors.primaryDark },
});
