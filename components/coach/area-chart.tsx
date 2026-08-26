import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";

import { Colors } from "../../constants/colors";

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function dayLabel(dateStr: string): string {
  // "YYYY-MM-DD" → jour de la semaine, lundi = index 0 dans DAY_LABELS.
  const d = new Date(`${dateStr}T00:00:00`);
  const jsDay = d.getDay(); // 0 = dimanche
  return DAY_LABELS[(jsDay + 6) % 7];
}

// Graphique 7 jours avec repères de jour, réutilisé pour "Charge
// d'entraînement" et "Évolution du Hooper" — même tracé lissé que
// components/mini-sparkline.tsx mais en plus grand et avec un axe.
export default function AreaChart({
  points,
  color = Colors.primary,
  height = 120,
}: {
  points: { date: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (points.length < 2) return null;

  const width = 300;
  const chartHeight = height - 24;
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = width / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: chartHeight - ((p.value - min) / range) * chartHeight,
  }));

  let linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    linePath += ` Q ${prev.x.toFixed(1)} ${prev.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const lastPoint = coords[coords.length - 1];
  linePath += ` T ${lastPoint.x.toFixed(1)} ${lastPoint.y.toFixed(1)}`;

  const areaPath = `${linePath} L ${width} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <View>
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`}>
        <Defs>
          <LinearGradient id="areaFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaFill)" />
        <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} />
      </Svg>
      <View style={styles.labels}>
        {points.map((p, i) => (
          <Text key={i} style={styles.label}>
            {dayLabel(p.date)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  label: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
    width: 16,
    textAlign: "center",
  },
});
