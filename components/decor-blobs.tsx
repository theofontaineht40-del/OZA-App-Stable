import Svg, { Defs, RadialGradient, Stop, Ellipse } from "react-native-svg";
import { StyleSheet, View } from "react-native";

// Fond décoratif pour donner du relief sur un fond blanc : des halos dégradés
// (façon "aurora") plutôt qu'un vrai flou — react-native-svg ne supporte pas
// feGaussianBlur de façon fiable sur toutes les plateformes, donc la douceur
// vient d'empiler plusieurs arrêts de dégradé qui s'estompent progressivement.
// Purement décoratif : pointerEvents="none", en dessous du contenu (zIndex -1).
export default function DecorBlobs() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="blobPink" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF2D7A" stopOpacity={0.22} />
            <Stop offset="45%" stopColor="#FF2D7A" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#FF2D7A" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blobPinkSoft" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FF6FA5" stopOpacity={0.16} />
            <Stop offset="50%" stopColor="#FF6FA5" stopOpacity={0.07} />
            <Stop offset="100%" stopColor="#FF6FA5" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="blobInk" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#111111" stopOpacity={0.05} />
            <Stop offset="60%" stopColor="#111111" stopOpacity={0.02} />
            <Stop offset="100%" stopColor="#111111" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Ellipse cx="330" cy="80" rx="230" ry="230" fill="url(#blobPink)" />
        <Ellipse cx="40" cy="360" rx="200" ry="200" fill="url(#blobPinkSoft)" />
        <Ellipse cx="360" cy="620" rx="260" ry="260" fill="url(#blobInk)" />
        <Ellipse cx="80" cy="720" rx="170" ry="170" fill="url(#blobPink)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});
