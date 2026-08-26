import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";

import { Colors } from "../constants/colors";
import { getUniqueMuscles, NamedExercise } from "../constants/exercise-muscles";
import {
  BACK_MUSCLE_PATHS,
  FRONT_MUSCLE_PATHS,
  baseZoneId,
  zonesForGroups,
} from "../constants/muscle-paths";

// Silhouette anatomique face + dos rendue en SVG natif (react-native-svg),
// ~90 zones (pecs haut/bas, deltoïde avant/latéral/arrière, lats haut/milieu/
// bas, triceps long/latéral, ischios médial/latéral…). Remplace l'empilement
// de PNG de components/muscle-map.tsx : mêmes props (`exercises`), donc
// interchangeable, mais couverture complète des 12 groupes et tracé vectoriel
// qui reste net à toute taille. Tracés extraits de `body-muscles` (Apache-2.0,
// voir constants/muscle-paths.ts).
const AnimatedG = Animated.createAnimatedComponent(G);

// Les tracés bruts laissent ~5 unités de vide entre la vue de face
// (x 0→31.5) et la vue de dos (x 36.5→68.6), plus une marge à droite.
// On rapproche le dos et on recadre serré pour que le croquis remplisse
// le cadre au lieu de flotter au centre.
const BACK_SHIFT = -4.6;
const CONTENT_W = 64; // 68.6 (largeur réelle) + BACK_SHIFT
const CONTENT_H = 92.8;

const NEUTRAL_FILL = "rgba(11, 31, 30, 0.12)";
const OUTLINE = "rgba(255, 255, 255, 0.9)";

export default function MuscleMapDetailed({
  exercises,
  width = 78,
  // Rogne le bas du cadre (unités SVG, tête→pieds = 92.8) : à taille de
  // widget égale, cacher chevilles/pieds laisse le reste du personnage
  // occuper plus de place.
  cropBottom = 0,
}: {
  exercises: NamedExercise[];
  width?: number;
  cropBottom?: number;
}) {
  const contentH = CONTENT_H - cropBottom;
  const viewBox = `0 0 ${CONTENT_W} ${contentH}`;
  const viewBoxRatio = contentH / CONTENT_W;
  const exercisesKey = exercises.map((e) => e.id ?? e.name).join("|");

  const { activeFront, activeBack } = useMemo(() => {
    const zones = zonesForGroups(getUniqueMuscles(exercises));
    return {
      activeFront: FRONT_MUSCLE_PATHS.filter((p) => zones.has(baseZoneId(p.id))),
      activeBack: BACK_MUSCLE_PATHS.filter((p) => zones.has(baseZoneId(p.id))),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercisesKey]);

  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: 700,
      delay: 100,
      // react-native-svg n'anime pas via le driver natif.
      useNativeDriver: false,
    }).start();
  }, [exercisesKey, reveal]);

  return (
    <View style={[styles.wrap, { width, height: width * viewBoxRatio }]}>
      <Svg width="100%" height="100%" viewBox={viewBox}>
        <G stroke={OUTLINE} strokeWidth={0.15}>
          {FRONT_MUSCLE_PATHS.map((p) => (
            <Path key={p.id} d={p.path} fill={NEUTRAL_FILL} />
          ))}
          <G translateX={BACK_SHIFT}>
            {BACK_MUSCLE_PATHS.map((p) => (
              <Path key={p.id} d={p.path} fill={NEUTRAL_FILL} />
            ))}
          </G>
        </G>

        <AnimatedG opacity={reveal} stroke={OUTLINE} strokeWidth={0.15}>
          {activeFront.map((p) => (
            <Path key={p.id} d={p.path} fill={Colors.primary} />
          ))}
          <G translateX={BACK_SHIFT}>
            {activeBack.map((p) => (
              <Path key={p.id} d={p.path} fill={Colors.primary} />
            ))}
          </G>
        </AnimatedG>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
  },
});
