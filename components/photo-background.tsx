import { ImageBackground, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import { Colors } from "../constants/colors";

// Deux ambiances (≈ 80 % d'écrans clairs / 20 % sombres) :
//  - "light" (par défaut) : fond blanc cassé très clair avec deux halos
//    turquoise à peine visibles, pour rester reconnaissable comme OZA sans
//    tomber dans un blanc générique ;
//  - "dark" : le fond bleu pétrole d'origine (image fournie par le coach),
//    réservé aux moments immersifs (séance en cours, bien-être du jour).
const DARK_SOURCE = require("../assets/images/image de fond oza.png");

type Variant = "accueil" | "programmes" | "seances" | "profil";

export default function PhotoBackground({
  tone = "light",
}: {
  variant?: Variant;
  tone?: "light" | "dark";
}) {
  if (tone === "dark") {
    return (
      <ImageBackground
        source={DARK_SOURCE}
        style={[styles.fill, { pointerEvents: "none" }]}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.fill, { pointerEvents: "none", backgroundColor: Colors.background }]}>
      <Svg width="100%" height="100%" viewBox="0 0 800 900" preserveAspectRatio="xMidYMin slice">
        <Defs>
          <LinearGradient id="mint" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" />
            <Stop offset="55%" stopColor="#F1FAF8" />
            <Stop offset="100%" stopColor="#D9F3EE" />
          </LinearGradient>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity={0.2} />
            <Stop offset="100%" stopColor="#2DD4BF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={800} height={900} fill="url(#mint)" />
        <Circle cx={760} cy={820} r={340} fill="url(#halo)" />
        <Circle cx={30} cy={420} r={220} fill="url(#halo)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // `width`/`height: 100%` forcent l'étirement réel sur react-native-web
    // (voir l'historique : un fond restait coupé à mi-écran sur desktop).
    width: "100%",
    height: "100%",
  },
});
