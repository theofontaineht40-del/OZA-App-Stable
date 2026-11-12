import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import {
  CARDIO_REFS,
  CardioModalite,
  CardioRef,
  CardioSegment,
  CardioSpec,
  describeSegment,
  formatDuration,
  isValidSegment,
  MODALITES,
  totalDurationSec,
} from "../services/cardio";

// Champs en texte pendant la saisie (un champ numérique vide est un état
// normal) — convertis en nombres à la validation.
type Draft = {
  nom: string;
  reps: string;
  effortSec: string;
  effortPct: string;
  recupSec: string;
  recupPct: string;
};

const PRESETS: { label: string; draft: Draft }[] = [
  {
    label: "Échauffement",
    draft: { nom: "Échauffement", reps: "1", effortSec: "600", effortPct: "60", recupSec: "0", recupPct: "0" },
  },
  {
    label: "30/30 × 10",
    draft: { nom: "", reps: "10", effortSec: "30", effortPct: "100", recupSec: "30", recupPct: "50" },
  },
  {
    label: "15/15 × 12",
    draft: { nom: "", reps: "12", effortSec: "15", effortPct: "100", recupSec: "15", recupPct: "50" },
  },
  {
    label: "4 × 4 min",
    draft: { nom: "", reps: "4", effortSec: "240", effortPct: "90", recupSec: "180", recupPct: "60" },
  },
  {
    label: "Retour au calme",
    draft: { nom: "Retour au calme", reps: "1", effortSec: "300", effortPct: "55", recupSec: "0", recupPct: "0" },
  },
];

const EMPTY: Draft = { nom: "", reps: "1", effortSec: "60", effortPct: "70", recupSec: "0", recupPct: "0" };

function toSegment(d: Draft): CardioSegment {
  const n = (v: string) => parseFloat(v.replace(",", "."));
  return {
    nom: d.nom.trim(),
    reps: Math.round(n(d.reps)),
    effortSec: Math.round(n(d.effortSec)),
    effortPct: n(d.effortPct),
    recupSec: Math.round(n(d.recupSec) || 0),
    recupPct: n(d.recupPct) || 0,
  };
}

// Constructeur de séance cardio : modalité, référence (VMA / PMA / FC max),
// puis des segments "reps × (effort / récup)" en % de cette référence.
export default function CardioEditor({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (titre: string, spec: CardioSpec) => void;
}) {
  const [titre, setTitre] = useState("");
  const [modalite, setModalite] = useState<CardioModalite>("course");
  const [ref, setRef] = useState<CardioRef>("vma");
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const segments = drafts.map(toSegment);
  const allValid = segments.length > 0 && segments.every(isValidSegment);
  const spec: CardioSpec = { modalite, ref, segments };
  const refInfo = CARDIO_REFS.find((r) => r.key === ref)!;

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((prev) => prev.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  }

  return (
    <View>
      <Text style={styles.label}>Titre</Text>
      <TextInput
        style={styles.input}
        value={titre}
        onChangeText={setTitre}
        placeholder="Ex. Fractionné 30/30"
        placeholderTextColor={Colors.textSecondary}
      />

      <Text style={styles.label}>Discipline</Text>
      <View style={styles.chipRow}>
        {MODALITES.map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.chip, modalite === m.key && styles.chipActive]}
            onPress={() => setModalite(m.key)}
          >
            <Text style={[styles.chipText, modalite === m.key && styles.chipTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Intensité exprimée en</Text>
      <View style={styles.chipRow}>
        {CARDIO_REFS.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.chip, ref === r.key && styles.chipActive]}
            onPress={() => setRef(r.key)}
          >
            <Text style={[styles.chipText, ref === r.key && styles.chipTextActive]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>{refInfo.hint}</Text>

      <Text style={styles.label}>Segments</Text>
      <View style={styles.chipRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity key={p.label} style={styles.preset} onPress={() => setDrafts((d) => [...d, p.draft])}>
            <Ionicons name="add" size={12} color={Colors.primary} />
            <Text style={styles.presetText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.preset} onPress={() => setDrafts((d) => [...d, EMPTY])}>
          <Ionicons name="add" size={12} color={Colors.primary} />
          <Text style={styles.presetText}>Autre</Text>
        </TouchableOpacity>
      </View>

      {drafts.map((d, i) => {
        const seg = segments[i];
        return (
          <View key={i} style={styles.segCard}>
            <View style={styles.segHeader}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={d.nom}
                onChangeText={(v) => update(i, { nom: v })}
                placeholder="Nom (facultatif)"
                placeholderTextColor={Colors.textSecondary}
              />
              <TouchableOpacity onPress={() => setDrafts((prev) => prev.filter((_, j) => j !== i))} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.fieldsRow}>
              <Field label="Répétitions" value={d.reps} onChange={(v) => update(i, { reps: v })} />
              <Field label="Effort (s)" value={d.effortSec} onChange={(v) => update(i, { effortSec: v })} />
              <Field label="Effort (%)" value={d.effortPct} onChange={(v) => update(i, { effortPct: v })} />
            </View>
            <View style={styles.fieldsRow}>
              <View style={{ flex: 1 }} />
              <Field label="Récup (s)" value={d.recupSec} onChange={(v) => update(i, { recupSec: v })} />
              <Field label="Récup (%)" value={d.recupPct} onChange={(v) => update(i, { recupPct: v })} />
            </View>
            <Text style={[styles.segSummary, !isValidSegment(seg) && styles.segInvalid]}>
              {isValidSegment(seg) ? describeSegment(seg) : "Renseigne au moins 1 répétition et une durée d'effort."}
            </Text>
          </View>
        );
      })}

      {allValid && <Text style={styles.total}>Durée totale : {formatDuration(totalDurationSec(spec))}</Text>}

      <TouchableOpacity
        style={[styles.submit, (!allValid || !titre.trim() || busy) && styles.submitDisabled]}
        disabled={!allValid || !titre.trim() || busy}
        onPress={() => onSubmit(titre.trim(), spec)}
      >
        <Text style={styles.submitText}>Ajouter la séance cardio</Text>
      </TouchableOpacity>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.smallInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", color: Colors.text, marginTop: 14, marginBottom: 6 },
  hint: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: Colors.text },
  chipTextActive: { color: Colors.white },
  preset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  segCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  segHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  fieldsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  fieldLabel: { fontSize: 11, color: Colors.textSecondary, marginBottom: 3 },
  smallInput: {
    height: 38,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    fontSize: 14,
    color: Colors.text,
  },
  segSummary: { fontSize: 12, fontWeight: "600", color: Colors.primary },
  segInvalid: { color: Colors.riskHigh },
  total: { fontSize: 13, fontWeight: "700", color: Colors.text, marginTop: 14 },
  submit: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  submitDisabled: { backgroundColor: Colors.grayMedium },
  submitText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
});
