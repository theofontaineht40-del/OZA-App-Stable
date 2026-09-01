import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";

export type SetEntry = { repetitions: string; charge: string };

// Saisie série par série (comme Hevy) plutôt qu'un seul champ agrégé pour
// tout l'exercice — le poids/nombre de répétitions varie souvent d'une
// série à l'autre (pyramidal, dégressif...). Réutilisé à l'identique côté
// sportif (exécution de séance) et côté coach (saisie pour un sportif).
export default function ExerciseSetEditor({
  sets,
  onChange,
}: {
  sets: SetEntry[];
  onChange: (sets: SetEntry[]) => void;
}) {
  function updateSet(index: number, patch: Partial<SetEntry>) {
    onChange(sets.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSet() {
    const last = sets[sets.length - 1];
    onChange([...sets, { repetitions: last?.repetitions ?? "", charge: last?.charge ?? "" }]);
  }

  function removeSet(index: number) {
    onChange(sets.filter((_, i) => i !== index));
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.numCol]} />
        <Text style={[styles.headerCell, styles.fieldCol]}>Répétitions</Text>
        <Text style={[styles.headerCell, styles.fieldCol]}>Poids (kg)</Text>
        <View style={styles.removeCol} />
      </View>

      {sets.map((set, i) => (
        <View key={i} style={styles.row}>
          <Text style={[styles.numCol, styles.numText]}>{i + 1}</Text>
          <TextInput
            placeholderTextColor={Colors.textSecondary}
            style={[styles.input, styles.fieldCol]}
            value={set.repetitions}
            onChangeText={(t) => updateSet(i, { repetitions: t })}
          />
          <TextInput
            placeholderTextColor={Colors.textSecondary}
            style={[styles.input, styles.fieldCol]}
            keyboardType="numeric"
            value={set.charge}
            onChangeText={(t) => updateSet(i, { charge: t })}
          />
          <View style={styles.removeCol}>
            {sets.length > 1 && (
              <TouchableOpacity onPress={() => removeSet(i)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addSet}>
        <Ionicons name="add" size={15} color={Colors.primary} />
        <Text style={styles.addButtonText}>Ajouter une série</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  headerCell: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  numCol: {
    width: 18,
    textAlign: "center",
  },

  numText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },

  fieldCol: {
    flex: 1,
  },

  removeCol: {
    width: 20,
    alignItems: "center",
  },

  input: {
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    marginTop: 2,
  },

  addButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },
});
