import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Colors } from "../../constants/colors";

const SIZE = 120;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Donut à 3 segments (ok / vigilance / attention) — mêmes couleurs de
// risque que le reste de l'app (constants/colors.ts riskLow/Medium/High),
// pas une nouvelle palette.
export default function StatusDonut({
  ok,
  vigilance,
  attention,
}: {
  ok: number;
  vigilance: number;
  attention: number;
}) {
  const total = ok + vigilance + attention;
  const safeTotal = total || 1;

  const okLength = (ok / safeTotal) * CIRCUMFERENCE;
  const vigilanceLength = (vigilance / safeTotal) * CIRCUMFERENCE;
  const attentionLength = (attention / safeTotal) * CIRCUMFERENCE;

  let offset = 0;
  const segments = [
    { length: okLength, color: Colors.riskLow },
    { length: vigilanceLength, color: Colors.riskMedium },
    { length: attentionLength, color: Colors.riskHigh },
  ].filter((s) => s.length > 0);

  return (
    <View style={styles.row}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={Colors.grayLight}
            strokeWidth={STROKE}
            fill="none"
          />
          {segments.map((seg, i) => {
            const dashArray = `${seg.length} ${CIRCUMFERENCE - seg.length}`;
            const el = (
              <Circle
                key={i}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={seg.color}
                strokeWidth={STROKE}
                fill="none"
                strokeDasharray={dashArray}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                rotation={-90}
                origin={`${SIZE / 2}, ${SIZE / 2}`}
              />
            );
            offset += seg.length;
            return el;
          })}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerValue}>{total}</Text>
          <Text style={styles.centerLabel}>sportifs</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <LegendRow color={Colors.riskLow} label="OK" value={ok} />
        <LegendRow color={Colors.riskMedium} label="Vigilance" value={vigilance} />
        <LegendRow color={Colors.riskHigh} label="Attention" value={attention} />
      </View>
    </View>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  centerValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },

  centerLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },

  legend: {
    gap: 10,
    flex: 1,
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendLabel: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },

  legendValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
});
