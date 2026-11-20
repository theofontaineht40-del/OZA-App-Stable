import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import GradientFill from "../../components/gradient-fill";
import PhotoBackground from "../../components/photo-background";
import { RadarChart } from "../../components/radar-chart";
import { Colors } from "../../constants/colors";
import { Type } from "../../constants/tokens";
import { auth } from "../../firebase";
import {
  acwrRiskLevel,
  average,
  buildDailyLoadSeries,
  computeAcuteChronicWorkloadRatio,
  todayKey,
} from "../../services/load";
import { addDays } from "../../services/schedule";
import {
  getSessionsForSportif,
  getWellnessEntriesForSportif,
  SessionRecord,
} from "../../services/tracking";

type Period = "week" | "month" | "year";
const PERIODS: { key: Period; label: string; days: number }[] = [
  { key: "week", label: "Semaine", days: 7 },
  { key: "month", label: "Mois", days: 30 },
  { key: "year", label: "Année", days: 365 },
];

const ACWR_LABEL = {
  "sous-charge": "Sous-charge",
  optimale: "Optimale",
  risque: "Risque",
  danger: "Danger",
} as const;

// Charge /10 à partir de l'ACWR : 10 dans la zone optimale (0,8–1,3), moins en
// sous-charge comme en surcharge.
function loadScore(acwr: number): number {
  if (acwr >= 0.8 && acwr <= 1.3) return 10;
  if (acwr < 0.8) return Math.max(0, (acwr / 0.8) * 10);
  return Math.max(0, 10 - (acwr - 1.3) * 20);
}

// « Analyse OZA » du sportif : radar des variables pour lesquelles il existe
// réellement des données (bien-être, sommeil, récupération, charge), sur la
// période choisie. Rien n'est inventé : HRV et mobilité n'y figurent pas tant
// qu'ils ne sont pas mesurés.
export default function SportifAnalyseScreen() {
  const [period, setPeriod] = useState<Period>("week");
  const [loading, setLoading] = useState(true);
  const [wellness, setWellness] = useState<Awaited<ReturnType<typeof getWellnessEntriesForSportif>>>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const [w, s] = await Promise.all([getWellnessEntriesForSportif(user.uid), getSessionsForSportif(user.uid)]);
        setWellness(w);
        setSessions(s);
      } catch {
        // pas de données : l'écran l'explique
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const days = PERIODS.find((p) => p.key === period)!.days;
  const since = addDays(todayKey(), -(days - 1));
  const inPeriod = wellness.filter((w) => w.date >= since);
  const avg = (key: "score" | "sommeil" | "fatigue" | "courbatures") =>
    inPeriod.length > 0 ? average(inPeriod.map((w) => w[key])) : null;

  const series = buildDailyLoadSeries(sessions, 28);
  const hasLoad = sessions.some((s) => s.date >= addDays(todayKey(), -27));
  const { acwr } = computeAcuteChronicWorkloadRatio(series);
  const periodLoad = sessions.filter((s) => s.date >= since).reduce((sum, s) => sum + s.load, 0);

  const axes: { label: string; value: number }[] = [];
  const bienEtre = avg("score");
  const sommeil = avg("sommeil");
  const recup = avg("courbatures");
  if (bienEtre !== null) axes.push({ label: "Bien-être", value: bienEtre });
  if (hasLoad) axes.push({ label: "Charge", value: loadScore(acwr) });
  if (recup !== null) axes.push({ label: "Récupération", value: recup });
  if (sommeil !== null) axes.push({ label: "Sommeil", value: sommeil });
  const fatigue = avg("fatigue");

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground variant="profil" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Analyse OZA</Text>
        <Text style={styles.subtitle}>Tes variables clés, d'après tes bilans et tes séances.</Text>

        <View style={styles.tabs}>
          {PERIODS.map((p) => (
            <TouchableOpacity key={p.key} style={[styles.tab, period === p.key && styles.tabActive]} onPress={() => setPeriod(p.key)}>
              {period === p.key && <GradientFill />}
              <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          {loading ? null : axes.length >= 3 ? (
            <>
              <View style={{ alignItems: "center" }}>
                <RadarChart axesCount={axes.length} seriesA={axes.map((a) => a.value)} colorA={Colors.turquoise} />
              </View>
              <View style={styles.legend}>
                {axes.map((a) => (
                  <View key={a.label} style={styles.legendItem}>
                    <Text style={styles.legendValue}>{a.value.toFixed(1)}</Text>
                    <Text style={styles.legendLabel}>{a.label}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.empty}>
              Pas encore assez de données : il faut au moins 3 variables (bilans de bien-être, séances) sur la période
              pour tracer le radar.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Indicateurs</Text>
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>ACWR</Text>
            <Text style={styles.tileValue}>{hasLoad ? acwr.toFixed(2) : "—"}</Text>
            {hasLoad && <Text style={styles.tileHint}>{ACWR_LABEL[acwrRiskLevel(acwr)]}</Text>}
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Fatigue</Text>
            <Text style={styles.tileValue}>{fatigue !== null ? `${fatigue.toFixed(1)}/10` : "—"}</Text>
            {fatigue !== null && <Text style={styles.tileHint}>10 = pas fatigué</Text>}
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Charge</Text>
            <Text style={styles.tileValue}>{Math.round(periodLoad)}</Text>
            <Text style={styles.tileHint}>u.a. sur la période</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 70, paddingBottom: 60 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  title: { fontFamily: Type.heading, fontSize: 30, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: 13.5, color: Colors.textSecondary, marginTop: 4, marginBottom: 18 },
  tabs: { flexDirection: "row", backgroundColor: Colors.surfaceAlt, borderRadius: 14, padding: 4, marginBottom: 16 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 11, overflow: "hidden" },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  empty: { fontSize: 13.5, color: Colors.textSecondary, lineHeight: 20, textAlign: "center", paddingVertical: 20 },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  legendItem: { flexGrow: 1, flexBasis: "40%", backgroundColor: Colors.surfaceAlt, borderRadius: 12, padding: 10 },
  legendValue: { fontFamily: Type.heading, fontSize: 22, color: Colors.primaryDark },
  legendLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 10 },
  tiles: { flexDirection: "row", gap: 10 },
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tileLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: Colors.textSecondary },
  tileValue: { fontFamily: Type.heading, fontSize: 24, color: Colors.primaryDark, marginTop: 4 },
  tileHint: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
