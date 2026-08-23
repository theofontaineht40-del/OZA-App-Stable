import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";
import { PersonalRecord } from "../services/tracking";

type Props = {
  visible: boolean;
  rpe: number;
  duration: number;
  load: number;
  personalRecords?: PersonalRecord[];
  onDone: () => void;
};

// Remplace l'ancienne Alert native (non animable) en fin de séance par une
// confirmation in-app : ✓ qui "pop", puis résumé qui apparaît progressivement,
// avant de renvoyer automatiquement vers l'accueil.
export default function SessionCompleteOverlay({
  visible,
  rpe,
  duration,
  load,
  personalRecords = [],
  onDone,
}: Props) {
  const backdrop = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    backdrop.setValue(0);
    checkScale.setValue(0);
    summaryOpacity.setValue(0);

    Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(150),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
    Animated.sequence([
      Animated.delay(350),
      Animated.timing(summaryOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Laisse plus de temps à l'écran avant le retour automatique quand il y a
    // un record à lire — sinon 2s suffisent à peine à voir le résumé.
    const timer = setTimeout(onDone, personalRecords.length > 0 ? 3200 : 2000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <View style={styles.card}>
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={36} color={Colors.white} />
          </Animated.View>
          <Text style={styles.title}>Séance enregistrée</Text>
          <Animated.View style={{ opacity: summaryOpacity, width: "100%" }}>
            <Text style={styles.subtitle}>Bravo, continuez comme ça 💪</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{duration}</Text>
                <Text style={styles.statLabel}>min</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{rpe}</Text>
                <Text style={styles.statLabel}>RPE</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{load}</Text>
                <Text style={styles.statLabel}>UA</Text>
              </View>
            </View>

            {personalRecords.length > 0 && (
              <View style={styles.prSection}>
                {personalRecords.map((pr) => (
                  <View key={pr.exerciceNom} style={styles.prRow}>
                    <Ionicons name="trophy" size={16} color={Colors.riskLow} />
                    <Text style={styles.prText}>
                      Nouveau record · {pr.exerciceNom} : {pr.value}kg (avant {pr.previousBest}kg)
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },

  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  stat: {
    alignItems: "center",
    paddingHorizontal: 18,
  },

  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },

  prSection: {
    width: "100%",
    marginTop: 18,
    gap: 8,
  },

  prRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  prText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.riskLow,
  },
});
