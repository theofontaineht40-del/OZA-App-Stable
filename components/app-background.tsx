import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Filter,
  FeGaussianBlur,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

// Fond partagé de toute l'app (monté une seule fois à la racine, voir
// app/_layout.tsx) : une vraie image de fond (dégradé multi-stops + halos
// flous en SVG, plutôt que des Views plates) — teal profond avec un halo
// lumineux subtil, avec de la profondeur et un peu de mouvement sans verser
// dans un rendu "gaming". Les écrans eux-mêmes restent transparents pour
// laisser voir ce fond derrière leurs widgets.
export default function AppBackground() {
  return (
    <View style={styles.fill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgLinearGradient id="base" x1="10%" y1="0%" x2="90%" y2="100%">
            <Stop offset="0%" stopColor="#081F1E" />
            <Stop offset="32%" stopColor="#0E3D3B" />
            <Stop offset="55%" stopColor="#146B62" />
            <Stop offset="80%" stopColor="#0E3D3B" />
            <Stop offset="100%" stopColor="#0B2E2D" />
          </SvgLinearGradient>
          <RadialGradient id="glow1" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#5EEAD4" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#5EEAD4" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow2" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#14B8A6" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow3" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
          <Filter id="blurLg" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="55" />
          </Filter>
          <Filter id="blurMd" x="-50%" y="-50%" width="200%" height="200%">
            <FeGaussianBlur stdDeviation="38" />
          </Filter>
        </Defs>

        <Rect x={0} y={0} width={800} height={900} fill="url(#base)" />

        <Circle cx={660} cy={90} r={240} fill="url(#glow1)" filter="url(#blurLg)" />
        <Circle cx={40} cy={420} r={280} fill="url(#glow2)" filter="url(#blurLg)" />
        <Circle cx={520} cy={640} r={230} fill="url(#glow3)" filter="url(#blurMd)" />
        <Circle cx={140} cy={840} r={190} fill="url(#glow1)" filter="url(#blurMd)" />
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
  },
});
