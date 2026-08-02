import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AccessDenied } from "../../../../components/access-denied";
import { Colors } from "../../../../constants/colors";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";
import {
  addLifestyleEntry,
  getLifestyleEntries,
  LifestyleEntry,
} from "../../../../services/lifestyle";

export default function HygieneVieScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [entries, setEntries] = useState<LifestyleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sommeilHeures, setSommeilHeures] = useState("");
  const [qualiteSommeil, setQualiteSommeil] = useState(3);
  const [hydratationLitres, setHydratationLitres] = useState("");
  const [petitDejeuner, setPetitDejeuner] = useState("");
  const [dejeuner, setDejeuner] = useState("");
  const [diner, setDiner] = useState("");
  const [collations, setCollations] = useState("");
  const [complements, setComplements] = useState("");
  const [stress, setStress] = useState(3);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const data = await getLifestyleEntries(id);
        setEntries(data);
      } catch {
        // Pas principal de ce sportif : le guard usePrincipalAccess ci-dessous
        // affichera "Accès non autorisé", pas la peine de remonter l'erreur.
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await addLifestyleEntry(id, {
        sommeilHeures: parseFloat(sommeilHeures) || 0,
        qualiteSommeil,
        hydratationLitres: parseFloat(hydratationLitres) || 0,
        petitDejeuner,
        dejeuner,
        diner,
        collations,
        complements,
        stress,
        notes,
      });
      const data = await getLifestyleEntries(id);
      setEntries(data);
      setSommeilHeures("");
      setHydratationLitres("");
      setPetitDejeuner("");
      setDejeuner("");
      setDiner("");
      setCollations("");
      setComplements("");
      setNotes("");
      setQualiteSommeil(3);
      setStress(3);
    } finally {
      setSaving(false);
    }
  }

  const isPrincipal = usePrincipalAccess(id);

  if (loading || isPrincipal === null) {
    return <View style={styles.container} />;
  }

  if (!isPrincipal) {
    return <AccessDenied message="L'hygiène de vie n'est visible que par le coach principal." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Hygiène de vie & Nutrition</Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Sommeil (heures / nuit)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : 7.5"
          keyboardType="numeric"
          value={sommeilHeures}
          onChangeText={setSommeilHeures}
        />

        <Text style={styles.fieldLabel}>Qualité du sommeil</Text>
        <ScaleRow value={qualiteSommeil} onChange={setQualiteSommeil} />

        <Text style={styles.fieldLabel}>Hydratation (litres / jour)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : 2"
          keyboardType="numeric"
          value={hydratationLitres}
          onChangeText={setHydratationLitres}
        />

        <Text style={styles.subsectionTitle}>Journée type</Text>

        <Text style={styles.fieldLabel}>Petit-déjeuner</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Ex : flocons d'avoine, fruits, œufs..."
          value={petitDejeuner}
          onChangeText={setPetitDejeuner}
        />

        <Text style={styles.fieldLabel}>Déjeuner</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Ex : riz, poulet, légumes..."
          value={dejeuner}
          onChangeText={setDejeuner}
        />

        <Text style={styles.fieldLabel}>Dîner</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Ex : poisson, pâtes, salade..."
          value={diner}
          onChangeText={setDiner}
        />

        <Text style={styles.fieldLabel}>Collations</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Ex : fruits secs, yaourt, barre protéinée..."
          value={collations}
          onChangeText={setCollations}
        />

        <Text style={styles.fieldLabel}>Compléments alimentaires</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : whey, créatine, vitamine D"
          value={complements}
          onChangeText={setComplements}
        />

        <Text style={styles.fieldLabel}>Niveau de stress</Text>
        <ScaleRow value={stress} onChange={setStress} />

        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Notes complémentaires (optionnel)"
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Enregistrer l'évaluation</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Historique</Text>
      {entries.length === 0 ? (
        <Text style={styles.emptyText}>Aucune évaluation enregistrée.</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryRow}>
            <Text style={styles.entryDate}>{entry.date}</Text>
            <Text style={styles.entryDetail}>
              Sommeil {entry.sommeilHeures}h (qualité {entry.qualiteSommeil}/5) · Hydratation{" "}
              {entry.hydratationLitres} L · Stress {entry.stress}/5
            </Text>
            {!!entry.petitDejeuner && (
              <Text style={styles.entryNotes}>Petit-déj : {entry.petitDejeuner}</Text>
            )}
            {!!entry.dejeuner && (
              <Text style={styles.entryNotes}>Déjeuner : {entry.dejeuner}</Text>
            )}
            {!!entry.diner && <Text style={styles.entryNotes}>Dîner : {entry.diner}</Text>}
            {!!entry.collations && (
              <Text style={styles.entryNotes}>Collations : {entry.collations}</Text>
            )}
            {!!entry.complements && (
              <Text style={styles.entryNotes}>Compléments : {entry.complements}</Text>
            )}
            {!!entry.notes && <Text style={styles.entryNotes}>{entry.notes}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function ScaleRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.scaleRow}>
      {[1, 2, 3, 4, 5].map((v) => (
        <TouchableOpacity
          key={v}
          style={[styles.scaleDot, value === v && styles.scaleDotActive]}
          onPress={() => onChange(v)}
        >
          <Text style={[styles.scaleDotText, value === v && styles.scaleDotTextActive]}>
            {v}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 24,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },

  subsectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    marginTop: 4,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 16,
  },

  textArea: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: "top",
  },

  scaleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  scaleDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  scaleDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  scaleDotText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  scaleDotTextActive: {
    color: Colors.white,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  entryRow: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  entryDate: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  entryDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  entryNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
});
