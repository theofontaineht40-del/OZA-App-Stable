import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";
import { computeGoalProgress, Goal } from "../services/goals";
import AnimatedPressable from "./animated-pressable";

export default function GoalCard({ goal }: { goal: Goal | null }) {
  if (!goal) {
    return (
      <AnimatedPressable
        style={styles.emptyCard}
        onPress={() => router.push("/sportif/objectif")}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="flag-outline" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.emptyTitle}>Définir un objectif</Text>
          <Text style={styles.emptyText}>Un but concret à suivre, semaine après semaine.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
      </AnimatedPressable>
    );
  }

  const progress = computeGoalProgress(goal);
  const done = progress >= 1;

  return (
    <AnimatedPressable style={styles.card} onPress={() => router.push("/sportif/objectif")}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={done ? "checkmark-circle" : "flag"}
            size={18}
            color={done ? Colors.riskLow : Colors.primary}
          />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {goal.description}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.round(progress * 100)}%` },
            done && styles.progressFillDone,
          ]}
        />
      </View>

      <Text style={styles.progressCaption}>
        {goal.currentValue}{goal.unit} → {goal.targetValue}{goal.unit}
        {"  ·  "}
        {Math.round(progress * 100)}%
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.accentTint,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.grayLight,
    overflow: "hidden",
    marginBottom: 8,
  },

  progressFill: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },

  progressFillDone: {
    backgroundColor: Colors.riskLow,
  },

  progressCaption: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
});
