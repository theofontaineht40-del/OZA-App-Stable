import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AccessDenied } from "../../../../components/access-denied";
import ConfirmModal from "../../../../components/confirm-modal";
import DateField from "../../../../components/date-field";
import ExercisePickerModal from "../../../../components/exercise-picker-modal";
import { Colors } from "../../../../constants/colors";
import { ExerciseTemplate } from "../../../../constants/exercise-library";
import { auth } from "../../../../firebase";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";
import { todayKey } from "../../../../services/load";
import {
  addOneRepMax,
  applyTempoCorrection,
  deleteOneRepMax,
  estimateOneRepMax,
  Formula,
  FORMULAS,
  getOneRepMaxesForCoach,
  MAX_COMPUTABLE_REPS,
  MAX_RELIABLE_REPS,
  OneRepMaxRecord,
  roundKg,
  setReference,
  tempoSecondsPerRep,
  TEMPO_CORRECTION_CAP,
  TEMPO_CORRECTION_PER_SECOND,
} from "../../../../services/one-rep-max";
import { showAlert } from "../../../../utils/alert";

export default function OneRepMaxScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPrincipal = usePrincipalAccess(id);
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [records, setRecords] = useState<OneRepMaxRecord[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [exercise, setExercise] = useState<ExerciseTemplate | null>(null);
  const [date, setDate] = useState(todayKey());
  const [charge, setCharge] = useState("");
  const [reps, setReps] = useState("5");
  const [tempo, setTempo] = useState("");
  const [formula, setFormula] = useState<Formula>("epley");
  const [correctTempo, setCorrectTempo] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setCoachUid(user?.uid ?? null));
  }, []);

  async function reload(coach: string, sportif: string) {
    try {
      setRecords(await getOneRepMaxesForCoach(coach, sportif));
    } catch {
      setRecords([]);
    }
  }

  useEffect(() => {
    if (coachUid && id) reload(coachUid, id);
  }, [coachUid, id]);

  if (!id || isPrincipal === null) return <View style={{ flex: 1 }} />;
  if (!isPrincipal) {
    return <AccessDenied message="Le 1RM n'est visible que par le coach principal." />;
  }

  const chargeNumber = parseFloat(charge.replace(",", "."));
  const repsNumber = parseInt(reps, 10);
  const raw = estimateOneRepMax(chargeNumber, repsNumber, formula);
  const tempoOk = tempo.trim() === "" || tempoSecondsPerRep(tempo) !== null;
  const estimate =
    raw === null ? null : roundKg(correctTempo && tempo.trim() ? applyTempoCorrection(raw, tempo) : raw);
  const unreliable = repsNumber > MAX_RELIABLE_REPS && repsNumber <= MAX_COMPUTABLE_REPS;
  const canSave = !!exercise && estimate !== null && tempoOk && !!coachUid;

  async function save(makeReference: boolean) {
    if (!canSave || !exercise || estimate === null || !coachUid || !id) return;
    setSaving(true);
    try {
      await addOneRepMax(
        {
          sportifId: id,
          coachId: coachUid,
          exerciceId: exercise.id,
          exerciceNom: exercise.nom,
          date,
          charge: chargeNumber,
          reps: repsNumber,
          formula,
          tempo: tempo.trim() || null,
          tempoCorrected: correctTempo && !!tempo.trim(),
          oneRm: estimate,
          commentaire: commentaire.trim() || null,
        },
        makeReference,
        records
      );
      setCharge("");
      setCommentaire("");
      await reload(coachUid, id);
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  async function makeReference(r: OneRepMaxRecord) {
    if (!coachUid || !id) return;
    try {
      await setReference(r.id, r.exerciceId, records);
      await reload(coachUid, id);
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  async function confirmDelete() {
    if (!deleteId || !coachUid || !id) return;
    try {
      await deleteOneRepMax(deleteId);
      setDeleteId(null);
      await reload(coachUid, id);
    } catch (error) {
      setDeleteId(null);
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  const references = records.filter((r) => r.isReference);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>
      <Text style={styles.title}>1RM de référence</Text>

      {references.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Références actuelles</Text>
          {references.map((r) => (
            <View key={r.id} style={styles.refRow}>
              <Text style={styles.refName}>{r.exerciceNom}</Text>
              <Text style={styles.refValue}>{r.oneRm} kg</Text>
            </View>
          ))}
          <Text style={styles.hint}>
            Les charges en « % 1RM » de ses programmes s'affichent en kg pour ce sportif.
          </Text>
        </View>
      )}

      <View style={styles.warning}>
        <Text style={styles.warningText}>
          Avant d'estimer : échauffement progressif (2-3 séries montantes), une série proche de
          l'échec sur 3 à 8 répétitions avec une technique propre, et un pareur sur le squat et le
          développé couché. Une estimation sert à programmer, jamais à tenter seul. Au-delà de{" "}
          {MAX_RELIABLE_REPS} répétitions la valeur est peu fiable ; au-delà de {MAX_COMPUTABLE_REPS}
          {" "}elle n'est pas calculée.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estimer</Text>

        <Text style={styles.label}>Exercice</Text>
        <TouchableOpacity style={styles.pickButton} onPress={() => setShowPicker(true)}>
          <Text style={exercise ? styles.pickText : styles.pickPlaceholder}>
            {exercise ? exercise.nom : "Choisir un exercice…"}
          </Text>
          <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.label}>Date</Text>
        <DateField value={date} onChange={setDate} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Charge (kg)</Text>
            <TextInput
              style={styles.input}
              value={charge}
              onChangeText={setCharge}
              keyboardType="decimal-pad"
              placeholder="ex. 100"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Répétitions</Text>
            <TextInput
              style={styles.input}
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={styles.label}>Tempo (facultatif)</Text>
        <TextInput
          style={[styles.input, !tempoOk && styles.inputError]}
          value={tempo}
          onChangeText={setTempo}
          placeholder="ex. 3-1-1-0"
          placeholderTextColor={Colors.textSecondary}
          autoCapitalize="characters"
        />
        <Text style={styles.hint}>
          Excentrique – pause basse – concentrique – pause haute (X = explosif).
        </Text>

        <Text style={styles.label}>Formule</Text>
        <View style={styles.chipRow}>
          {FORMULAS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, formula === f.key && styles.chipActive]}
              onPress={() => setFormula(f.key)}
            >
              <Text style={[styles.chipText, formula === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Corriger selon le tempo</Text>
            <Text style={styles.hint}>
              +{(TEMPO_CORRECTION_PER_SECOND * 100).toFixed(1).replace(".", ",")} % de 1RM par
              seconde de tension au-delà de 2 s / rép, plafonné à +{TEMPO_CORRECTION_CAP * 100} %.
              Correction indicative, désactivée par défaut.
            </Text>
          </View>
          <Switch value={correctTempo} onValueChange={setCorrectTempo} />
        </View>

        <Text style={styles.label}>Commentaire (facultatif)</Text>
        <TextInput
          style={styles.input}
          value={commentaire}
          onChangeText={setCommentaire}
          placeholder="Conditions, matériel, ressenti…"
          placeholderTextColor={Colors.textSecondary}
        />

        <View style={styles.result}>
          <Text style={styles.resultLabel}>1RM estimé</Text>
          <Text style={styles.resultValue}>{estimate !== null ? `${estimate} kg` : "—"}</Text>
          {repsNumber > MAX_COMPUTABLE_REPS && (
            <Text style={styles.resultNote}>
              Plus de {MAX_COMPUTABLE_REPS} répétitions : estimation non calculée.
            </Text>
          )}
          {unreliable && <Text style={styles.resultNote}>Estimation peu fiable (&gt; {MAX_RELIABLE_REPS} répétitions).</Text>}
        </View>

        <TouchableOpacity
          style={[styles.primary, !canSave && styles.primaryDisabled]}
          onPress={() => save(true)}
          disabled={!canSave || saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryText}>
              Valider : ce 1RM{estimate !== null ? ` (${estimate} kg)` : ""} devient la référence
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondary, !canSave && styles.secondaryDisabled]}
          onPress={() => save(false)}
          disabled={!canSave || saving}
        >
          <Text style={styles.secondaryText}>Enregistrer sans en faire la référence</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Historique ({records.length})</Text>
      {records.length === 0 ? (
        <Text style={styles.hint}>Aucune estimation pour le moment.</Text>
      ) : (
        records.map((r) => (
          <View key={r.id} style={styles.histRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.histTitle}>
                {r.exerciceNom} — {r.oneRm} kg {r.isReference ? "· référence" : ""}
              </Text>
              <Text style={styles.hint}>
                {r.date} · {r.charge} kg × {r.reps} ({r.formula}
                {r.tempoCorrected ? `, tempo ${r.tempo}` : ""})
                {r.commentaire ? ` · ${r.commentaire}` : ""}
              </Text>
            </View>
            {!r.isReference && (
              <TouchableOpacity onPress={() => makeReference(r)} hitSlop={8}>
                <Ionicons name="star-outline" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setDeleteId(r.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))
      )}

      {coachUid && (
        <ExercisePickerModal
          visible={showPicker}
          coachId={coachUid}
          onClose={() => setShowPicker(false)}
          onSelect={(ex) => {
            setExercise(ex);
            setShowPicker(false);
          }}
        />
      )}

      <ConfirmModal
        visible={deleteId !== null}
        title="Supprimer cette estimation"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingTop: 70, paddingBottom: 60 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  title: { fontSize: 24, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  warning: {
    backgroundColor: Colors.accentTint,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  warningText: { fontSize: 12, lineHeight: 18, color: Colors.text },
  label: { fontSize: 13, fontWeight: "600", color: Colors.text, marginTop: 12, marginBottom: 6 },
  hint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginTop: 4 },
  row: { flexDirection: "row", gap: 12 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.text,
  },
  inputError: { borderColor: Colors.riskHigh },
  pickButton: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickText: { fontSize: 14, color: Colors.text, fontWeight: "600" },
  pickPlaceholder: { fontSize: 14, color: Colors.textSecondary },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: Colors.text },
  chipTextActive: { color: Colors.white },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
  switchTitle: { fontSize: 13, fontWeight: "600", color: Colors.text },
  result: {
    marginTop: 18,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.grayLight,
    alignItems: "center",
  },
  resultLabel: { fontSize: 12, color: Colors.textSecondary },
  resultValue: { fontSize: 28, fontWeight: "700", color: Colors.primary, marginTop: 2 },
  resultNote: { fontSize: 12, color: Colors.riskHigh, marginTop: 4, textAlign: "center" },
  primary: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  primaryDisabled: { backgroundColor: Colors.grayMedium },
  primaryText: { color: Colors.white, fontWeight: "700", fontSize: 14, textAlign: "center" },
  secondary: {
    height: 44,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryDisabled: { opacity: 0.5 },
  secondaryText: { fontSize: 13, fontWeight: "600", color: Colors.text },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  refRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  refName: { fontSize: 14, color: Colors.text, fontWeight: "600", flex: 1 },
  refValue: { fontSize: 14, color: Colors.primary, fontWeight: "700" },
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  histTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
});
