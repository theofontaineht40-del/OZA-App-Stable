import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";

// ── Séance du jour ──

// Carte principale de l'accueil : une séance, un bouton.
export function TodayHero({
  eyebrow,
  title,
  meta,
  buttonLabel,
  done,
  onPress,
}: {
  eyebrow: string;
  title: string;
  meta?: string;
  buttonLabel?: string;
  done?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroEyebrow}>{eyebrow}</Text>
      <View style={styles.heroTitleRow}>
        {done && <Ionicons name="checkmark-circle" size={22} color={Colors.primaryLight} />}
        <Text style={styles.heroTitle}>{title}</Text>
      </View>
      {!!meta && <Text style={styles.heroMeta}>{meta}</Text>}
      {!!buttonLabel && !!onPress && (
        <TouchableOpacity style={styles.heroButton} onPress={onPress} activeOpacity={0.85}>
          <Ionicons name="play" size={16} color="#04312C" />
          <Text style={styles.heroButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── À faire aujourd'hui ──

export type TodoItem = {
  key: string;
  label: string;
  done: boolean;
  late?: boolean;
  onPress?: () => void;
};

export function TodoCard({ items }: { items: TodoItem[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>À FAIRE AUJOURD'HUI</Text>
      {items.map((item, i) => (
        <TouchableOpacity
          key={item.key}
          style={[styles.todoRow, i > 0 && styles.todoRowBorder]}
          onPress={item.onPress}
          disabled={!item.onPress || item.done}
          activeOpacity={0.7}
        >
          <View style={[styles.check, item.done && styles.checkDone]}>
            {item.done && <Ionicons name="checkmark" size={12} color={Colors.white} />}
          </View>
          <Text
            style={[
              styles.todoLabel,
              item.done && styles.todoLabelDone,
              item.late && !item.done && { color: Colors.riskHigh },
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          {!item.done && !!item.onPress && (
            <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Mot du coach ──

export function CoachWordCard({
  coachName,
  text,
  onPress,
}: {
  coachName: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.cardTitle}>MOT DE TON COACH</Text>
      <View style={styles.quote}>
        <Text style={styles.quoteText} numberOfLines={3}>
          {text}
        </Text>
        <Text style={styles.quoteBy}>{coachName}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Progression ──

export function ProgressCard({
  weekDone,
  weekTotal,
  goalLabel,
  goalProgress,
  onPressGoal,
  onPressHistory,
}: {
  weekDone: number;
  weekTotal: number | null; // null = pas de planning, on affiche seulement le nombre
  goalLabel: string | null;
  goalProgress: number | null; // 0..1
  onPressGoal: () => void;
  onPressHistory: () => void;
}) {
  const weekRatio = weekTotal && weekTotal > 0 ? Math.min(weekDone / weekTotal, 1) : null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>MA PROGRESSION</Text>
      <TouchableOpacity onPress={onPressHistory} activeOpacity={0.8}>
        <View style={styles.progressHead}>
          <Text style={styles.progressValue}>
            {weekTotal ? `${weekDone} / ${weekTotal}` : weekDone}
            <Text style={styles.progressUnit}> séance{weekDone > 1 || (weekTotal ?? 0) > 1 ? "s" : ""} cette semaine</Text>
          </Text>
        </View>
        {weekRatio !== null && (
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${weekRatio * 100}%` }]} />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 14 }} onPress={onPressGoal} activeOpacity={0.8}>
        {goalProgress !== null ? (
          <>
            <Text style={styles.progressValue}>
              {Math.round(goalProgress * 100)} %
              <Text style={styles.progressUnit}> de l'objectif</Text>
            </Text>
            <View style={styles.bar}>
              <View style={[styles.barFill, { width: `${goalProgress * 100}%` }]} />
            </View>
            {!!goalLabel && <Text style={styles.goalLabel}>{goalLabel}</Text>}
          </>
        ) : (
          <View style={styles.goalEmpty}>
            <Ionicons name="flag-outline" size={16} color={Colors.primary} />
            <Text style={styles.goalEmptyText}>Fixer un objectif</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.navBackground,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    gap: 6,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: Colors.primaryLight,
    textTransform: "uppercase",
  },
  heroTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroTitle: { fontSize: 24, fontWeight: "700", color: Colors.white, flexShrink: 1 },
  heroMeta: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    marginTop: 10,
  },
  heroButtonText: { fontSize: 15, fontWeight: "700", color: "#04312C" },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  todoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  todoRowBorder: { borderTopWidth: 1, borderTopColor: Colors.grayLight },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.grayMedium,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  todoLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: Colors.text },
  todoLabelDone: { color: Colors.textSecondary, textDecorationLine: "line-through" },

  quote: { borderLeftWidth: 3, borderLeftColor: Colors.primary, paddingLeft: 12, gap: 4 },
  quoteText: { fontSize: 14, fontStyle: "italic", color: Colors.text, lineHeight: 20 },
  quoteBy: { fontSize: 12, color: Colors.textSecondary },

  progressHead: { flexDirection: "row", alignItems: "baseline" },
  progressValue: { fontSize: 20, fontWeight: "700", color: Colors.text },
  progressUnit: { fontSize: 13, fontWeight: "400", color: Colors.textSecondary },
  bar: { height: 8, borderRadius: 4, backgroundColor: Colors.grayLight, marginTop: 8, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, backgroundColor: Colors.primary },
  goalLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  goalEmpty: { flexDirection: "row", alignItems: "center", gap: 8 },
  goalEmptyText: { fontSize: 14, fontWeight: "600", color: Colors.primary },
});
