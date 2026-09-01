import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { getUniqueMuscles, NamedExercise } from "../constants/exercise-muscles";
import { zonesForGroups, zonesForMuscleIds } from "../constants/muscle-paths";
import { MuscleId } from "../constants/muscle-selection";
import MuscleMap from "./muscle-map-detailed";

// Phrases courtes affichées sous la silhouette à la place de la liste des
// muscles (jugée trop technique pour cet emplacement) — une par séance,
// stable pour une même séance/un même jour (pas de scintillement au
// re-render), pas juste aléatoire à chaque affichage.
const MOTIVATIONAL_QUOTES = [
  "Chaque série vous rapproche de l'objectif.",
  "La régularité bat le talent qui ne s'entraîne pas.",
  "Aujourd'hui, un peu plus fort qu'hier.",
  "La progression se construit séance après séance.",
  "Donnez tout, le reste suivra.",
  "Votre futur vous remerciera pour cette séance.",
  "La discipline crée les résultats.",
  "Un pas de plus vers la meilleure version de vous-même.",
  "L'effort d'aujourd'hui est la force de demain.",
  "Restez concentré, la progression suit toujours l'effort.",
];

function motivationalQuoteFor(workoutName: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${workoutName}|${today}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return MOTIVATIONAL_QUOTES[hash % MOTIVATIONAL_QUOTES.length];
}

// Widget riche pour la ligne "Prochaine séance" de l'accueil sportif —
// remplace le ListRow générique par la silhouette anatomique SVG face/dos
// (components/muscle-map-detailed.tsx). Source des zones mises en évidence,
// par ordre de priorité :
//  1. la sélection manuelle du coach sur la séance (`muscles`, tableau même
//     vide) — jamais complétée automatiquement ;
//  2. à défaut (`muscles === undefined`, séance créée avant cette
//     fonctionnalité) : l'ancienne déduction depuis les exercices.
export default function NextSessionWidget({
  workoutName,
  subtitle,
  duration,
  exercises,
  muscles,
  onPress,
}: {
  workoutName: string;
  subtitle?: string;
  duration?: string;
  exercises: NamedExercise[];
  muscles?: MuscleId[];
  onPress: () => void;
}) {
  const hasManualSelection = muscles !== undefined;
  const activeZones = hasManualSelection
    ? zonesForMuscleIds(muscles)
    : zonesForGroups(getUniqueMuscles(exercises));

  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.eyebrow}>Prochaine séance</Text>
      <Text style={styles.workoutName}>{workoutName}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.mapWrap}>
        <MuscleMap activeZones={activeZones} width={100} cropBottom={6} />
      </View>

      <Text style={styles.quote} numberOfLines={2}>
        {motivationalQuoteFor(workoutName)}
      </Text>

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

  quote: {
    fontSize: 13,
    fontWeight: "600",
    fontStyle: "italic",
    color: Colors.primary,
    textAlign: "center",
    paddingHorizontal: 8,
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
