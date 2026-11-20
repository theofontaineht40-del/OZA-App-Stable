import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import { sessionLabel } from "../../services/session-feedback";
import { SessionRecord } from "../../services/tracking";
import GradientFill from "../gradient-fill";

export type FeedbackItem = { session: SessionRecord; sportifName: string };

const MAX_VISIBLE = 5;

// Réponses en un tap : le coach complète ou envoie tel quel.
const QUICK_REPLIES = [
  "Bravo, belle séance 💪",
  "Super régularité, continue comme ça !",
  "Attention à bien récupérer cette semaine.",
  "On peut monter un peu la charge la prochaine fois.",
];

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

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
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (items.length === 0) return null;

  function close() {
    setTarget(null);
    setText("");
  }

  async function submit() {
    if (!target || !text.trim()) return;
    setSending(true);
    try {
      await onSend(target.session, text);
      close();
    } finally {
      setSending(false);
    }
  }

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
              {sessionLabel(item.session)} · {dateLabel(item.session.date)} · RPE {item.session.rpe} ·{" "}
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

      <Modal visible={target !== null} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Retour à {target?.sportifName}</Text>
            {target && (
              <Text style={styles.sheetMeta}>
                {sessionLabel(target.session)} · {dateLabel(target.session.date)} · RPE {target.session.rpe} ·{" "}
                {target.session.duration} min
              </Text>
            )}
            {!!target?.session.commentaire && (
              <View style={styles.sportifNote}>
                <Text style={styles.sportifNoteLabel}>Ce qu'il a écrit</Text>
                <Text style={styles.sportifNoteText}>{target.session.commentaire}</Text>
              </View>
            )}

            <View style={styles.quickRow}>
              {QUICK_REPLIES.map((q) => (
                <TouchableOpacity key={q} style={styles.quick} onPress={() => setText(q)}>
                  <Text style={styles.quickText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="Ton retour sur cette séance…"
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={1500}
            />

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancel} onPress={close} disabled={sending}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.send, !text.trim() && styles.sendDisabled]}
                onPress={submit}
                disabled={sending || !text.trim()}
              >
                {text.trim() ? <GradientFill /> : null}
                {sending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.sendText}>Envoyer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  sheet: { backgroundColor: Colors.surface, borderRadius: 22, padding: 20, maxWidth: 520, width: "100%", alignSelf: "center" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: Colors.text },
  sheetMeta: { fontSize: 12.5, color: Colors.textSecondary, marginTop: 4, marginBottom: 12 },
  sportifNote: { backgroundColor: Colors.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 12 },
  sportifNoteLabel: { fontSize: 10.5, fontWeight: "700", letterSpacing: 0.5, color: Colors.textSecondary },
  sportifNoteText: { fontSize: 13.5, color: Colors.text, marginTop: 3 },
  quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  quick: { backgroundColor: Colors.accentTint, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  quickText: { fontSize: 12, fontWeight: "600", color: Colors.primaryDark },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: "top",
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  cancel: { paddingHorizontal: 16, paddingVertical: 12 },
  cancelText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  send: {
    overflow: "hidden",
    minWidth: 110,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  sendDisabled: { backgroundColor: Colors.grayMedium },
  sendText: { fontSize: 14, fontWeight: "700", color: Colors.white },
});
