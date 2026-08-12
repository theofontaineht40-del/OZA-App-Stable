import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

import { AccessDenied } from "../../../../components/access-denied";
import { RadarChart } from "../../../../components/radar-chart";
import { Colors } from "../../../../constants/colors";
import { MOBILITY_TESTS } from "../../../../constants/mobility-tests";
import { PHYSICAL_TESTS } from "../../../../constants/physical-tests";
import {
  emptyRadar,
  getSport,
  QUALITES,
  QualiteKey,
  SPORTS,
  SportRadar,
} from "../../../../constants/sports-radar";
import { TEST_QUALITY_MAP } from "../../../../constants/test-quality-mapping";
import { auth } from "../../../../firebase";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";
import { getMedicalProfile } from "../../../../services/medical";
import { getThresholds, scoreFromValue } from "../../../../services/referentials";
import {
  compareRadars,
  getTaskAnalysis,
  QualityGap,
  saveTaskAnalysis,
} from "../../../../services/task-analysis";
import { getTestResults } from "../../../../services/tests";

const PRIORITY_LABEL: Record<string, string> = {
  "1": "🔴 Priorité 1",
  "2": "🟡 Priorité 2",
  "3": "🟢 Priorité 3",
};

const TEST_DEFS = [...MOBILITY_TESTS, ...PHYSICAL_TESTS];

type Suggestion = { score: number; testLabel: string };

export default function TaskAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sportKey, setSportKey] = useState<string | null>(null);
  const [sportRadar, setSportRadar] = useState<SportRadar>(emptyRadar());
  const [athleteRadar, setAthleteRadar] = useState<SportRadar>(emptyRadar());
  const [editingSportRadar, setEditingSportRadar] = useState(false);
  const [suggestions, setSuggestions] = useState<Partial<Record<QualiteKey, Suggestion>>>({});
  const [missingSegment, setMissingSegment] = useState(false);
  const [profileSegment, setProfileSegment] = useState<{ sexe: string; ageBracket: string } | null>(
    null
  );

  useEffect(() => {
    if (!id) return;
    getTaskAnalysis(id)
      .then((data) => {
        if (data.sportKey) {
          setSportKey(data.sportKey);
          setSportRadar(data.sportRadar ?? getSport(data.sportKey)?.radar ?? emptyRadar());
          setAthleteRadar(data.athleteRadar ?? emptyRadar());
        }
      })
      .catch(() => {
        // Pas principal de ce sportif : le guard usePrincipalAccess ci-dessous
        // affichera "Accès non autorisé", pas la peine de remonter l'erreur.
      })
      .finally(() => setLoading(false));

    getMedicalProfile(id).then((profile) => {
      if (!profile.sexe || !profile.ageBracket) {
        setMissingSegment(true);
        return;
      }
      setProfileSegment({ sexe: profile.sexe, ageBracket: profile.ageBracket });
    }).catch(() => {});
  }, [id]);

  // Les seuils sont désormais spécifiques au sport sélectionné : on les
  // recharge et on recalcule les suggestions à chaque changement de sport.
  useEffect(() => {
    const coachUid = auth.currentUser?.uid;
    if (!coachUid || !id || !sportKey || !profileSegment) return;

    Promise.all([
      getThresholds(coachUid, profileSegment.sexe, profileSegment.ageBracket, sportKey),
      getTestResults(id, "mobility"),
      getTestResults(id, "physical"),
    ])
      .then(([thresholds, mobilityResults, physicalResults]) => {
        computeSuggestions(thresholds, mobilityResults, physicalResults);
      })
      .catch(() => {});
  }, [id, sportKey, profileSegment]);

  function computeSuggestions(
    thresholds: Record<string, { low0: number; high10: number }>,
    mobilityResults: Awaited<ReturnType<typeof getTestResults>>,
    physicalResults: Awaited<ReturnType<typeof getTestResults>>
  ) {
    const allResults = [...mobilityResults, ...physicalResults];
    const bestByQuality: Partial<Record<QualiteKey, Suggestion & { date: string }>> = {};

    allResults.forEach((result) => {
      const quality = TEST_QUALITY_MAP[result.testKey];
      const threshold = thresholds[result.testKey];
      if (!quality || !threshold) return;

      const def = TEST_DEFS.find((t) => t.key === result.testKey);
      const rawValue = def?.comparaisonCotes
        ? ((result.valueLeft ?? 0) + (result.valueRight ?? 0)) / 2
        : result.value;
      if (rawValue === null || rawValue === undefined) return;

      const existing = bestByQuality[quality];
      if (existing && existing.date >= result.date) return;

      bestByQuality[quality] = {
        score: scoreFromValue(rawValue, threshold),
        testLabel: def?.label ?? result.testKey,
        date: result.date,
      };
    });

    setSuggestions(bestByQuality);
  }

  function applySuggestion(key: string) {
    const suggestion = suggestions[key as QualiteKey];
    if (!suggestion) return;
    setAthleteRadar((prev) => ({ ...prev, [key]: suggestion.score }));
  }

  function handleSelectSport(key: string) {
    setSportKey(key);
    const sport = getSport(key);
    setSportRadar(sport ? { ...sport.radar } : emptyRadar());
  }

  function updateAthleteValue(key: string, text: string) {
    const num = Math.max(0, Math.min(10, parseFloat(text) || 0));
    setAthleteRadar((prev) => ({ ...prev, [key]: num }));
  }

  function updateSportValue(key: string, text: string) {
    const num = Math.max(0, Math.min(10, parseFloat(text) || 0));
    setSportRadar((prev) => ({ ...prev, [key]: num }));
  }

  async function handleSave() {
    if (!id || !sportKey) return;
    setSaving(true);
    try {
      await saveTaskAnalysis(id, { sportKey, sportRadar, athleteRadar });
    } finally {
      setSaving(false);
    }
  }

  const isPrincipal = usePrincipalAccess(id);

  if (loading || isPrincipal === null) {
    return <View style={styles.container} />;
  }

  if (!isPrincipal) {
    return <AccessDenied message="Le Task Analysis n'est visible que par le coach principal." />;
  }

  const seriesA = QUALITES.map((q) => sportRadar[q.key] ?? 0);
  const seriesB = QUALITES.map((q) => athleteRadar[q.key] ?? 0);
  const gaps: QualityGap[] = sportKey ? compareRadars(sportKey, sportRadar, athleteRadar) : [];
  const priorities: Record<string, QualityGap[]> = { "1": [], "2": [], "3": [] };
  gaps.forEach((g) => {
    if (g.priority !== "none") priorities[g.priority].push(g);
  });

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

      <Text style={styles.title}>Task Analysis</Text>
      <Text style={styles.subtitle}>
        Comparez le profil du sport aux qualités physiques de l'athlète.
      </Text>

      <Text style={styles.sectionTitle}>Sport</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        <View style={styles.sportRow}>
          {SPORTS.map((sport) => (
            <TouchableOpacity
              key={sport.key}
              style={[styles.sportChip, sportKey === sport.key && styles.sportChipActive]}
              onPress={() => handleSelectSport(sport.key)}
            >
              <Text
                style={[
                  styles.sportChipText,
                  sportKey === sport.key && styles.sportChipTextActive,
                ]}
              >
                {sport.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {sportKey && (
        <>
          <View style={styles.chartCard}>
            <View style={{ alignItems: "center" }}>
              <RadarChart axesCount={QUALITES.length} seriesA={seriesA} seriesB={seriesB} />
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>Exigences du sport</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.text }]} />
                <Text style={styles.legendText}>Athlète</Text>
              </View>
            </View>
          </View>

          {missingSegment && (
            <View style={styles.hintCard}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.hintText}>
                Renseignez le sexe et la tranche d'âge du sportif dans son
                Profil médical pour activer les suggestions automatiques
                depuis vos référentiels.
              </Text>
            </View>
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Qualités de l'athlète</Text>
            <TouchableOpacity onPress={() => setEditingSportRadar((v) => !v)}>
              <Text style={styles.editToggle}>
                {editingSportRadar ? "Verrouiller les exigences" : "Modifier les exigences"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {QUALITES.map((q) => {
              const suggestion = suggestions[q.key];
              return (
                <View key={q.key} style={styles.qualityBlock}>
                  <View style={styles.qualityRow}>
                    <Text style={styles.qualityLabel}>{q.label}</Text>
                    <View style={styles.qualityInputs}>
                      {editingSportRadar && (
                        <TextInput
  placeholderTextColor={Colors.textSecondary}
                          style={[styles.smallInput, styles.sportInput]}
                          keyboardType="numeric"
                          value={String(sportRadar[q.key] ?? 0)}
                          onChangeText={(t) => updateSportValue(q.key, t)}
                        />
                      )}
                      <TextInput
  placeholderTextColor={Colors.textSecondary}
                        style={styles.smallInput}
                        keyboardType="numeric"
                        value={String(athleteRadar[q.key] ?? 0)}
                        onChangeText={(t) => updateAthleteValue(q.key, t)}
                      />
                    </View>
                  </View>
                  {suggestion && (
                    <TouchableOpacity
                      style={styles.suggestionChip}
                      onPress={() => applySuggestion(q.key)}
                    >
                      <Ionicons name="sparkles-outline" size={12} color={Colors.primary} />
                      <Text style={styles.suggestionText}>
                        Suggéré : {suggestion.score}/10 d'après {suggestion.testLabel}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Priorités détectées</Text>
          {(["1", "2", "3"] as const).map((level) =>
            priorities[level].length > 0 ? (
              <View key={level} style={{ marginBottom: 16 }}>
                <Text style={styles.priorityHeader}>{PRIORITY_LABEL[level]}</Text>
                {priorities[level].map((gap) => (
                  <View key={gap.key} style={styles.gapCard}>
                    <Text style={styles.gapLabel}>{gap.label}</Text>
                    <Text style={styles.gapExplanation}>{gap.explanation}</Text>
                  </View>
                ))}
              </View>
            ) : null
          )}

          {gaps.every((g) => g.priority === "none") && (
            <Text style={styles.emptyText}>
              Aucun déficit détecté : l'athlète est au niveau requis sur toutes les qualités.
            </Text>
          )}
        </>
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

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },

  sportRow: {
    flexDirection: "row",
    gap: 10,
  },

  sportChip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  sportChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  sportChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  sportChipTextActive: {
    color: Colors.white,
  },

  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  hintCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: Colors.accentTint,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },

  hintText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },

  editToggle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  qualityBlock: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
    paddingVertical: 8,
  },

  qualityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: Colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  suggestionText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },

  qualityLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    paddingRight: 10,
  },

  qualityInputs: {
    flexDirection: "row",
    gap: 8,
  },

  smallInput: {
    color: Colors.text,
    width: 50,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 13,
  },

  sportInput: {
    borderColor: Colors.primary,
    color: Colors.primary,
  },

  saveButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },

  saveButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  priorityHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },

  gapCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  gapLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },

  gapExplanation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
