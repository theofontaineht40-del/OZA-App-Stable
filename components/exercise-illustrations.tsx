import Svg, { Circle, Line } from "react-native-svg";

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

const INK = Colors.black;
const BG = "#FFE3EE";
const STROKE = 8;

function Body({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Circle cx="60" cy="60" r="58" fill={BG} />
      {children}
    </Svg>
  );
}

function Head({ cx, cy }: { cx: number; cy: number }) {
  return <Circle cx={cx} cy={cy} r="9" fill={INK} />;
}

function Limb(props: {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
  color?: string;
  width?: number;
}) {
  return (
    <Line
      x1={props.x1}
      y1={props.y1}
      x2={props.x2}
      y2={props.y2}
      stroke={props.color ?? INK}
      strokeWidth={props.width ?? STROKE}
      strokeLinecap="round"
    />
  );
}

function illustrationFor(pattern: MovementPattern) {
  switch (pattern) {
    case "squat":
      return (
        <>
          <Limb x1="36" y1="44" x2="84" y2="44" color={Colors.primary} width={7} />
          <Limb x1="60" y1="44" x2="60" y2="66" />
          <Limb x1="60" y1="66" x2="42" y2="94" />
          <Limb x1="60" y1="66" x2="78" y2="94" />
          <Limb x1="42" y1="94" x2="38" y2="100" />
          <Limb x1="78" y1="94" x2="82" y2="100" />
          <Head cx={60} cy={30} />
        </>
      );
    case "hinge":
      return (
        <>
          <Limb x1="34" y1="80" x2="86" y2="80" color={Colors.primary} width={7} />
          <Limb x1="38" y1="80" x2="60" y2="58" />
          <Limb x1="82" y1="80" x2="60" y2="58" />
          <Limb x1="60" y1="58" x2="72" y2="94" />
          <Limb x1="72" y1="94" x2="72" y2="104" />
          <Head cx={44} cy={68} />
        </>
      );
    case "lunge":
      return (
        <>
          <Limb x1="58" y1="34" x2="58" y2="60" />
          <Limb x1="58" y1="60" x2="40" y2="76" />
          <Limb x1="40" y1="76" x2="40" y2="102" />
          <Limb x1="58" y1="60" x2="78" y2="70" />
          <Limb x1="78" y1="70" x2="70" y2="102" />
          <Limb x1="78" y1="70" x2="82" y2="86" />
          <Head cx={58} cy={22} />
        </>
      );
    case "jump":
      return (
        <>
          <Limb x1="60" y1="42" x2="60" y2="64" />
          <Limb x1="60" y1="46" x2="42" y2="30" color={Colors.primary} />
          <Limb x1="60" y1="46" x2="78" y2="30" color={Colors.primary} />
          <Limb x1="60" y1="64" x2="44" y2="80" />
          <Limb x1="60" y1="64" x2="76" y2="80" />
          <Limb x1="44" y1="80" x2="40" y2="96" />
          <Limb x1="76" y1="80" x2="80" y2="96" />
          <Head cx={60} cy={26} />
          <Line x1="20" y1="98" x2="100" y2="98" stroke={INK} strokeWidth={3} strokeDasharray="2,8" strokeLinecap="round" />
        </>
      );
    case "push_horizontal":
      return (
        <>
          <Limb x1="26" y1="70" x2="94" y2="70" width={7} />
          <Limb x1="52" y1="70" x2="30" y2="52" color={Colors.primary} />
          <Limb x1="68" y1="70" x2="90" y2="52" color={Colors.primary} />
          <Head cx={26} cy={70} />
        </>
      );
    case "push_vertical":
      return (
        <>
          <Limb x1="60" y1="46" x2="60" y2="80" />
          <Limb x1="60" y1="80" x2="46" y2="104" />
          <Limb x1="60" y1="80" x2="74" y2="104" />
          <Limb x1="60" y1="50" x2="38" y2="26" color={Colors.primary} />
          <Limb x1="60" y1="50" x2="82" y2="26" color={Colors.primary} />
          <Line x1="30" y1="24" x2="46" y2="24" stroke={Colors.primary} strokeWidth={6} strokeLinecap="round" />
          <Line x1="74" y1="24" x2="90" y2="24" stroke={Colors.primary} strokeWidth={6} strokeLinecap="round" />
          <Head cx={60} cy={34} />
        </>
      );
    case "pull_vertical":
      return (
        <>
          <Line x1="24" y1="20" x2="96" y2="20" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <Limb x1="60" y1="24" x2="60" y2="56" />
          <Limb x1="60" y1="30" x2="34" y2="20" color={Colors.primary} />
          <Limb x1="60" y1="30" x2="86" y2="20" color={Colors.primary} />
          <Limb x1="60" y1="56" x2="48" y2="90" />
          <Limb x1="60" y1="56" x2="72" y2="90" />
          <Head cx={60} cy={40} />
        </>
      );
    case "pull_horizontal":
      return (
        <>
          <Limb x1="30" y1="86" x2="90" y2="60" width={7} />
          <Limb x1="52" y1="76" x2="30" y2="60" color={Colors.primary} />
          <Limb x1="52" y1="76" x2="80" y2="90" color={Colors.primary} />
          <Head cx={90} cy={54} />
        </>
      );
    case "isolation":
      return (
        <>
          <Limb x1="60" y1="30" x2="60" y2="70" />
          <Limb x1="60" y1="70" x2="46" y2="100" />
          <Limb x1="60" y1="70" x2="74" y2="100" />
          <Limb x1="52" y1="40" x2="34" y2="52" color={Colors.primary} />
          <Limb x1="34" y1="52" x2="40" y2="30" color={Colors.primary} width={7} />
          <Head cx={60} cy={18} />
        </>
      );
    case "core":
      return (
        <>
          <Limb x1="24" y1="70" x2="96" y2="60" width={7} />
          <Limb x1="30" y1="70" x2="30" y2="94" />
          <Limb x1="96" y1="60" x2="100" y2="86" />
          <Head cx={24} cy={68} />
        </>
      );
    case "core_rotation":
      return (
        <>
          <Circle cx="60" cy="66" r="4" fill={INK} />
          <Limb x1="60" y1="66" x2="60" y2="40" />
          <Limb x1="60" y1="42" x2="36" y2="30" color={Colors.primary} />
          <Limb x1="60" y1="42" x2="84" y2="54" color={Colors.primary} />
          <Limb x1="60" y1="66" x2="44" y2="98" />
          <Limb x1="60" y1="66" x2="76" y2="98" />
          <Head cx={60} cy={26} />
        </>
      );
    case "locomotion":
    default:
      return (
        <>
          <Limb x1="54" y1="40" x2="60" y2="62" />
          <Limb x1="60" y1="62" x2="42" y2="70" />
          <Limb x1="42" y1="70" x2="48" y2="96" />
          <Limb x1="60" y1="62" x2="82" y2="84" />
          <Limb x1="82" y1="84" x2="74" y2="100" />
          <Limb x1="54" y1="42" x2="72" y2="30" color={Colors.primary} />
          <Limb x1="54" y1="42" x2="38" y2="52" color={Colors.primary} />
          <Head cx={58} cy={28} />
        </>
      );
  }
}

export function MovementIllustration({ pattern, size = 48 }: Props) {
  return <Body size={size}>{illustrationFor(pattern)}</Body>;
}
