import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

import { Gradients } from "../constants/colors";

// Dégradé turquoise des boutons principaux : à poser en PREMIER enfant d'un
// bouton dont le style a `overflow: "hidden"` (le texte passe par-dessus).
export default function GradientFill({
  colors = Gradients.cta,
}: {
  colors?: readonly [string, string, ...string[]];
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}
    />
  );
}
