import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { BLOC_COLORS } from "../constants/exercise-library";
import { blockDateRange, dateForWeek, formatShortDate, PlanBlock } from "../services/planification";

type Props = {
  blocks: PlanBlock[];
  weeksTotal: number;
  startDate: string | null;
  programmeNames: Record<string, string>;
  onPressBlock: (block: PlanBlock) => void;
};

export default function PlanificationTimeline({
  blocks,
  weeksTotal,
  startDate,
  programmeNames,
  onPressBlock,
}: Props) {
  if (blocks.length === 0) {
    return <Text style={styles.emptyText}>Aucune planification pour l'instant.</Text>;
  }

  const total = Math.max(weeksTotal, ...blocks.map((b) => b.endWeek), 1);
  const axisStart = startDate ? formatShortDate(dateForWeek(startDate, 1)) : "Semaine 1";
  const axisEnd = startDate
    ? formatShortDate(dateForWeek(startDate, total + 1))
    : `Semaine ${total}`;

  return (
    <View>
      <View style={styles.weekAxis}>
        <Text style={styles.weekAxisText}>{axisStart}</Text>
        <Text style={styles.weekAxisText}>{axisEnd}</Text>
      </View>

      {blocks.map((block, index) => {
        const color = BLOC_COLORS[index % BLOC_COLORS.length];
        const leftPct = ((block.startWeek - 1) / total) * 100;
        const widthPct = Math.max(((block.endWeek - block.startWeek + 1) / total) * 100, 6);

        return (
          <TouchableOpacity key={block.id} style={styles.row} onPress={() => onPressBlock(block)}>
            <View style={styles.labelRow}>
              <Text style={styles.blockLabel} numberOfLines={1}>
                {block.label}
              </Text>
              {!!startDate && (
                <Text style={styles.blockDate}>
                  {blockDateRange(startDate, block.startWeek, block.endWeek)}
                </Text>
              )}
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.segment,
                  {
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  },
                ]}
              >
                <Text style={styles.segmentText} numberOfLines={1}>
                  {block.programmeId ? programmeNames[block.programmeId] ?? "Programme" : "Non lié"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  weekAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  weekAxisText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  row: {
    marginBottom: 12,
  },

  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },

  blockLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  blockDate: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  track: {
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.grayLight,
    position: "relative",
    overflow: "hidden",
  },

  segment: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  segmentText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
});
