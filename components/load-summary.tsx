import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";
import {
  acwrRiskLevel,
  AcwrLevel,
  computeAcuteChronicWorkloadRatio,
  computeMonotony,
  computeStrain,
  DailyLoad,
  monotonyRiskLevel,
  RiskLevel,
  sumLoads,
} from "../services/load";

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

type AnyLevel = RiskLevel | AcwrLevel;

const RISK_LABEL: Record<AnyLevel, string> = {
  low: "Risque faible",
  medium: "Vigilance",
  high: "Risque élevé",
  "sous-charge": "Sous-charge",
  optimale: "Zone optimale",
  risque: "Risque",
  danger: "Danger",
};

const RISK_ICON: Record<AnyLevel, string> = {
  low: "🟢",
  medium: "🟡",
  high: "🔴",
  "sous-charge": "🔵",
  optimale: "🟢",
  risque: "🟡",
  danger: "🔴",
};

export function riskColor(level: AnyLevel): string {
  if (level === "low" || level === "optimale") return Colors.riskLow;
  if (level === "medium" || level === "risque") return Colors.riskMedium;
  if (level === "sous-charge") return Colors.riskUnder;
  return Colors.riskHigh;
}

export function LoadSummary({
  dailyLoads28,
  showRiskIndicators = true,
}: {
  dailyLoads28: DailyLoad[];
  showRiskIndicators?: boolean;
}) {
  const last7 = dailyLoads28.slice(-7);
  const weeklyLoad = sumLoads(last7);
  const monthlyLoad = sumLoads(dailyLoads28);
  const { acwr } = computeAcuteChronicWorkloadRatio(dailyLoads28);
  const monotony = computeMonotony(last7);
  const strain = computeStrain(last7);

  const acwrLevel = acwrRiskLevel(acwr);
  const monotonyLevel = monotonyRiskLevel(monotony);

  const maxLoad = Math.max(...last7.map((d) => d.load), 1);

  // L'ACWR/monotony ne sont fiables qu'avec un historique de charge continu :
  // avec très peu de séances, la moyenne "chronique" (28j) est diluée par des
  // jours à zéro et fait exploser le ratio sans traduire un vrai surmenage.
  const firstActiveIndex = dailyLoads28.findIndex((d) => d.load > 0);
  const daysOfHistory = firstActiveIndex === -1 ? 0 : dailyLoads28.length - firstActiveIndex;
  const hasEnoughHistory = daysOfHistory >= 14;

  return (
    <View>
      {showRiskIndicators && (
        hasEnoughHistory ? (
          <View style={styles.indicatorsRow}>
            <IndicatorCard
              label="ACWR"
              value={acwr.toFixed(2)}
              level={acwrLevel}
            />
            <IndicatorCard
              label="Monotony"
              value={monotony.toFixed(2)}
              level={monotonyLevel}
            />
            <IndicatorCard
              label="Strain"
              value={Math.round(strain).toString()}
              level="low"
              hideRisk
            />
          </View>
        ) : (
          <View style={styles.notEnoughHistory}>
            <Text style={styles.notEnoughHistoryText}>
              Pas encore assez d'historique pour un ACWR fiable ({daysOfHistory} jour
              {daysOfHistory > 1 ? "s" : ""} de suivi, 14 minimum).
            </Text>
          </View>
        )
      )}

      <View style={styles.totalsRow}>
        <View style={styles.totalCard}>
          <Text style={styles.totalValue}>{weeklyLoad}</Text>
          <Text style={styles.totalLabel}>Charge / semaine (UA)</Text>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalValue}>{monthlyLoad}</Text>
          <Text style={styles.totalLabel}>Charge cumulée 28j (UA)</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartBars}>
          {last7.map((d, index) => (
            <View key={d.date} style={styles.chartBarColumn}>
              <View
                style={[
                  styles.chartBar,
                  { height: 6 + (d.load / maxLoad) * 70 },
                  d.load > 0 && styles.chartBarActive,
                ]}
              />
              <Text style={styles.chartDay}>{WEEK_DAYS[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function IndicatorCard({
  label,
  value,
  level,
  hideRisk,
}: {
  label: string;
  value: string;
  level: AnyLevel;
  hideRisk?: boolean;
}) {
  return (
    <View style={styles.indicatorCard}>
      <Text style={styles.indicatorLabel}>{label}</Text>
      <Text style={[styles.indicatorValue, { color: riskColor(level) }]}>
        {value}
      </Text>
      {!hideRisk && (
        <Text style={styles.indicatorRisk}>
          {RISK_ICON[level]} {RISK_LABEL[level]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  indicatorsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  notEnoughHistory: {
    backgroundColor: Colors.grayLight,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  notEnoughHistoryText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  indicatorCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  indicatorLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  indicatorValue: {
    fontSize: 18,
    fontWeight: "700",
  },

  indicatorRisk: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  totalsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  totalCard: {
    flex: 1,
    backgroundColor: Colors.grayLight,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  totalLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },

  chartCard: {
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

  chartBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 90,
  },

  chartBarColumn: {
    alignItems: "center",
    gap: 8,
  },

  chartBar: {
    width: 18,
    borderRadius: 9,
    backgroundColor: Colors.grayLight,
  },

  chartBarActive: {
    backgroundColor: Colors.primary,
  },

  chartDay: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
