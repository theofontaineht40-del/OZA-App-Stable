import { Fragment } from "react";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";

export type ProgressionPoint = { date: string; value: number };

const HEIGHT = 160;
const TOP_PAD = 24;
const BOTTOM_PAD = 30;
const STEP = 64;

function formatDate(d: string): string {
  const parts = d.split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}`;
}

export default function ProgressionChart({ points }: { points: ProgressionPoint[] }) {
  if (points.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Pas encore assez de données pour cet exercice.</Text>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableHeight = HEIGHT - TOP_PAD - BOTTOM_PAD;

  function yFor(value: number): number {
    return TOP_PAD + usableHeight - ((value - min) / range) * usableHeight;
  }

  const width = Math.max(points.length * STEP, 260);
  const xFor = (i: number) => 30 + i * STEP;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`)
    .join(" ");

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={width + 30} height={HEIGHT}>
        <Path d={linePath} stroke={Colors.primary} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <Fragment key={i}>
            <Circle cx={xFor(i)} cy={yFor(p.value)} r={5} fill={Colors.white} stroke={Colors.primary} strokeWidth={3} />
            <SvgText x={xFor(i)} y={yFor(p.value) - 12} fontSize={11} fontWeight="700" fill={Colors.text} textAnchor="middle">
              {p.value}
            </SvgText>
            <SvgText x={xFor(i)} y={HEIGHT - 8} fontSize={10} fill={Colors.textSecondary} textAnchor="middle">
              {formatDate(p.date)}
            </SvgText>
          </Fragment>
        ))}
        <Line x1={20} y1={HEIGHT - BOTTOM_PAD} x2={width + 10} y2={HEIGHT - BOTTOM_PAD} stroke={Colors.grayMedium} strokeWidth={1} />
      </Svg>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 20,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
