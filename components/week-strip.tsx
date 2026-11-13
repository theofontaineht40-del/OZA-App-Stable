import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";
import { DayState } from "../services/schedule";

const LABELS = ["L", "M", "M", "J", "V", "S", "D"];

// Sept pastilles lundi → dimanche : faite, en retard, aujourd'hui, prévue,
// repos. Le sportif voit d'un coup d'œil s'il est dans le rythme voulu.
export default function WeekStrip({ states }: { states: DayState[] }) {
  return (
    <View style={styles.row} accessibilityLabel="Ma semaine">
      {states.map((state, i) => (
        <View key={i} style={styles.day}>
          <Text style={styles.label}>{LABELS[i]}</Text>
          <View
            style={[
              styles.dot,
              state === "done" && styles.dotDone,
              state === "late" && styles.dotLate,
              state === "today" && styles.dotToday,
              state === "plan" && styles.dotPlan,
            ]}
          >
            {state === "done" && <Text style={styles.markDone}>✓</Text>}
            {state === "late" && <Text style={styles.markLate}>!</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  day: { alignItems: "center", gap: 6 },
  label: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.grayMedium,
    alignItems: "center",
    justifyContent: "center",
  },
  dotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dotLate: { borderColor: Colors.riskHigh },
  dotToday: { borderColor: Colors.text, borderWidth: 2.5 },
  dotPlan: { borderColor: Colors.primary },
  markDone: { color: Colors.white, fontWeight: "700", fontSize: 14 },
  markLate: { color: Colors.riskHigh, fontWeight: "700", fontSize: 14 },
});
