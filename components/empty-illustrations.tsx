import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

import { Colors } from "../constants/colors";

type Props = { size?: number };

const INK = Colors.black;
const FILL = "#FFE3EE";

// Léger flottement continu (translation + rotation) pour donner un peu de
// vie aux illustrations qui remplissent les écrans vides, sans distraire de
// l'essentiel : chaque instance démarre son cycle sur un délai différent
// pour éviter que toutes les illustrations d'une même page bougent en
// parfaite synchro.
function FloatingIllustration({ children, seed = 0 }: { children: React.ReactNode; seed?: number }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay((seed % 5) * 200),
        Animated.timing(float, { toValue: 1, duration: 2600, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const rotate = float.interpolate({ inputRange: [0, 1], outputRange: ["-2deg", "2deg"] });

  return (
    <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
      {children}
    </Animated.View>
  );
}

export function CoachIllustration({ size = 96 }: Props) {
  return (
    <FloatingIllustration seed={1}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle cx="48" cy="48" r="44" fill={FILL} />
        <Circle cx="48" cy="38" r="14" fill={Colors.white} stroke={INK} strokeWidth={3} />
        <Path
          d="M22 76c0-14.4 11.6-24 26-24s26 9.6 26 24"
          fill={Colors.white}
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Circle cx="74" cy="30" r="11" fill={Colors.primary} />
        <Line x1="74" y1="25" x2="74" y2="35" stroke={Colors.white} strokeWidth={3} strokeLinecap="round" />
        <Line x1="69" y1="30" x2="79" y2="30" stroke={Colors.white} strokeWidth={3} strokeLinecap="round" />
      </Svg>
    </FloatingIllustration>
  );
}

export function ProgrammeIllustration({ size = 96 }: Props) {
  return (
    <FloatingIllustration seed={2}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle cx="48" cy="48" r="44" fill={FILL} />
        <Line x1="20" y1="48" x2="76" y2="48" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <Rect x="14" y="36" width="12" height="24" rx="4" fill={Colors.primary} />
        <Rect x="70" y="36" width="12" height="24" rx="4" fill={Colors.primary} />
        <Rect x="28" y="41" width="8" height="14" rx="3" fill={INK} />
        <Rect x="60" y="41" width="8" height="14" rx="3" fill={INK} />
        <Path
          d="M40 30l2 8M56 30l-2 8"
          stroke={Colors.primaryDark}
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
    </FloatingIllustration>
  );
}

export function ChatIllustration({ size = 96 }: Props) {
  return (
    <FloatingIllustration seed={3}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle cx="48" cy="48" r="44" fill={FILL} />
        <Path
          d="M26 34a8 8 0 0 1 8-8h28a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H42l-10 10v-10h-6a8 8 0 0 1-8-8V34z"
          fill={Colors.white}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <Circle cx="40" cy="43" r="3" fill={Colors.primary} />
        <Circle cx="50" cy="43" r="3" fill={Colors.primary} />
        <Circle cx="60" cy="43" r="3" fill={Colors.primary} />
      </Svg>
    </FloatingIllustration>
  );
}

export function CalendarIllustration({ size = 96 }: Props) {
  return (
    <FloatingIllustration seed={4}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle cx="48" cy="48" r="44" fill={FILL} />
        <Rect x="24" y="30" width="48" height="42" rx="8" fill={Colors.white} stroke={INK} strokeWidth={3} />
        <Line x1="24" y1="42" x2="72" y2="42" stroke={INK} strokeWidth={3} />
        <Line x1="34" y1="24" x2="34" y2="34" stroke={Colors.primary} strokeWidth={4} strokeLinecap="round" />
        <Line x1="62" y1="24" x2="62" y2="34" stroke={Colors.primary} strokeWidth={4} strokeLinecap="round" />
        <Circle cx="48" cy="57" r="6" fill={Colors.primary} />
      </Svg>
    </FloatingIllustration>
  );
}

export function TeamIllustration({ size = 96 }: Props) {
  return (
    <FloatingIllustration seed={5}>
      <Svg width={size} height={size} viewBox="0 0 96 96">
        <Circle cx="48" cy="48" r="44" fill={FILL} />
        <Circle cx="36" cy="38" r="11" fill={Colors.white} stroke={INK} strokeWidth={3} />
        <Path
          d="M16 74c0-11.6 9-19 20-19s20 7.4 20 19"
          fill={Colors.white}
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Circle cx="63" cy="34" r="9" fill={Colors.primary} />
        <Path
          d="M46 74c1-9.6 8.4-16 17-16s16 6.4 17 16"
          fill={Colors.primary}
          opacity={0.9}
        />
      </Svg>
    </FloatingIllustration>
  );
}
