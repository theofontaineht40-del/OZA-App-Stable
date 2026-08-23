import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";

type Props = {
  secondsLeft: number;
  totalSeconds: number;
  running: boolean;
  onPauseResume: () => void;
  onAdjust: (delta: number) => void;
  onDismiss: () => void;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RestTimerBar({
  secondsLeft,
  totalSeconds,
  running,
  onPauseResume,
  onAdjust,
  onDismiss,
}: Props) {
  const firedRef = useRef(false);
  const done = secondsLeft === 0;

  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      if (process.env.EXPO_OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    if (!done) {
      firedRef.current = false;
    }
  }, [done]);

  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, secondsLeft / totalSeconds)) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
            done && styles.progressFillDone,
          ]}
        />
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={styles.adjustButton} onPress={() => onAdjust(-15)}>
          <Text style={styles.adjustText}>-15s</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.center} onPress={onPauseResume} activeOpacity={0.8}>
          <Text style={[styles.time, done && styles.timeDone]}>
            {done ? "Repos terminé" : formatTime(secondsLeft)}
          </Text>
          {!done && (
            <Ionicons
              name={running ? "pause" : "play"}
              size={16}
              color={Colors.primary}
              style={{ marginLeft: 6 }}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.adjustButton} onPress={() => onAdjust(15)}>
          <Text style={styles.adjustText}>+15s</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    overflow: "hidden",
  },

  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grayLight,
    marginBottom: 10,
    overflow: "hidden",
  },

  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  progressFillDone: {
    backgroundColor: Colors.riskLow,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  adjustButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  adjustText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  center: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },

  time: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
    fontVariant: ["tabular-nums"],
  },

  timeDone: {
    color: Colors.riskLow,
  },

  dismissButton: {
    padding: 6,
    marginLeft: 4,
  },
});
