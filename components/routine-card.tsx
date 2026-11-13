import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { cloneExercices } from "../services/programmes";
import {
  getRoutine,
  removeRoutine,
  Routine,
  ROUTINE_FREQUENCES,
  RoutineFrequence,
  routineFrequenceLabel,
  setRoutine,
} from "../services/routines";
import { getWarmupProtocols, WarmupProtocol } from "../services/warmups";
import { showAlert } from "../utils/alert";
import ConfirmModal from "./confirm-modal";

// Liste des exercices d'une routine, en lecture seule (coach et sportif).
export function RoutineExerciseList({ routine }: { routine: Pick<Routine, "exercices"> }) {
  return (
    <View style={{ gap: 6 }}>
      {routine.exercices.map((e) => (
        <View key={e.id} style={styles.exRow}>
          <Text style={styles.exName} numberOfLines={2}>
            {e.exerciceNom}
          </Text>
          <Text style={styles.exDose}>
            {e.series} × {e.repetitions}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Carte "Routine de l'athlète" sur la fiche sportif côté coach : attribuer un
// protocole d'échauffement comme routine personnelle, avec sa fréquence.
export default function RoutineCard({ coachId, sportifId }: { coachId: string; sportifId: string }) {
  const [routine, setRoutineState] = useState<Routine | null>(null);
  const [protocols, setProtocols] = useState<WarmupProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [frequence, setFrequence] = useState<RoutineFrequence>("2-3");
  const [avantSeance, setAvantSeance] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([getRoutine(sportifId), getWarmupProtocols(coachId)]);
      setRoutineState(r);
      setProtocols(p);
      if (r) {
        setFrequence(r.frequence);
        setAvantSeance(r.avantSeance);
      }
    } catch {
      setRoutineState(null);
    } finally {
      setLoading(false);
    }
  }, [coachId, sportifId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    // Sans nouveau protocole choisi, on garde les exercices actuels et on ne
    // change que la fréquence.
    const protocol = protocols.find((p) => p.id === protocolId) ?? null;
    if (!protocol && !routine) return;
    setSaving(true);
    try {
      await setRoutine({
        sportifId,
        coachId,
        nom: protocol ? protocol.nom : routine!.nom,
        exercices: protocol ? cloneExercices(protocol.exercices) : routine!.exercices,
        frequence,
        avantSeance,
      });
      setEditing(false);
      setProtocolId(null);
      await load();
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setConfirmRemove(false);
    try {
      await removeRoutine(sportifId);
      setEditing(false);
      await load();
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  const canSave = !!protocolId || !!routine;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="body-outline" size={18} color={Colors.primary} />
        <Text style={styles.title}>Routine de l'athlète</Text>
      </View>
      <Text style={styles.help}>
        Son protocole attitré, sans jour fixe : mis en avant sur son accueil, à faire à la fréquence choisie, et en tête
        de ses séances si tu le coches.
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
      ) : (
        <>
          {routine && !editing && (
            <View style={styles.current}>
              <Text style={styles.routineName}>{routine.nom}</Text>
              <Text style={styles.routineMeta}>
                {routine.exercices.length} exercice{routine.exercices.length > 1 ? "s" : ""} ·{" "}
                {routineFrequenceLabel(routine)}
              </Text>
              <RoutineExerciseList routine={routine} />
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditing(true)}>
                  <Text style={styles.secondaryButtonText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setConfirmRemove(true)}>
                  <Text style={[styles.secondaryButtonText, { color: "#C2410C" }]}>Retirer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {(!routine || editing) && (
            <View>
              {!routine && <Text style={styles.empty}>Pas encore de routine attribuée.</Text>}

              <Text style={styles.label}>{routine ? "Remplacer par un autre protocole (optionnel)" : "Protocole"}</Text>
              {protocols.length === 0 ? (
                <Text style={styles.empty}>
                  Aucun protocole pour l'instant. Dans l'éditeur de programme, enregistre un bloc comme protocole
                  d'échauffement : il apparaîtra ici.
                </Text>
              ) : (
                <View style={styles.chipRow}>
                  {protocols.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chip, protocolId === p.id && styles.chipActive]}
                      onPress={() => setProtocolId(protocolId === p.id ? null : p.id)}
                    >
                      <Text style={[styles.chipText, protocolId === p.id && styles.chipTextActive]}>
                        {p.nom} · {p.exercices.length}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.toggleRow} onPress={() => setAvantSeance((v) => !v)}>
                <Ionicons name={avantSeance ? "checkbox" : "square-outline"} size={20} color={Colors.primary} />
                <Text style={styles.toggleText}>Avant chaque séance (affichée en tête de ses séances)</Text>
              </TouchableOpacity>

              <Text style={styles.label}>En dehors des séances</Text>
              <View style={styles.chipRow}>
                {ROUTINE_FREQUENCES.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.chip, frequence === f.key && styles.chipActive]}
                    onPress={() => setFrequence(f.key)}
                  >
                    <Text style={[styles.chipText, frequence === f.key && styles.chipTextActive]}>
                      {f.key === "aucune" ? "Aucune" : f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.primaryButton, !canSave && styles.primaryButtonDisabled]}
                  disabled={!canSave || saving}
                  onPress={handleSave}
                >
                  {saving ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>{routine ? "Enregistrer" : "Attribuer"}</Text>
                  )}
                </TouchableOpacity>
                {editing && (
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => {
                      setEditing(false);
                      setProtocolId(null);
                      if (routine) {
                        setFrequence(routine.frequence);
                        setAvantSeance(routine.avantSeance);
                      }
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Annuler</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </>
      )}

      <ConfirmModal
        visible={confirmRemove}
        title="Retirer la routine ?"
        message="Le sportif ne la verra plus sur son accueil ni en tête de ses séances."
        confirmLabel="Retirer"
        destructive
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "700", color: Colors.text },
  help: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 12 },
  empty: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  current: { gap: 8 },
  routineName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  routineMeta: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  exRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  exName: { flex: 1, fontSize: 13, color: Colors.text },
  exDose: { fontSize: 12, color: Colors.textSecondary },
  label: { fontSize: 13, fontWeight: "700", color: Colors.text, marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.surfaceAlt },
  chipActive: { backgroundColor: Colors.primaryDark },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.text },
  chipTextActive: { color: Colors.white },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 8 },
  toggleText: { flex: 1, fontSize: 13, color: Colors.text },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignItems: "center",
    minWidth: 110,
  },
  primaryButtonDisabled: { backgroundColor: Colors.grayMedium },
  primaryButtonText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    backgroundColor: Colors.surfaceAlt,
  },
  secondaryButtonText: { color: Colors.text, fontWeight: "600", fontSize: 14 },
});
