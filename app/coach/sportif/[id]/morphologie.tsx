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
  addMorphologyEntry,
  computeImc,
  getMorphologyEntries,
  MorphologyEntry,
} from "../../../../services/morphology";

export default function MorphologieScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [entries, setEntries] = useState<MorphologyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [poids, setPoids] = useState("");
  const [taille, setTaille] = useState("");
  const [masseGrasse, setMasseGrasse] = useState("");
  const [masseMusculaire, setMasseMusculaire] = useState("");
  const [masseMaigre, setMasseMaigre] = useState("");
  const [triceps, setTriceps] = useState("");
  const [subscapulaire, setSubscapulaire] = useState("");
  const [supraIliaque, setSupraIliaque] = useState("");
  const [abdominal, setAbdominal] = useState("");
  const [cuisse, setCuisse] = useState("");
  const [tourTaille, setTourTaille] = useState("");
  const [tourHanches, setTourHanches] = useState("");
  const [tourBras, setTourBras] = useState("");
  const [tourCuisse, setTourCuisse] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const data = await getMorphologyEntries(id);
        setEntries(data);
        if (data[0]?.taille) setTaille(String(data[0].taille));
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
      await addMorphologyEntry(id, {
        poids: parseFloat(poids) || 0,
        taille: parseFloat(taille) || 0,
        masseGrasse: parseFloat(masseGrasse) || 0,
        masseMusculaire: parseFloat(masseMusculaire) || 0,
        masseMaigre: parseFloat(masseMaigre) || 0,
        plis: {
          triceps: parseFloat(triceps) || 0,
          subscapulaire: parseFloat(subscapulaire) || 0,
          supraIliaque: parseFloat(supraIliaque) || 0,
          abdominal: parseFloat(abdominal) || 0,
          cuisse: parseFloat(cuisse) || 0,
        },
        mensurations: {
          tourTaille: parseFloat(tourTaille) || 0,
          tourHanches: parseFloat(tourHanches) || 0,
          tourBras: parseFloat(tourBras) || 0,
          tourCuisse: parseFloat(tourCuisse) || 0,
        },
        notes,
      });
      const data = await getMorphologyEntries(id);
      setEntries(data);
      setPoids("");
      setMasseGrasse("");
      setMasseMusculaire("");
      setMasseMaigre("");
      setTriceps("");
      setSubscapulaire("");
      setSupraIliaque("");
      setAbdominal("");
      setCuisse("");
      setTourTaille("");
      setTourHanches("");
      setTourBras("");
      setTourCuisse("");
      setNotes("");
    } finally {
      setSaving(false);
    }
  }

  const isPrincipal = usePrincipalAccess(id);

  if (loading || isPrincipal === null) {
    return <View style={styles.container} />;
  }

  if (!isPrincipal) {
    return <AccessDenied message="La morphologie n'est visible que par le coach principal." />;
  }

  const previewImc = computeImc(parseFloat(poids) || 0, parseFloat(taille) || 0);
  const chronological = [...entries].reverse();

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

      <Text style={styles.title}>Bilan morphologique</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Poids (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : 72"
              keyboardType="numeric"
              value={poids}
              onChangeText={setPoids}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Taille (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : 178"
              keyboardType="numeric"
              value={taille}
              onChangeText={setTaille}
            />
          </View>
        </View>

        {previewImc > 0 && (
          <View style={styles.imcPreview}>
            <Text style={styles.imcPreviewText}>IMC estimé : {previewImc.toFixed(1)}</Text>
          </View>
        )}

        <Text style={styles.subsectionTitle}>Composition corporelle</Text>
        <View style={styles.row}>
          <View style={styles.thirdField}>
            <Text style={styles.fieldLabel}>Masse grasse (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={masseGrasse}
              onChangeText={setMasseGrasse}
            />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.fieldLabel}>Masse musculaire (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={masseMusculaire}
              onChangeText={setMasseMusculaire}
            />
          </View>
          <View style={styles.thirdField}>
            <Text style={styles.fieldLabel}>Masse maigre (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={masseMaigre}
              onChangeText={setMasseMaigre}
            />
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Plis cutanés (mm)</Text>
        <View style={styles.grid}>
          <MiniInput label="Tricipital" value={triceps} onChange={setTriceps} />
          <MiniInput label="Subscapulaire" value={subscapulaire} onChange={setSubscapulaire} />
          <MiniInput label="Supra-iliaque" value={supraIliaque} onChange={setSupraIliaque} />
          <MiniInput label="Abdominal" value={abdominal} onChange={setAbdominal} />
          <MiniInput label="Cuisse" value={cuisse} onChange={setCuisse} />
        </View>

        <Text style={styles.subsectionTitle}>Mensurations (cm)</Text>
        <View style={styles.grid}>
          <MiniInput label="Tour de taille" value={tourTaille} onChange={setTourTaille} />
          <MiniInput label="Tour de hanches" value={tourHanches} onChange={setTourHanches} />
          <MiniInput label="Tour de bras" value={tourBras} onChange={setTourBras} />
          <MiniInput label="Tour de cuisse" value={tourCuisse} onChange={setTourCuisse} />
        </View>

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
            <Text style={styles.primaryButtonText}>Enregistrer le bilan</Text>
          )}
        </TouchableOpacity>
      </View>

      {chronological.length > 1 && (
        <>
          <Text style={styles.sectionTitle}>Progression</Text>
          <View style={styles.chartCard}>
            <MiniChart label="Poids (kg)" entries={chronological} field="poids" />
            <MiniChart label="Masse grasse (%)" entries={chronological} field="masseGrasse" />
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Historique</Text>
      {entries.length === 0 ? (
        <Text style={styles.emptyText}>Aucun bilan enregistré.</Text>
      ) : (
        entries.map((entry) => (
          <View key={entry.id} style={styles.entryRow}>
            <Text style={styles.entryDate}>{entry.date}</Text>
            <Text style={styles.entryDetail}>
              {entry.poids} kg · IMC {entry.imc.toFixed(1)} · MG {entry.masseGrasse}% · MM{" "}
              {entry.masseMusculaire} kg
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function MiniInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.gridItem}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

function MiniChart({
  label,
  entries,
  field,
}: {
  label: string;
  entries: MorphologyEntry[];
  field: "poids" | "masseGrasse";
}) {
  const values = entries.slice(-8).map((e) => e[field]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values.filter((v) => v > 0), 0);
  const range = Math.max(max - min, 1);

  return (
    <View style={styles.miniChartBlock}>
      <Text style={styles.miniChartLabel}>{label}</Text>
      <View style={styles.miniChartBars}>
        {values.map((value, index) => (
          <View key={index} style={styles.miniChartColumn}>
            <View
              style={[
                styles.miniChartBar,
                { height: 6 + ((value - min) / range) * 60 },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.miniChartFooter}>
        <Text style={styles.miniChartFooterText}>{values[0]}</Text>
        <Text style={styles.miniChartFooterText}>{values[values.length - 1]}</Text>
      </View>
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

  row: {
    flexDirection: "row",
    gap: 12,
  },

  halfField: {
    flex: 1,
  },

  thirdField: {
    flex: 1,
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
    height: 46,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 12,
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

  imcPreview: {
    backgroundColor: "#FFF1F7",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  imcPreviewText: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 13,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  gridItem: {
    width: "47%",
  },

  miniLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
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

  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    gap: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  miniChartBlock: {},

  miniChartLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 10,
  },

  miniChartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 66,
  },

  miniChartColumn: {
    flex: 1,
    alignItems: "center",
  },

  miniChartBar: {
    width: "70%",
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  miniChartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  miniChartFooterText: {
    fontSize: 11,
    color: Colors.textSecondary,
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
});
