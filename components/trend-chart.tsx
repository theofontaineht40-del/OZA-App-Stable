import { Fragment, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

import { Colors } from "../constants/colors";

export type TrendPoint = { date: string; value: number };

const HEIGHT = 190;
const PAD_L = 28;
const PAD_R = 10;
const PAD_T = 14;
const PAD_B = 26;
// Au-delà, les points se touchent : on ne garde que la courbe.
const MAX_DOTS = 45;

function shortDate(d: string): string {
  const parts = d.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
}

// Courbe à largeur adaptative (contrairement à ProgressionChart qui défile
// horizontalement, impraticable sur un historique de plusieurs mois) : échelle
// verticale fixe, repères de grille, et une ligne de seuil optionnelle.
export default function TrendChart({
  points,
  yMin,
  yMax,
  threshold,
  thresholdLabel = "seuil d'alerte",
}: {
  points: TrendPoint[];
  yMin: number;
  yMax: number;
  threshold?: number | null;
  thresholdLabel?: string;
}) {
  const [width, setWidth] = useState(0);

  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Pas encore assez de données.</Text>
      </View>
    );
  }

  const innerW = Math.max(width - PAD_L - PAD_R, 1);
  const innerH = HEIGHT - PAD_T - PAD_B;
  const span = yMax - yMin || 1;
  const x = (i: number) => PAD_L + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD_T + innerH - ((Math.min(Math.max(v, yMin), yMax) - yMin) / span) * innerH;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => yMin + f * span);
  const labelIdx = Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));
  const last = points[points.length - 1];

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          {grid.map((g) => (
            <Fragment key={g}>
              <Line x1={PAD_L} x2={width - PAD_R} y1={y(g)} y2={y(g)} stroke={Colors.grayLight} strokeWidth={1} />
              <SvgText x={PAD_L - 6} y={y(g) + 3} fontSize={9} fill={Colors.textSecondary} textAnchor="end">
                {Math.round(g * 10) / 10}
              </SvgText>
            </Fragment>
          ))}

          {threshold != null && threshold >= yMin && threshold <= yMax && (
            <>
              <Line
                x1={PAD_L}
                x2={width - PAD_R}
                y1={y(threshold)}
                y2={y(threshold)}
                stroke={Colors.riskHigh}
                strokeWidth={1}
                strokeDasharray="5 4"
              />
              <SvgText x={width - PAD_R} y={y(threshold) - 4} fontSize={9} fill={Colors.riskHigh} textAnchor="end">
                {thresholdLabel}
              </SvgText>
            </>
          )}

          <Path d={path} stroke={Colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {points.length <= MAX_DOTS &&
            points.map((p, i) => (
              <Circle key={i} cx={x(i)} cy={y(p.value)} r={3} fill={Colors.white} stroke={Colors.primary} strokeWidth={2} />
            ))}
          <Circle cx={x(points.length - 1)} cy={y(last.value)} r={4.5} fill={Colors.primary} />

          {labelIdx.map((i) => (
            <SvgText
              key={i}
              x={x(i)}
              y={HEIGHT - 8}
              fontSize={10}
              fill={Colors.textSecondary}
              textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
            >
              {shortDate(points[i].date)}
            </SvgText>
          ))}
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: Colors.grayLight,
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
});
