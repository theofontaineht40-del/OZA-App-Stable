import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { sessionLabel } from "../../services/session-feedback";
import { SessionRecord } from "../../services/tracking";
import FeedbackComposer, { feedbackDateLabel } from "./feedback-composer";

export type FeedbackItem = { session: SessionRecord; sportifName: string };

const MAX_VISIBLE = 5;

// « Retours à donner » : séances récentes faites par les sportifs et pas
// encore commentées. Un tap ouvre la rédaction ; le sportif voit ensuite le
// mot sur son accueil.
export default function FeedbackCard({
  items,
  onSend,
}: {
  items: FeedbackItem[];
  onSend: (session: SessionRecord, text: string) => Promise<void>;
}) {
  const [target, setTarget] = useState<FeedbackItem | null>(null);

  if (items.length === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>RETOURS À DONNER · {items.length}</Text>
      {items.slice(0, MAX_VISIBLE).map((item, i) => (
        <TouchableOpacity
          key={item.session.id}
          style={[styles.row, i > 0 && styles.rowBorder]}
          onPress={() => setTarget(item)}
          activeOpacity={0.75}
        >
          <View style={styles.icon}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.canard} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.sportifName}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {sessionLabel(item.session)} · {feedbackDateLabel(item.session.date)} · RPE {item.session.rpe} ·{" "}
              {item.session.duration} min
            </Text>
          </View>
          <View style={styles.action}>
            <Text style={styles.actionText}>Répondre</Text>
          </View>
        </TouchableOpacity>
      ))}
      {items.length > MAX_VISIBLE && (
        <Text style={styles.more}>+ {items.length - MAX_VISIBLE} autres séances à commenter</Text>
      )}

      <FeedbackComposer
        session={target?.session ?? null}
        sportifName={target?.sportifName ?? ""}
        onClose={() => setTarget(null)}
        onSend={onSend}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, color: Colors.textSecondary, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.grayLight },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: Colors.text },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  action: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionText: { fontSize: 12, fontWeight: "700", color: Colors.primaryDark },
  more: { fontSize: 12.5, color: Colors.textSecondary, paddingTop: 8, textAlign: "center" },
});
