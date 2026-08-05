import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AGE_BRACKETS, AgeBracket, SEXES, Sexe } from "../../constants/athlete-segments";
import { Colors } from "../../constants/colors";
import { MOBILITY_TESTS } from "../../constants/mobility-tests";
import { PHYSICAL_TESTS } from "../../constants/physical-tests";
import { QUALITES, SPORTS } from "../../constants/sports-radar";
import { TEST_QUALITY_MAP } from "../../constants/test-quality-mapping";
import { auth } from "../../firebase";
import { getThresholds, setThreshold, Threshold } from "../../services/referentials";

const ALL_TESTS = [...MOBILITY_TESTS, ...PHYSICAL_TESTS].filter(
  (t) => TEST_QUALITY_MAP[t.key]
);

function qualityLabel(key: string): string {
  return QUALITES.find((q) => q.key === key)?.label ?? key;
}

export default function ReferentielsScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [sexe, setSexe] = useState<Sexe>("H");
  const [ageBracket, setAgeBracket] = useState<AgeBracket>("18_35");
  const [sportKey, setSportKey] = useState<string>(SPORTS[0].key);
  const [thresholds, setThresholds] = useState<Record<string, Threshold>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { low0: string; high10: string }>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    getThresholds(uid, sexe, ageBracket, sportKey)
      .then((data) => {
        setThresholds(data);
        const initialDrafts: Record<string, { low0: string; high10: string }> = {};
        ALL_TESTS.forEach((t) => {
          const existing = data[t.key];
          initialDrafts[t.key] = {
            low0: existing ? String(existing.low0) : "",
            high10: existing ? String(existing.high10) : "",
          };
        });
        setDrafts(initialDrafts);
      })
      .finally(() => setLoading(false));
  }, [uid, sexe, ageBracket, sportKey]);

  async function handleSave(testKey: string) {
    if (!uid) return;
    const draft = drafts[testKey];
    const low0 = parseFloat(draft.low0);
    const high10 = parseFloat(draft.high10);
    if (isNaN(low0) || isNaN(high10)) return;

    setSavingKey(testKey);
    try {
      await setThreshold(uid, testKey, sexe, ageBracket, sportKey, { low0, high10 });
      setThresholds((prev) => ({ ...prev, [testKey]: { low0, high10 } }));
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Mes référentiels</Text>
      <Text style={styles.subtitle}>
        Définissez vos propres seuils, par sexe, tranche d'âge et sport, pour
        convertir automatiquement les résultats de tests en note /10 dans le
        Task Analysis.
      </Text>

      <Text style={styles.segmentLabel}>Sexe</Text>
      <View style={styles.segmentRow}>
        {SEXES.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.segmentChip, sexe === s.key && styles.segmentChipActive]}
            onPress={() => setSexe(s.key)}
          >
            <Text
              style={[styles.segmentText, sexe === s.key && styles.segmentTextActive]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.segmentLabel}>Tranche d'âge</Text>
      <View style={styles.segmentRow}>
        {AGE_BRACKETS.map((a) => (
          <TouchableOpacity
            key={a.key}
            style={[styles.segmentChip, ageBracket === a.key && styles.segmentChipActive]}
            onPress={() => setAgeBracket(a.key)}
          >
            <Text
              style={[styles.segmentText, ageBracket === a.key && styles.segmentTextActive]}
            >
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.segmentLabel}>Sport</Text>
      <View style={[styles.segmentRow, { marginBottom: 24 }]}>
        {SPORTS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.segmentChip, sportKey === s.key && styles.segmentChipActive]}
            onPress={() => setSportKey(s.key)}
          >
            <Text
              style={[styles.segmentText, sportKey === s.key && styles.segmentTextActive]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        ALL_TESTS.map((test) => {
          const quality = TEST_QUALITY_MAP[test.key]!;
          const draft = drafts[test.key] ?? { low0: "", high10: "" };
          const hasSaved = !!thresholds[test.key];

          return (
            <View key={test.key} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.testLabel}>{test.label}</Text>
                {hasSaved && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.riskLow} />
                )}
              </View>
              <Text style={styles.qualityText}>→ {qualityLabel(quality)}</Text>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>
                    Valeur basse ({test.unite}) = 0/10
                  </Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={draft.low0}
                    onChangeText={(t) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [test.key]: { ...prev[test.key], low0: t },
                      }))
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>
                    Valeur haute ({test.unite}) = 10/10
                  </Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={draft.high10}
                    onChangeText={(t) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [test.key]: { ...prev[test.key], high10: t },
                      }))
                    }
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSave(test.key)}
                disabled={savingKey === test.key}
              >
                {savingKey === test.key ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },

  segmentLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
  },

  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },

  segmentChip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  segmentChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  segmentTextActive: {
    color: Colors.white,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  testLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  qualityText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  fieldLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 6,
  },

  input: {
    height: 42,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
  },

  saveButton: {
    backgroundColor: Colors.primary,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  saveButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
});
