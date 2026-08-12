import Svg, { Defs, LinearGradient, Stop, Path, Circle } from "react-native-svg";

type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
};

// Petit graphique de tendance (7 derniers jours de charge) pour la carte
// "Aujourd'hui" du tableau de bord coach — pas d'axes, pas de labels, juste
// la forme de la courbe et un point sur la dernière valeur.
export default function MiniSparkline({ values, width = 120, height = 40, color = "#FF2D7A" }: Props) {
  if (values.length < 2 || values.every((v) => v === 0)) {
    return null;
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => ({
    x: i * stepX,
    y: height - ((v - min) / range) * height,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparklineFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#sparklineFill)" />
      <Path d={linePath} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r={3} fill={color} />
    </Svg>
  );
}
