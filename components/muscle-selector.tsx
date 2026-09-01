import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { MUSCLE_CATEGORIES, MuscleId } from "../constants/muscle-selection";

const ALL_MUSCLES = MUSCLE_CATEGORIES.flatMap((c) => c.muscles);

// Sélection manuelle des muscles sollicités par une séance — voir le
// commentaire sur Seance.muscles (services/programmes.ts). Remplace toute
// déduction automatique : ce que le coach coche ici est exactement ce qui
// sera affiché (carte de séance + visuel anatomique), rien de plus.
//
// Repliée par défaut (fermée à l'ouverture de l'écran) : les ~20 chips
// prennent trop de place pour rester visibles en permanence pendant qu'on
// construit les blocs de la séance — un résumé suffit tant qu'on n'a pas
// besoin d'y toucher.
export default function MuscleSelector({
  selected,
  onToggle,
}: {
  selected: MuscleId[];
  onToggle: (id: MuscleId) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedLabels = ALL_MUSCLES.filter((m) => selected.includes(m.id)).map((m) => m.label);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.header}
        activeOpacity={0.7}
        onPress={() => setExpanded((e) => !e)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Muscles sollicités</Text>
          <Text style={styles.summary} numberOfLines={1}>
            {selectedLabels.length > 0 ? selectedLabels.join(" · ") : "Aucun sélectionné"}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {MUSCLE_CATEGORIES.map((category) => (
            <View key={category.label} style={styles.category}>
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <View style={styles.chipRow}>
                {category.muscles.map((muscle) => {
                  const active = selected.includes(muscle.id);
                  return (
                    <TouchableOpacity
                      key={muscle.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => onToggle(muscle.id)}
                    >
                      <Ionicons
                        name={active ? "checkmark-circle" : "ellipse-outline"}
                        size={15}
                        color={active ? Colors.white : Colors.textSecondary}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {muscle.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  summary: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  body: {
    marginTop: 16,
  },

  category: {
    marginBottom: 14,
  },

  categoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    backgroundColor: Colors.grayLight,
  },

  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  chipTextActive: {
    color: Colors.white,
  },
});
