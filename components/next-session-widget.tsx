import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { getUniqueMuscles, NamedExercise } from "../constants/exercise-muscles";
import { MUSCLE_LABELS } from "../constants/muscle-groups";
import MuscleMap from "./muscle-map-detailed";

// Widget riche pour la ligne "Prochaine séance" de l'accueil sportif —
// remplace le ListRow générique par une silhouette anatomique face/dos
// mettant en évidence les groupes musculaires travaillés par les exercices
// de la séance à venir (exercises → muscles, voir constants/exercise-muscles.ts).
//
// Pas de sous-titre ni de liste de muscles sur plusieurs lignes : le nom du
// programme est déjà affiché juste au-dessus (accueil), et l'espace vertical
// ainsi gagné sert à rendre le croquis plus lisible sans agrandir la carte.
export default function NextSessionWidget({
  workoutName,
  duration,
  exercises,
  onPress,
}: {
  workoutName: string;
  duration?: string;
  exercises: NamedExercise[];
  onPress: () => void;
}) {
  const targetedLabels = getUniqueMuscles(exercises).map((group) => MUSCLE_LABELS[group]);

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.eyebrow}>Prochaine séance</Text>
      <Text style={styles.workoutName}>{workoutName}</Text>

      <View style={styles.mapWrap}>
        <MuscleMap exercises={exercises} width={96} cropBottom={6} />
      </View>

      {targetedLabels.length > 0 && (
        <Text style={styles.muscleList} numberOfLines={1}>
          {targetedLabels.join(" · ")}
        </Text>
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
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  workoutName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 2,
  },

  mapWrap: {
    marginTop: 4,
    marginBottom: 2,
  },

  muscleList: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
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
