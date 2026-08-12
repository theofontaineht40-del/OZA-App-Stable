import { Ionicons } from "@expo/vector-icons";
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

import { Colors } from "../constants/colors";
import { TestCategory, TestDefinition } from "../constants/test-types";
import { addTestResult, getTestResults, TestResult } from "../services/tests";

export function TestLibraryScreen({
  title,
  category,
  tests,
  sportifId,
}: {
  title: string;
  category: TestCategory;
  tests: TestDefinition[];
  sportifId: string;
}) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [valueLeft, setValueLeft] = useState("");
  const [valueRight, setValueRight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTestResults(sportifId, category).then((data) => {
      setResults(data);
      setLoading(false);
    });
  }, [sportifId, category]);

  function toggleTest(test: TestDefinition) {
    if (expandedKey === test.key) {
      setExpandedKey(null);
      return;
    }
    setExpandedKey(test.key);
    setValue("");
    setValueLeft("");
    setValueRight("");
    setNotes("");
  }

  async function handleSave(test: TestDefinition) {
    setSaving(true);
    try {
      await addTestResult(sportifId, {
        category,
        testKey: test.key,
        value: test.comparaisonCotes ? null : parseFloat(value) || null,
        valueLeft: test.comparaisonCotes ? parseFloat(valueLeft) || null : null,
        valueRight: test.comparaisonCotes ? parseFloat(valueRight) || null : null,
        notes,
      });
      const data = await getTestResults(sportifId, category);
      setResults(data);
      setExpandedKey(null);
    } finally {
      setSaving(false);
    }
  }

  function latestResult(testKey: string): TestResult | undefined {
    return results.find((r) => r.testKey === testKey);
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  const groups = Array.from(new Set(tests.map((t) => t.groupe)));

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

      <Text style={styles.title}>{title}</Text>

      {groups.map((group) => (
        <View key={group} style={{ marginBottom: 20 }}>
          <Text style={styles.groupTitle}>{group}</Text>
          {tests
            .filter((t) => t.groupe === group)
            .map((test) => {
              const latest = latestResult(test.key);
              const expanded = expandedKey === test.key;
              return (
                <View key={test.key} style={styles.testCard}>
                  <TouchableOpacity
                    style={styles.testHeader}
                    onPress={() => toggleTest(test)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.testLabel}>{test.label}</Text>
                      {latest ? (
                        <Text style={styles.testLatest}>
                          {test.comparaisonCotes
                            ? `G ${latest.valueLeft ?? "—"} · D ${latest.valueRight ?? "—"} ${test.unite} (${latest.date})`
                            : `${latest.value ?? "—"} ${test.unite} (${latest.date})`}
                        </Text>
                      ) : (
                        <Text style={styles.testEmpty}>Aucun résultat</Text>
                      )}
                    </View>
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {expanded && (
                    <View style={styles.form}>
                      <Text style={styles.description}>{test.description}</Text>
                      <Text style={styles.protocole}>{test.protocole}</Text>

                      {test.comparaisonCotes ? (
                        <View style={styles.row}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>
                              Gauche ({test.unite})
                            </Text>
                            <TextInput
  placeholderTextColor={Colors.textSecondary}
                              style={styles.input}
                              keyboardType="numeric"
                              value={valueLeft}
                              onChangeText={setValueLeft}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.fieldLabel}>
                              Droite ({test.unite})
                            </Text>
                            <TextInput
  placeholderTextColor={Colors.textSecondary}
                              style={styles.input}
                              keyboardType="numeric"
                              value={valueRight}
                              onChangeText={setValueRight}
                            />
                          </View>
                        </View>
                      ) : (
                        <View>
                          <Text style={styles.fieldLabel}>Valeur ({test.unite})</Text>
                          <TextInput
  placeholderTextColor={Colors.textSecondary}
                            style={styles.input}
                            keyboardType="numeric"
                            value={value}
                            onChangeText={setValue}
                          />
                        </View>
                      )}

                      <TextInput
  placeholderTextColor={Colors.textSecondary}
                        style={styles.input}
                        placeholder="Notes (optionnel)"
                        value={notes}
                        onChangeText={setNotes}
                      />

                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => handleSave(test)}
                        disabled={saving}
                      >
                        {saving ? (
                          <ActivityIndicator color={Colors.white} />
                        ) : (
                          <Text style={styles.saveButtonText}>Enregistrer</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      ))}
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
    marginBottom: 20,
  },

  groupTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 10,
  },

  testCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },

  testHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  testLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  testLatest: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: "600",
  },

  testEmpty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  form: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  protocole: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },

  input: {
    color: Colors.text,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
  },

  saveButton: {
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },

  saveButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
