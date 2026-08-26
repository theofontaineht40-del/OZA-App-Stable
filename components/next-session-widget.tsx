import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { getUniqueMuscles, NamedExercise } from "../constants/exercise-muscles";
import { MUSCLE_LABELS } from "../constants/muscle-groups";
import MuscleMap from "./muscle-map-detailed";

// Widget riche pour la ligne "Prochaine séance" de l'accueil sportif —
// remplace le ListRow générique par la silhouette anatomique SVG face/dos
// (components/muscle-map-detailed.tsx) mettant en évidence les groupes
// musculaires réellement travaillés par les exercices de la séance à venir
// (exercises → muscles, voir constants/exercise-muscles.ts). Le MuscleMap
// est l'élément visuel principal de la carte, pas un simple accent.
export default function NextSessionWidget({
  workoutName,
  subtitle,
  duration,
  exercises,
  onPress,
}: {
  workoutName: string;
  subtitle?: string;
  duration?: string;
  exercises: NamedExercise[];
  onPress: () => void;
}) {
  const targetedLabels = getUniqueMuscles(exercises).map((group) => MUSCLE_LABELS[group]);

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.eyebrow}>Prochaine séance</Text>
      <Text style={styles.workoutName}>{workoutName}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.mapWrap}>
        <MuscleMap exercises={exercises} width={100} cropBottom={6} />
      </View>

      {targetedLabels.length > 0 && (
        <>
          <Text style={styles.muscleListLabel}>Muscles sollicités</Text>
          <Text style={styles.muscleList} numberOfLines={2}>
            {targetedLabels.join(" · ")}
          </Text>
        </>
      )}

      <View style={styles.footer}>
        {duration ? <Text style={styles.duration}>{duration}</Text> : <View />}
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Voir la séance</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  workoutName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  mapWrap: {
    marginTop: 8,
    marginBottom: 6,
  },

  muscleListLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  muscleList: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    marginTop: 2,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },

  duration: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },

  ctaText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
});
