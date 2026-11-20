import { StyleSheet, Text, View } from "react-native";

import { ExerciseTemplate } from "../constants/exercise-library";
import ExerciseThumb from "./exercise-thumb";

// Rangée de vignettes d'exercices (accueil sportif : « voilà ce qui t'attend »)
// avec un compteur « +N » quand il y en a plus que `max`.
export default function ExerciseStrip({
  ids,
  library,
  max = 5,
  size = 46,
  light = false,
}: {
  // Sur fond clair (carte blanche) au lieu du bandeau turquoise.
  light?: boolean;
  ids: string[];
  library: Map<string, ExerciseTemplate>;
  max?: number;
  size?: number;
}) {
  if (ids.length === 0) return null;
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <View style={styles.row}>
      {shown.map((id, i) => (
        <View key={`${id}-${i}`} style={[styles.frame, { borderRadius: size * 0.3 + 2 }]}>
          <ExerciseThumb exercise={library.get(id)} size={size} radius={size * 0.3} />
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.more, light && styles.moreLight, { width: size, height: size, borderRadius: size * 0.3 }]}>
          <Text style={[styles.moreText, light && styles.moreTextLight]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  frame: { padding: 2, backgroundColor: "#FFFFFF" },
  frameLight: { borderWidth: 1, borderColor: "rgba(11,31,30,0.10)" },
  moreLight: { backgroundColor: "#E1F5F0" },
  moreTextLight: { color: "#0B2E2D" },
  more: { backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  moreText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});
