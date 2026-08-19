import { useEffect, useId, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Circle, Defs, Ellipse, Line, LinearGradient, RadialGradient, Stop } from "react-native-svg";

import { Colors } from "../constants/colors";

export type MovementPattern =
  | "squat"
  | "hinge"
  | "lunge"
  | "jump"
  | "push_horizontal"
  | "push_vertical"
  | "pull_vertical"
  | "pull_horizontal"
  | "isolation"
  | "core"
  | "core_rotation"
  | "locomotion";

type Props = { pattern: MovementPattern; size?: number };

const BG = "#DBEAFE";

// Dégradés (au lieu d'un noir plat) pour donner un effet "rendu"/volume au
// petit personnage, plutôt qu'un simple pictogramme filaire.
function BodyGradients({ id }: { id: string }) {
  return (
    <Defs>
      <LinearGradient id={`ink-${id}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#2A2A2A" />
        <Stop offset="1" stopColor={Colors.black} />
      </LinearGradient>
      <LinearGradient id={`accent-${id}`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={Colors.primary} />
        <Stop offset="1" stopColor={Colors.primaryDark} />
      </LinearGradient>
      <RadialGradient id={`shadow-${id}`} cx="0.5" cy="0.5" r="0.5">
        <Stop offset="0" stopColor="#000000" stopOpacity={0.18} />
        <Stop offset="1" stopColor="#000000" stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );
}

function Body({ size, id, children }: { size: number; id: string; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <BodyGradients id={id} />
      <Circle cx="60" cy="60" r="58" fill={BG} />
      <Ellipse cx="60" cy="103" rx="30" ry="7" fill={`url(#shadow-${id})`} />
      {children}
    </Svg>
  );
}

function Head({ cx, cy, id }: { cx: number; cy: number; id: string }) {
  return <Circle cx={cx} cy={cy} r="9" fill={`url(#ink-${id})`} />;
}

function Limb(props: {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
  accent?: boolean;
  width?: number;
  id: string;
}) {
  return (
    <Line
      x1={props.x1}
      y1={props.y1}
      x2={props.x2}
      y2={props.y2}
      stroke={`url(#${props.accent ? "accent" : "ink"}-${props.id})`}
      strokeWidth={props.width ?? 8}
      strokeLinecap="round"
    />
  );
}

function illustrationFor(pattern: MovementPattern, id: string) {
  const L = (p: Omit<Parameters<typeof Limb>[0], "id">) => <Limb {...p} id={id} />;
  const H = (cx: number, cy: number) => <Head cx={cx} cy={cy} id={id} />;

  switch (pattern) {
    case "squat":
      return (
        <>
          {L({ x1: "36", y1: "44", x2: "84", y2: "44", accent: true, width: 7 })}
          {L({ x1: "60", y1: "44", x2: "60", y2: "66" })}
          {L({ x1: "60", y1: "66", x2: "42", y2: "94" })}
          {L({ x1: "60", y1: "66", x2: "78", y2: "94" })}
          {L({ x1: "42", y1: "94", x2: "38", y2: "100" })}
          {L({ x1: "78", y1: "94", x2: "82", y2: "100" })}
          {H(60, 30)}
        </>
      );
    case "hinge":
      return (
        <>
          {L({ x1: "34", y1: "80", x2: "86", y2: "80", accent: true, width: 7 })}
          {L({ x1: "38", y1: "80", x2: "60", y2: "58" })}
          {L({ x1: "82", y1: "80", x2: "60", y2: "58" })}
          {L({ x1: "60", y1: "58", x2: "72", y2: "94" })}
          {L({ x1: "72", y1: "94", x2: "72", y2: "104" })}
          {H(44, 68)}
        </>
      );
    case "lunge":
      return (
        <>
          {L({ x1: "58", y1: "34", x2: "58", y2: "60" })}
          {L({ x1: "58", y1: "60", x2: "40", y2: "76" })}
          {L({ x1: "40", y1: "76", x2: "40", y2: "102" })}
          {L({ x1: "58", y1: "60", x2: "78", y2: "70" })}
          {L({ x1: "78", y1: "70", x2: "70", y2: "102" })}
          {L({ x1: "78", y1: "70", x2: "82", y2: "86" })}
          {H(58, 22)}
        </>
      );
    case "jump":
      return (
        <>
          {L({ x1: "60", y1: "42", x2: "60", y2: "64" })}
          {L({ x1: "60", y1: "46", x2: "42", y2: "30", accent: true })}
          {L({ x1: "60", y1: "46", x2: "78", y2: "30", accent: true })}
          {L({ x1: "60", y1: "64", x2: "44", y2: "80" })}
          {L({ x1: "60", y1: "64", x2: "76", y2: "80" })}
          {L({ x1: "44", y1: "80", x2: "40", y2: "96" })}
          {L({ x1: "76", y1: "80", x2: "80", y2: "96" })}
          {H(60, 26)}
        </>
      );
    case "push_horizontal":
      return (
        <>
          {L({ x1: "26", y1: "70", x2: "94", y2: "70", width: 7 })}
          {L({ x1: "52", y1: "70", x2: "30", y2: "52", accent: true })}
          {L({ x1: "68", y1: "70", x2: "90", y2: "52", accent: true })}
          {H(26, 70)}
        </>
      );
    case "push_vertical":
      return (
        <>
          {L({ x1: "60", y1: "46", x2: "60", y2: "80" })}
          {L({ x1: "60", y1: "80", x2: "46", y2: "104" })}
          {L({ x1: "60", y1: "80", x2: "74", y2: "104" })}
          {L({ x1: "60", y1: "50", x2: "38", y2: "26", accent: true })}
          {L({ x1: "60", y1: "50", x2: "82", y2: "26", accent: true })}
          {L({ x1: "30", y1: "24", x2: "46", y2: "24", accent: true, width: 6 })}
          {L({ x1: "74", y1: "24", x2: "90", y2: "24", accent: true, width: 6 })}
          {H(60, 34)}
        </>
      );
    case "pull_vertical":
      return (
        <>
          {L({ x1: "24", y1: "20", x2: "96", y2: "20", width: 5 })}
          {L({ x1: "60", y1: "24", x2: "60", y2: "56" })}
          {L({ x1: "60", y1: "30", x2: "34", y2: "20", accent: true })}
          {L({ x1: "60", y1: "30", x2: "86", y2: "20", accent: true })}
          {L({ x1: "60", y1: "56", x2: "48", y2: "90" })}
          {L({ x1: "60", y1: "56", x2: "72", y2: "90" })}
          {H(60, 40)}
        </>
      );
    case "pull_horizontal":
      return (
        <>
          {L({ x1: "30", y1: "86", x2: "90", y2: "60", width: 7 })}
          {L({ x1: "52", y1: "76", x2: "30", y2: "60", accent: true })}
          {L({ x1: "52", y1: "76", x2: "80", y2: "90", accent: true })}
          {H(90, 54)}
        </>
      );
    case "isolation":
      return (
        <>
          {L({ x1: "60", y1: "30", x2: "60", y2: "70" })}
          {L({ x1: "60", y1: "70", x2: "46", y2: "100" })}
          {L({ x1: "60", y1: "70", x2: "74", y2: "100" })}
          {L({ x1: "52", y1: "40", x2: "34", y2: "52", accent: true })}
          {L({ x1: "34", y1: "52", x2: "40", y2: "30", accent: true, width: 7 })}
          {H(60, 18)}
        </>
      );
    case "core":
      return (
        <>
          {L({ x1: "24", y1: "70", x2: "96", y2: "60", width: 7 })}
          {L({ x1: "30", y1: "70", x2: "30", y2: "94" })}
          {L({ x1: "96", y1: "60", x2: "100", y2: "86" })}
          {H(24, 68)}
        </>
      );
    case "core_rotation":
      return (
        <>
          <Circle cx="60" cy="66" r="4" fill={`url(#ink-${id})`} />
          {L({ x1: "60", y1: "66", x2: "60", y2: "40" })}
          {L({ x1: "60", y1: "42", x2: "36", y2: "30", accent: true })}
          {L({ x1: "60", y1: "42", x2: "84", y2: "54", accent: true })}
          {L({ x1: "60", y1: "66", x2: "44", y2: "98" })}
          {L({ x1: "60", y1: "66", x2: "76", y2: "98" })}
          {H(60, 26)}
        </>
      );
    case "locomotion":
    default:
      return (
        <>
          {L({ x1: "54", y1: "40", x2: "60", y2: "62" })}
          {L({ x1: "60", y1: "62", x2: "42", y2: "70" })}
          {L({ x1: "42", y1: "70", x2: "48", y2: "96" })}
          {L({ x1: "60", y1: "62", x2: "82", y2: "84" })}
          {L({ x1: "82", y1: "84", x2: "74", y2: "100" })}
          {L({ x1: "54", y1: "42", x2: "72", y2: "30", accent: true })}
          {L({ x1: "54", y1: "42", x2: "38", y2: "52", accent: true })}
          {H(58, 28)}
        </>
      );
  }
}

export function MovementIllustration({ pattern, size = 48 }: Props) {
  const id = useId();
  const loop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(loop, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(loop, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const translateY = loop.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const scale = loop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
      <Body size={size} id={id}>
        {illustrationFor(pattern, id)}
      </Body>
    </Animated.View>
  );
}
