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

import { Colors } from "../../constants/colors";
import { sessionLabel } from "../../services/session-feedback";
import { SessionRecord } from "../../services/tracking";
import GradientFill from "../gradient-fill";

// Réponses en un tap : le coach complète ou envoie tel quel.
const QUICK_REPLIES = [
  "Bravo, belle séance 💪",
  "Super régularité, continue comme ça !",
  "Attention à bien récupérer cette semaine.",
  "On peut monter un peu la charge la prochaine fois.",
];

export function feedbackDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Fenêtre de rédaction d'un retour sur une séance (nouveau ou à modifier).
export default function FeedbackComposer({
  session,
  sportifName,
  initialText = "",
  onClose,
  onSend,
  onDelete,
}: {
  session: SessionRecord | null;
  sportifName: string;
  initialText?: string;
  onClose: () => void;
  onSend: (session: SessionRecord, text: string) => Promise<void>;
  // Fourni seulement pour un retour déjà envoyé : ajoute « Supprimer mon retour ».
  onDelete?: (session: SessionRecord) => Promise<void>;
}) {
  const [text, setText] = useState(initialText);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setText(initialText);
  }, [session?.id, initialText]);

  async function submit() {
    if (!session || !text.trim()) return;
    setSending(true);
    try {
      await onSend(session, text);
      onClose();
    } catch {
      // l'appelant a déjà affiché l'erreur ; on garde le texte saisi
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal visible={session !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Retour à {sportifName}</Text>
          {session && (
            <Text style={styles.sheetMeta}>
              {sessionLabel(session)} · {feedbackDateLabel(session.date)} · RPE {session.rpe} · {session.duration} min
            </Text>
          )}
          {!!session?.commentaire && (
            <View style={styles.sportifNote}>
              <Text style={styles.sportifNoteLabel}>Ce qu'il a écrit</Text>
              <Text style={styles.sportifNoteText}>{session.commentaire}</Text>
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
            {onDelete && !!initialText && session && (
              <TouchableOpacity
                style={styles.delete}
                disabled={sending}
                onPress={async () => {
                  setSending(true);
                  try {
                    await onDelete(session);
                    onClose();
                  } catch {
                    // l'appelant a déjà affiché l'erreur
                  } finally {
                    setSending(false);
                  }
                }}
              >
                <Text style={styles.deleteText}>Supprimer mon retour</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.cancel} onPress={onClose} disabled={sending}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.send, !text.trim() && styles.sendDisabled]}
              onPress={submit}
              disabled={sending || !text.trim()}
            >
              {text.trim() ? <GradientFill /> : null}
              {sending ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.sendText}>Envoyer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  delete: { paddingVertical: 12 },
  deleteText: { fontSize: 13, fontWeight: "700", color: Colors.riskHigh },
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
