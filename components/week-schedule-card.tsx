import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { ScheduledSession, ScheduleStatus } from "../services/schedule";

const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  done: "Faite",
  late: "En retard",
  today: "Aujourd'hui",
  upcoming: "À venir",
};

const STATUS_COLOR: Record<ScheduleStatus, string> = {
  done: Colors.riskLow,
  late: Colors.riskHigh,
  today: Colors.primary,
  upcoming: Colors.textSecondary,
};

// Séances que le coach a posées sur la semaine en cours, avec leur statut.
// Touchée, une séance de programme ouvre directement son exécution.
export default function WeekScheduleCard({
  items,
  statuses,
}: {
  items: { item: ScheduledSession; dayIndex: number }[];
  statuses: Map<string, ScheduleStatus>;
}) {
  if (items.length === 0) return null;

  return (
    <View style={styles.card}>
      {items.map(({ item, dayIndex }, i) => {
        const status = statuses.get(item.id) ?? "upcoming";
        const canOpen = item.kind === "programme" && !!item.programmeId && !!item.seanceId;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, i > 0 && styles.rowBorder]}
            activeOpacity={canOpen ? 0.7 : 1}
            disabled={!canOpen || status === "done"}
            onPress={() =>
              router.push(`/sportif/programme/${item.programmeId}/seance/${item.seanceId}`)
            }
          >
            <Text style={styles.day}>{DAY_NAMES[dayIndex]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {item.titre}
              </Text>
              {item.programmeNom ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {item.programmeNom}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.status, { color: STATUS_COLOR[status] }]}>
              {STATUS_LABEL[status]}
            </Text>
            {canOpen && status !== "done" && (
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    marginBottom: 24,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.grayLight },
  day: { width: 34, fontSize: 12, fontWeight: "700", color: Colors.primary },
  title: { fontSize: 14, fontWeight: "600", color: Colors.text },
  meta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  status: { fontSize: 12, fontWeight: "700" },
});
