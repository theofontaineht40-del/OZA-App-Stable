import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import {
  acwrRiskLevel,
  average,
  computeAcuteChronicWorkloadRatio,
  computeMonotony,
  computeStrain,
  computeWellnessTrendStats,
  DailyLoad,
  detectConsecutiveTrend,
  monotonyRiskLevel,
  sumLoads,
  WellnessStatus,
  wellnessStatus,
} from "../services/load";
import { WellnessEntry } from "../services/tracking";
import ProgressionChart, { ProgressionPoint } from "./progression-chart";

type VariableKey = "sommeil" | "fatigue" | "courbatures" | "stress" | "humeur";

const VARIABLES: { key: VariableKey; label: string; icon: string }[] = [
  { key: "sommeil", label: "Sommeil", icon: "😴" },
  { key: "fatigue", label: "Fatigue", icon: "🔋" },
  { key: "courbatures", label: "Courbatures", icon: "💪" },
  { key: "stress", label: "Stress", icon: "🧠" },
  { key: "humeur", label: "Humeur", icon: "🙂" },
];

const STATUS_ICON: Record<WellnessStatus, string> = {
  green: "🟢",
  orange: "🟠",
  red: "🔴",
};

const STATUS_LABEL: Record<WellnessStatus, string> = {
  green: "État favorable",
  orange: "Vigilance",
  red: "Attention",
};

const STATUS_COLOR: Record<WellnessStatus, string> = {
  green: Colors.riskLow,
  orange: Colors.riskMedium,
  red: Colors.riskHigh,
};

const WINDOWS = [7, 28, 90] as const;
type WindowDays = (typeof WINDOWS)[number];

function pct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(0)} %`;
}

function daysAgo(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

// entriesDesc : historique bien-être du sportif, le plus récent en premier
// (même forme que renvoyée par getWellnessForCoach, déjà filtrée sur ce
// sportif). dailyLoads28 : réutilisé tel quel depuis la page appelante
// (buildDailyLoadSeries), pour croiser avec ACWR/Monotony/Strain sans
// recalculer ni re-stocker quoi que ce soit.
export default function WellnessReport({
  entriesDesc,
  dailyLoads28,
}: {
  entriesDesc: WellnessEntry[];
  dailyLoads28: DailyLoad[];
}) {
  const [windowDays, setWindowDays] = useState<WindowDays>(7);

  const latest = entriesDesc[0] ?? null;
  const history = entriesDesc.slice(1); // tout sauf aujourd'hui, pour la baseline personnelle

  const avg7 = average(entriesDesc.slice(0, 7).map((e) => e.score));
  const avg28 = average(entriesDesc.slice(0, 28).map((e) => e.score));
  const personalBaseline = history.length >= 4 ? average(history.slice(0, 28).map((e) => e.score)) : null;

  const globalStatus: WellnessStatus | null = latest
    ? wellnessStatus(latest.score, personalBaseline)
    : null;

  const windowEntries = useMemo(
    () =>
      entriesDesc
        .filter((e) => daysAgo(e.date, windowDays))
        .slice()
        .reverse(), // chronologique pour le graphique
    [entriesDesc, windowDays]
  );
  const windowPoints: ProgressionPoint[] = windowEntries.map((e) => ({ date: e.date, value: e.score }));
  const windowStats = computeWellnessTrendStats(windowEntries.map((e) => e.score));
  const globalTrend = detectConsecutiveTrend(entriesDesc.slice(0, 14).map((e) => e.score).reverse());

  // Charge d'entraînement (déjà calculée ailleurs sur la page, on ne fait
  // que relire les mêmes données pour le croisement).
  const last7Loads = dailyLoads28.slice(-7);
  const prev7Loads = dailyLoads28.slice(-14, -7);
  const { acwr } = computeAcuteChronicWorkloadRatio(dailyLoads28);
  const monotony = computeMonotony(last7Loads);
  const strain = computeStrain(last7Loads);
  const acwrLevel = acwrRiskLevel(acwr);
  const monotonyLevel = monotonyRiskLevel(monotony);
  const weeklyLoad = sumLoads(last7Loads);
  const prevWeeklyLoad = sumLoads(prev7Loads);
  const loadTrendPercent = prevWeeklyLoad > 0 ? ((weeklyLoad - prevWeeklyLoad) / prevWeeklyLoad) * 100 : 0;

  const loadIsHigh = acwrLevel === "risque" || acwrLevel === "danger" || monotonyLevel === "high";
  const wellnessIsDown = globalStatus === "orange" || globalStatus === "red";
  const showOzaAnalysis = latest && dailyLoads28.some((d) => d.load > 0) && wellnessIsDown && loadIsHigh;

  if (!latest) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          Aucun check-in de bien-être enregistré pour l'instant.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* 1. Score global + 2. statut */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerLabel}>BIEN-ÊTRE</Text>
          <Text style={styles.headerScore}>{latest.score.toFixed(1)} / 5</Text>
        </View>
        {globalStatus && (
          <View style={[styles.statusPill, { borderColor: STATUS_COLOR[globalStatus] }]}>
            <Text style={styles.statusPillText}>
              {STATUS_ICON[globalStatus]} {STATUS_LABEL[globalStatus]}
            </Text>
          </View>
        )}
      </View>

      {/* 3. Évolution */}
      <View style={styles.evolutionRow}>
        <EvolutionStat label="Moyenne 7j" value={avg7} />
        <EvolutionStat label="Moyenne 28j" value={avg28} />
        {avg28 > 0 && (
          <View style={styles.evolutionDelta}>
            <Text
              style={[
                styles.evolutionDeltaText,
                { color: latest.score - avg28 >= 0 ? Colors.riskLow : Colors.riskHigh },
              ]}
            >
              {latest.score - avg28 >= 0 ? "+" : ""}
              {(latest.score - avg28).toFixed(1)} vs 28j
            </Text>
          </View>
        )}
      </View>

      {globalTrend && (
        <Text style={styles.trendNote}>
          {globalTrend.direction === "down" ? "🔴" : "🟢"} Bien-être en{" "}
          {globalTrend.direction === "down" ? "baisse" : "hausse"} depuis {globalTrend.days} jours
        </Text>
      )}

      {/* 4. Graphique */}
      <View style={styles.windowTabs}>
        {WINDOWS.map((w) => (
          <TouchableOpacity
            key={w}
            style={[styles.windowTab, windowDays === w && styles.windowTabActive]}
            onPress={() => setWindowDays(w)}
          >
            <Text style={[styles.windowTabText, windowDays === w && styles.windowTabTextActive]}>
              {w}j
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ProgressionChart points={windowPoints} />

      {windowPoints.length > 0 && (
        <View style={styles.statsRow}>
          <MiniStat label="Moyenne" value={windowStats.average.toFixed(1)} />
          <MiniStat label="Minimum" value={windowStats.min.toFixed(1)} />
          <MiniStat label="Maximum" value={windowStats.max.toFixed(1)} />
          <MiniStat
            label="Tendance"
            value={`${windowStats.trendPercent >= 0 ? "↗" : "↘"} ${pct(windowStats.trendPercent)}`}
            valueColor={windowStats.trendPercent >= 0 ? Colors.riskLow : Colors.riskHigh}
          />
        </View>
      )}

      {/* 5. Les 5 indicateurs */}
      <Text style={styles.sectionLabel}>Analyse des 5 variables</Text>
      <View style={styles.variablesList}>
        {VARIABLES.map((v) => {
          const varHistory = history.map((e) => e[v.key]);
          const varBaseline = varHistory.length >= 4 ? average(varHistory.slice(0, 28)) : null;
          const varStatus = wellnessStatus(latest[v.key], varBaseline);
          const varTrend = detectConsecutiveTrend(
            entriesDesc.slice(0, 14).map((e) => e[v.key]).reverse()
          );
          const isAnomaly = varBaseline !== null && latest[v.key] - varBaseline <= -1.0;

          return (
            <View key={v.key} style={styles.variableRow}>
              <Text style={styles.variableIcon}>{v.icon}</Text>
              <Text style={styles.variableLabel}>{v.label}</Text>
              <Text style={styles.variableValue}>{latest[v.key].toFixed(1)}</Text>
              <Text style={styles.variableStatus}>{STATUS_ICON[varStatus]}</Text>
              {(isAnomaly || varTrend) && (
                <View style={styles.variableNoteWrap}>
                  {isAnomaly && (
                    <Text style={styles.variableNote}>
                      Point de vigilance : {v.label.toLowerCase()} en dessous de la normale
                      personnelle ({varBaseline!.toFixed(1)} habituel).
                    </Text>
                  )}
                  {varTrend && (
                    <Text style={styles.variableNote}>
                      {v.label} en {varTrend.direction === "down" ? "baisse" : "hausse"} depuis{" "}
                      {varTrend.days} jours.
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* 6. Analyse OZA */}
      {showOzaAnalysis && (
        <View style={styles.ozaCard}>
          <Text style={styles.ozaTitle}>🟠 Analyse OZA — Attention récupération</Text>
          <Text style={styles.ozaBullet}>
            • Bien-être {windowStats.trendPercent <= 0 ? "↓" : "↑"} {Math.abs(windowStats.trendPercent).toFixed(0)}
            {" "}% sur {windowDays}j
          </Text>
          <Text style={styles.ozaBullet}>
            • Charge d'entraînement {loadTrendPercent >= 0 ? "↑" : "↓"}{" "}
            {Math.abs(loadTrendPercent).toFixed(0)} % sur 7j
          </Text>
          <Text style={styles.ozaBullet}>
            • ACWR {acwr.toFixed(2)} · Monotony {monotony.toFixed(2)} · Strain{" "}
            {Math.round(strain)}
          </Text>
          <Text style={styles.ozaSuggestion}>
            Suggestion : envisager une réduction du volume sur la prochaine séance. Cette
            analyse est une aide à la décision — le choix final revient au coach.
          </Text>
        </View>
      )}
    </View>
  );
}

function EvolutionStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.evolutionStat}>
      <Text style={styles.evolutionValue}>{value > 0 ? value.toFixed(1) : "—"}</Text>
      <Text style={styles.evolutionLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  emptyCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 20,
    paddingVertical: 24,
    marginBottom: 20,
    alignItems: "center",
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },

  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.textSecondary,
  },

  headerScore: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 2,
  },

  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },

  evolutionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 8,
  },

  evolutionStat: {},

  evolutionValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  evolutionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  evolutionDelta: {
    marginLeft: "auto",
  },

  evolutionDeltaText: {
    fontSize: 13,
    fontWeight: "700",
  },

  trendNote: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 16,
  },

  windowTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },

  windowTab: {
    paddingHorizontal: 14,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
  },

  windowTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  windowTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  windowTabTextActive: {
    color: Colors.white,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 4,
  },

  miniStat: {
    alignItems: "center",
  },

  miniStatValue: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },

  miniStatLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },

  variablesList: {
    gap: 10,
  },

  variableRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },

  variableIcon: {
    fontSize: 16,
  },

  variableLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  variableValue: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  variableStatus: {
    fontSize: 14,
  },

  variableNoteWrap: {
    width: "100%",
    marginTop: 2,
  },

  variableNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },

  ozaCard: {
    marginTop: 20,
    backgroundColor: Colors.accentTint,
    borderRadius: 16,
    padding: 16,
  },

  ozaTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },

  ozaBullet: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },

  ozaSuggestion: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 8,
    lineHeight: 17,
  },
});
