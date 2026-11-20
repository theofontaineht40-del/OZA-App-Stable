import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";

export type BarDatum = { label: string; value: number };

// Histogramme turquoise : les barres montent à l'ouverture (animation courte).
export default function BarChart({
  data,
  height = 120,
  unit,
}: {
  data: BarDatum[];
  height?: number;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 600, useNativeDriver: false }).start();
  }, [data.map((d) => d.value).join(",")]);

  return (
    <View style={styles.row}>
      {data.map((d) => {
        const barHeight = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [4, Math.max(4, (d.value / max) * height)],
        });
        return (
          <View key={d.label} style={styles.col}>
            <Text style={styles.value}>
              {Math.round(d.value)}
              {unit ? ` ${unit}` : ""}
            </Text>
            <View style={{ height, justifyContent: "flex-end" }}>
              <Animated.View style={[styles.bar, { height: barHeight }, d.value === 0 && styles.barEmpty]} />
            </View>
            <Text style={styles.label}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  col: { flex: 1, alignItems: "center", gap: 6 },
  value: { fontSize: 11.5, fontWeight: "700", color: Colors.primaryDark },
  bar: { width: "70%", minWidth: 18, borderRadius: 8, backgroundColor: Colors.turquoise },
  barEmpty: { backgroundColor: Colors.grayLight },
  label: { fontSize: 11, color: Colors.textSecondary, fontWeight: "600" },
});
