import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Line, Stop } from "react-native-svg";

import { Colors } from "../constants/colors";

// Éléments décoratifs abstraits/vectoriels (pas de vraies photos disponibles
// dans le projet) : lignes fines, halos, grilles — dans l'esprit du
// HeaderTexture déjà présent sur l'accueil coach. Toujours en fond,
// pointerEvents="none", jamais au-dessus du contenu réel.

function usePulse(min: number, max: number, duration: number) {
  const value = useRef(new Animated.Value(min)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: max, duration, useNativeDriver: true }),
        Animated.timing(value, { toValue: min, duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return value;
}

// Lignes diagonales + anneau, déjà validées sur l'accueil coach — reprises
// ici telles quelles pour l'accueil sportif (cohérence entre les 2 accueils).
export function HeaderTexture() {
  const opacity = usePulse(0.7, 1, 3200);
  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.View style={[styles.fill, { opacity }]}>
        <Svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <SvgLinearGradient id="fade" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.5} />
              <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <Line x1="260" y1="-20" x2="440" y2="160" stroke="url(#fade)" strokeWidth={1} />
          <Line x1="300" y1="-20" x2="480" y2="160" stroke="url(#fade)" strokeWidth={1} />
          <Line x1="340" y1="-20" x2="520" y2="160" stroke="url(#fade)" strokeWidth={1} />
          <Circle cx="365" cy="35" r="70" stroke={Colors.primary} strokeOpacity={0.18} strokeWidth={1} fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// Anneaux concentriques discrets derrière la carte avatar des écrans profil —
// évite le grand aplat vide au-dessus/autour de l'avatar sans gêner la carte.
export function AvatarHalo() {
  const opacity = usePulse(0.5, 1, 3600);
  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.View style={[styles.fill, { opacity }]}>
        <Svg width="100%" height="260" viewBox="0 0 400 260">
          <Defs>
            <SvgLinearGradient id="haloFade" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.22} />
              <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <Circle cx="200" cy="10" r="150" stroke="url(#haloFade)" strokeWidth={1} fill="none" />
          <Circle cx="200" cy="10" r="110" stroke="url(#haloFade)" strokeWidth={1} fill="none" />
          <Circle cx="200" cy="10" r="70" stroke="url(#haloFade)" strokeWidth={1} fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// Grille de lignes très discrète pour les écrans de statistiques — évoque un
// fond de graphique sans dupliquer le graphique lui-même.
export function GraphGridTexture() {
  const rows = [40, 80, 120, 160];
  return (
    <View style={styles.fill} pointerEvents="none">
      <Svg width="100%" height="200" viewBox="0 0 400 200">
        {rows.map((y) => (
          <Line key={y} x1="0" y1={y} x2="400" y2={y} stroke={Colors.border} strokeWidth={1} strokeOpacity={0.5} />
        ))}
        <Line x1="330" y1="0" x2="330" y2="200" stroke={Colors.primary} strokeOpacity={0.12} strokeWidth={1} />
      </Svg>
    </View>
  );
}

// Voile diagonal extrêmement subtil pour les fonds de listes (programmes) —
// juste assez pour casser le noir plat, sans texture visible en tant que telle.
export function AmbientWash() {
  return (
    <View style={styles.fill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgLinearGradient id="wash" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.06} />
            <Stop offset="35%" stopColor={Colors.primary} stopOpacity={0} />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="0" cy="0" r="260" fill="url(#wash)" />
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
