import Svg, { Circle, Path, Rect } from "react-native-svg";

import { Colors } from "../constants/colors";

// Wordmark OZA reconstruit en SVG (anneau à encoches, Z plein, A ouvert avec barre flottante)
// Proportions relevées sur assets/images/logo.png pour ne pas déformer le tracé d'origine.
const T = 42; // épaisseur commune des traits

const RING_CX = 120;
const RING_CY = 120;
const RING_R = 120;
const RING_INNER_R = RING_R - T;
const GAP_H = 36;

const Z_X0 = 300;
const Z_X1 = 530;
const Z_Y0 = 0;
const Z_Y1 = 240;
const Z_PATH = `M${Z_X0},${Z_Y0} L${Z_X1},${Z_Y0} L${Z_X1},${Z_Y0 + T} L${Z_X0 + T},${Z_Y1 - T} L${Z_X1},${Z_Y1 - T} L${Z_X1},${Z_Y1} L${Z_X0},${Z_Y1} L${Z_X0},${Z_Y1 - T} L${Z_X1 - T},${Z_Y0 + T} L${Z_X0},${Z_Y0 + T} Z`;

const A_APEX_X = 740;
const A_APEX_Y = 0;
const A_LEFT_X = 599;
const A_RIGHT_X = 881;
const A_BOTTOM_Y = 240;
const A_LEGS_PATH = `M${A_LEFT_X},${A_BOTTOM_Y} L${A_APEX_X},${A_APEX_Y} L${A_RIGHT_X},${A_BOTTOM_Y}`;

// Barre flottante de l'A : ne touche pas les jambes, comme sur le logo de référence.
const A_BAR_TOP_Y = 211;
const A_BAR_LEFT_X = 682;
const A_BAR_RIGHT_X = 795;
const A_BAR_PATH = `M${A_APEX_X},${A_BAR_TOP_Y} L${A_BAR_LEFT_X},${A_BOTTOM_Y} L${A_BAR_RIGHT_X},${A_BOTTOM_Y} Z`;

const VIEW_W = 920;
const VIEW_H = 240;

type Props = {
  size?: number;
  color?: string;
  backgroundColor?: string;
};

export function OzaLogo({ size = 40, color = Colors.primary, backgroundColor = "#FFFFFF" }: Props) {
  const width = size * (VIEW_W / VIEW_H);

  return (
    <Svg width={width} height={size} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Circle cx={RING_CX} cy={RING_CY} r={RING_R} fill={color} />
      <Circle cx={RING_CX} cy={RING_CY} r={RING_INNER_R} fill={backgroundColor} />
      <Rect x={-10} y={RING_CY - GAP_H / 2} width={60} height={GAP_H} fill={backgroundColor} />
      <Rect x={RING_CX * 2 - 50} y={RING_CY - GAP_H / 2} width={60} height={GAP_H} fill={backgroundColor} />

      <Path d={Z_PATH} fill={color} />

      <Path d={A_LEGS_PATH} stroke={color} strokeWidth={T} fill="none" strokeLinecap="butt" strokeLinejoin="miter" />
      <Path d={A_BAR_PATH} fill={color} />
    </Svg>
  );
}
