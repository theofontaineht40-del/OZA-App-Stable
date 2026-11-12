import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { getCardioReferences, saveCardioReferences } from "../services/cardio";
import { showAlert } from "../utils/alert";

function parse(v: string): number | null {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// VMA / PMA / FC max d'un sportif : servent à transformer les % d'une séance
// cardio en vitesses, watts ou pulsations cibles.
export default function CardioReferences({
  coachId,
  sportifId,
}: {
  coachId: string;
  sportifId: string;
}) {
  const [vma, setVma] = useState("");
  const [pma, setPma] = useState("");
  const [fcMax, setFcMax] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCardioReferences(sportifId)
      .then((r) => {
        setVma(r.vma !== null ? String(r.vma) : "");
        setPma(r.pma !== null ? String(r.pma) : "");
        setFcMax(r.fcMax !== null ? String(r.fcMax) : "");
      })
      .catch(() => {
        // Références illisibles : champs vides, le coach peut les saisir.
      })
      .finally(() => setLoading(false));
  }, [sportifId]);

  async function save() {
    setSaving(true);
    try {
      await saveCardioReferences(coachId, sportifId, {
        vma: parse(vma),
        pma: parse(pma),
        fcMax: parse(fcMax),
      });
      showAlert("Références enregistrées", "Les cibles de ses séances cardio utilisent ces valeurs.");
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="pulse-outline" size={18} color={Colors.primary} />
        <Text style={styles.title}>Références cardio</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <>
          <View style={styles.row}>
            <Field label="VMA (km/h)" value={vma} onChange={setVma} />
            <Field label="PMA (W)" value={pma} onChange={setPma} />
            <Field label="FC max (bpm)" value={fcMax} onChange={setFcMax} />
          </View>
          <TouchableOpacity style={styles.save} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveText}>Enregistrer</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={Colors.textSecondary}
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
  row: { flexDirection: "row", gap: 10 },
  label: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: Colors.text,
  },
  save: {
    height: 44,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
});
