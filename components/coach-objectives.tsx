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
import {
  addObjective,
  CoachObjective,
  deleteObjective,
  getObjectivesForCoach,
  setObjectiveAchieved,
  setObjectiveComment,
} from "../services/coach-objectives";
import { showAlert } from "../utils/alert";
import ConfirmModal from "./confirm-modal";

// Objectifs que le coach fixe à un sportif : il les marque atteints et peut
// les commenter ; le sportif les voit en lecture seule.
export default function CoachObjectives({
  coachId,
  sportifId,
}: {
  coachId: string;
  sportifId: string;
}) {
  const [objectives, setObjectives] = useState<CoachObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setObjectives(await getObjectivesForCoach(coachId, sportifId));
    } catch {
      setObjectives([]);
    } finally {
      setLoading(false);
    }
  }, [coachId, sportifId]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action: () => Promise<void>) {
    try {
      await action();
      await load();
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  async function handleAdd() {
    if (!draft.trim()) return;
    setSaving(true);
    await run(async () => {
      await addObjective(coachId, sportifId, draft);
      setDraft("");
    });
    setSaving(false);
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="flag-outline" size={18} color={Colors.primary} />
        <Text style={styles.title}>Objectifs</Text>
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ex. Prendre 5 kg, squat à 1,5 × poids du corps…"
          placeholderTextColor={Colors.textSecondary}
        />
        <TouchableOpacity
          style={[styles.addButton, !draft.trim() && styles.addButtonDisabled]}
          onPress={handleAdd}
          disabled={saving || !draft.trim()}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.addButtonText}>Ajouter</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? null : objectives.length === 0 ? (
        <Text style={styles.empty}>Aucun objectif pour le moment.</Text>
      ) : (
        objectives.map((o) => (
          <View key={o.id} style={styles.row}>
            <View style={styles.rowTop}>
              <Ionicons
                name={o.atteint ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={o.atteint ? Colors.riskLow : Colors.textSecondary}
              />
              <Text style={[styles.objTitle, o.atteint && styles.objTitleDone]}>{o.titre}</Text>
              <TouchableOpacity onPress={() => setDeleteId(o.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {o.atteint && o.atteintLe ? (
              <Text style={styles.meta}>Atteint le {o.atteintLe}</Text>
            ) : null}
            {o.commentaire && commentingId !== o.id ? (
              <Text style={styles.comment}>{o.commentaire}</Text>
            ) : null}

            {commentingId === o.id ? (
              <View style={styles.commentRow}>
                <TextInput
                  style={styles.input}
                  value={commentDraft}
                  onChangeText={setCommentDraft}
                  placeholder="Commentaire visible par le sportif"
                  placeholderTextColor={Colors.textSecondary}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() =>
                    run(async () => {
                      await setObjectiveComment(o.id, commentDraft);
                      setCommentingId(null);
                    })
                  }
                >
                  <Text style={styles.addButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionChip}
                  onPress={() => run(() => setObjectiveAchieved(o.id, !o.atteint))}
                >
                  <Ionicons name="checkmark" size={14} color={Colors.primary} />
                  <Text style={styles.actionText}>{o.atteint ? "Rouvrir" : "Atteint"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionChip}
                  onPress={() => {
                    setCommentingId(o.id);
                    setCommentDraft(o.commentaire ?? "");
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={14} color={Colors.primary} />
                  <Text style={styles.actionText}>Commenter</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}

      <ConfirmModal
        visible={deleteId !== null}
        title="Supprimer cet objectif"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        onConfirm={async () => {
          const id = deleteId;
          setDeleteId(null);
          if (id) await run(() => deleteObjective(id));
        }}
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: "700", color: Colors.text },
  addRow: { flexDirection: "row", gap: 8 },
  commentRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
  },
  addButton: {
    minWidth: 64,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: { backgroundColor: Colors.grayMedium },
  addButtonText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  empty: { fontSize: 13, color: Colors.textSecondary, marginTop: 14 },
  row: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  objTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: Colors.text },
  objTitleDone: { color: Colors.textSecondary, textDecorationLine: "line-through" },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, marginLeft: 30 },
  comment: {
    fontSize: 13,
    color: Colors.text,
    fontStyle: "italic",
    marginTop: 6,
    marginLeft: 30,
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 10, marginLeft: 30 },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actionText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
});
