import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../constants/colors";
import { addCoachNote, CoachNote, deleteCoachNote, getCoachNotes } from "../services/coach-notes";
import { showAlert } from "../utils/alert";
import ConfirmModal from "./confirm-modal";

function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// Notes privées du coach sur un sportif — jamais visibles par le sportif.
export default function CoachNotes({
  coachId,
  sportifId,
}: {
  coachId: string;
  sportifId: string;
}) {
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setNotes(await getCoachNotes(coachId, sportifId));
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [coachId, sportifId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await addCoachNote(coachId, sportifId, draft);
      setDraft("");
      await load();
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await deleteCoachNote(deleteId);
      setDeleteId(null);
      await load();
    } catch (error) {
      setDeleteId(null);
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="journal-outline" size={18} color={Colors.primary} />
        <Text style={styles.title}>Carnet du coach</Text>
      </View>
      <Text style={styles.hint}>Notes privées — jamais visibles par le sportif.</Text>

      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        placeholder="Observation d'entraînement, point à surveiller, idée pour la prochaine séance…"
        placeholderTextColor={Colors.textSecondary}
        multiline
      />
      <TouchableOpacity
        style={[styles.addButton, !draft.trim() && styles.addButtonDisabled]}
        onPress={handleAdd}
        disabled={saving || !draft.trim()}
      >
        {saving ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.addButtonText}>Ajouter la note</Text>
        )}
      </TouchableOpacity>

      {loading ? null : notes.length === 0 ? (
        <Text style={styles.empty}>Aucune note.</Text>
      ) : (
        notes.map((n) => (
          <View key={n.id} style={styles.noteRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.noteDate}>{formatDate(n.createdAt)}</Text>
              <Text style={styles.noteText}>{n.text}</Text>
            </View>
            <TouchableOpacity onPress={() => setDeleteId(n.id)} hitSlop={10}>
              <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <ConfirmModal
        visible={deleteId !== null}
        title="Supprimer cette note"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "700", color: Colors.text },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, marginBottom: 12 },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  addButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: { backgroundColor: Colors.grayMedium },
  addButtonText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
  empty: { fontSize: 13, color: Colors.textSecondary, marginTop: 14 },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  noteDate: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  noteText: { fontSize: 14, color: Colors.text, lineHeight: 20 },
});
