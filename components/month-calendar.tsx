import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { Type } from "../constants/tokens";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Calendrier mensuel (lundi en premier) : les jours qui ont quelque chose à
// montrer (`marked`) portent un point, le jour choisi est plein turquoise.
// Réutilisé par les réservations des deux rôles.
export default function MonthCalendar({
  year,
  month, // 0-11
  selected,
  marked,
  today,
  onSelect,
  onChangeMonth,
}: {
  year: number;
  month: number;
  selected: string | null;
  marked: Set<string>;
  today: string;
  onSelect: (date: string | null) => void;
  onChangeMonth: (delta: -1 | 1) => void;
}) {
  const first = new Date(year, month, 1, 12);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const label = first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.month}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
        <View style={styles.arrows}>
          <TouchableOpacity onPress={() => onChangeMonth(-1)} hitSlop={10} style={styles.arrow}>
            <Ionicons name="chevron-back" size={18} color={Colors.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onChangeMonth(1)} hitSlop={10} style={styles.arrow}>
            <Ionicons name="chevron-forward" size={18} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, w) => (
        <View key={w} style={styles.weekRow}>
          {cells.slice(w * 7, w * 7 + 7).map((day, i) => {
            if (day === null) return <View key={i} style={styles.cell} />;
            const date = iso(year, month, day);
            const isSelected = selected === date;
            const isToday = date === today;
            return (
              <TouchableOpacity
                key={i}
                style={styles.cell}
                onPress={() => onSelect(isSelected ? null : date)}
                activeOpacity={0.7}
              >
                <View style={[styles.dayBubble, isSelected && styles.dayBubbleSelected, !isSelected && isToday && styles.dayBubbleToday]}>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                </View>
                <View style={[styles.dot, marked.has(date) && (isSelected ? styles.dotOnSelected : styles.dotOn)]} />
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#062D2B",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  month: { fontFamily: Type.headingSemi, fontSize: 20, color: Colors.primaryDark },
  arrows: { flexDirection: "row", gap: 8 },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  weekRow: { flexDirection: "row" },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11.5,
    fontWeight: "700",
    color: Colors.textSecondary,
    paddingVertical: 6,
  },
  cell: { flex: 1, alignItems: "center", paddingVertical: 3, minHeight: 44 },
  dayBubble: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dayBubbleSelected: { backgroundColor: Colors.primary },
  dayBubbleToday: { borderWidth: 1.5, borderColor: Colors.turquoise },
  dayText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  dayTextSelected: { color: Colors.white },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2, backgroundColor: "transparent" },
  dotOn: { backgroundColor: Colors.turquoise },
  dotOnSelected: { backgroundColor: Colors.primary },
});
