import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../../constants/colors";
import { DEFAULT_OZA_SPORTS, OZA_NIVEAUX } from "../../constants/oza-sports";
import { Radius, Shadow, Type } from "../../constants/tokens";
import { AthleteProfile } from "../../services/athlete-profile";
import { materielLabel, objectifLabel } from "../../constants/onboarding";
import { getOzaSports } from "../../services/oza-programs";
import {
  AdviceVerdict,
  FAMILY_LABEL,
  Tone,
  WellnessPoint,
  buildIndicators,
  computeStats,
  familyOf,
  tonnage,
  weeklyAdvice,
} from "../../services/sport-dashboard";
import { SessionRecord, getWellnessEntriesForSportif } from "../../services/tracking";
import { AI_COACH_ENABLED } from "../../services/coach-ai";
import AiCoachCard from "./ai-coach-card";
import { AiPayload } from "../../services/coach-ai";

const TONE_COLOR: Record<Tone, string> = {
  good: Colors.riskLow,
  warn: Colors.riskMedium,
  bad: Colors.riskHigh,
  neutral: Colors.text,
};

const VERDICT: Record<AdviceVerdict, { icon: keyof typeof Ionicons.glyphMap; color: string; tag: string }> = {
  reprise: { icon: "walk-outline", color: Colors.primary, tag: "Reprise" },
  alleger: { icon: "battery-half-outline", color: Colors.riskHigh, tag: "Récupération" },
  maintenir: { icon: "reorder-two-outline", color: Colors.riskMedium, tag: "Régularité" },
  progresser: { icon: "trending-up-outline", color: Colors.riskLow, tag: "Progression" },
};

// Tableau de bord propre au sport du sportif : les indicateurs changent selon
// la famille de sport, et le conseil de la semaine s'appuie sur ses données.
export default function SportDashboard({
  uid,
  profile,
  sessions,
}: {
  uid: string;
  profile: AthleteProfile;
  sessions: SessionRecord[];
}) {
  const [sports, setSports] = useState(DEFAULT_OZA_SPORTS);
  const [wellness, setWellness] = useState<WellnessPoint[]>([]);

  useEffect(() => {
    getOzaSports().then(setSports).catch(() => {});
    getWellnessEntriesForSportif(uid)
      .then((list) => setWellness(list.map((w) => ({ date: w.date, score: w.score }))))
      .catch(() => {});
  }, [uid]);

  const sport = sports.find((s) => s.id === profile.sportId);
  const family = familyOf(profile.sportId ?? "");

  const stats = useMemo(() => computeStats(sessions, wellness), [sessions, wellness]);
  const indicators = useMemo(() => buildIndicators(family, stats, profile), [family, stats, profile]);
  const advice = useMemo(() => weeklyAdvice(stats, profile), [stats, profile]);

  const payload = useMemo<AiPayload | null>(() => {
    if (!sport) return null;
    const pos = sport.positions.find((p) => p.id === profile.positionId);
    const niveauLabel = OZA_NIVEAUX.find((n) => n.key === profile.niveau)?.label ?? null;
    const t7 = tonnage(stats.sessions7);
    return {
      profile: {
        sport: sport.nom,
        poste: pos?.nom ?? null,
        niveau: niveauLabel,
        objectif: objectifLabel(profile.objectif) || null,
        seancesParSemaine: profile.seancesParSemaine,
        dureeMinutes: profile.dureeMinutes,
        materiel: profile.materiel.map(materielLabel),
        limitations: profile.limitations || null,
      },
      stats: {
        seances7: stats.sessions7.length,
        seancesPrev7: stats.sessionsPrev7.length,
        charge7: Math.round(stats.load7),
        rpe7: stats.rpe7,
        minutes7: stats.minutes7,
        acwr: stats.acwr,
        bienEtre7: stats.wellness7,
        bienEtrePrev: stats.wellnessPrev,
        semainesActives: stats.weeksActive,
        tonnage7: t7 > 0 ? t7 : null,
      },
      regle: { verdict: advice.verdict, titre: advice.title, raisons: advice.reasons },
    };
  }, [sport, profile, stats, advice]);

  if (!sport) return null;

  const position = sport.positions.find((p) => p.id === profile.positionId);
  const niveau = OZA_NIVEAUX.find((n) => n.key === profile.niveau)?.label;
  const priorities = (position?.axes && position.axes.length > 0 ? position.axes : sport.axes).slice(0, 4);
  const v = VERDICT[advice.verdict];

  return (
    <View style={styles.card}>
      <LinearGradient colors={[sport.couleurs.from, sport.couleurs.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.head}>
        <Text style={styles.eyebrow}>{FAMILY_LABEL[family].toUpperCase()}</Text>
        <Text style={styles.sportName}>{sport.nom}</Text>
        <Text style={styles.headSub} numberOfLines={1}>
          {[position?.nom, niveau].filter(Boolean).join(" · ") || sport.tagline}
        </Text>
      </LinearGradient>

      <View style={styles.grid}>
        {indicators.map((i) => (
          <View key={i.key} style={styles.cell}>
            <Text style={styles.cellLabel}>{i.label}</Text>
            <Text style={[styles.cellValue, { color: TONE_COLOR[i.tone] }]}>{i.value}</Text>
            {!!i.sub && <Text style={styles.cellSub} numberOfLines={2}>{i.sub}</Text>}
          </View>
        ))}
      </View>

      {priorities.length > 0 && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>{position ? `Tes priorités · ${position.nom}` : "Tes priorités"}</Text>
          <View style={styles.chips}>
            {priorities.map((p) => (
              <View key={p} style={styles.chip}>
                <Text style={styles.chipText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.block, styles.advice]}>
        <View style={styles.adviceHead}>
          <View style={[styles.adviceIcon, { backgroundColor: v.color }]}>
            <Ionicons name={v.icon} size={16} color={Colors.white} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.adviceTag}>CONSEIL DE LA SEMAINE · {v.tag.toUpperCase()}</Text>
            <Text style={styles.adviceTitle}>{advice.title}</Text>
          </View>
        </View>
        {advice.reasons.map((r, idx) => (
          <Text key={idx} style={styles.reason}>• {r}</Text>
        ))}
        <Text style={styles.suggestion}>{advice.suggestion}</Text>
        <Text style={styles.disclaimer}>Conseil automatique d'après tes séances et ton bien-être. Il ne remplace ni ton coach ni un avis médical.</Text>
      </View>

      {AI_COACH_ENABLED && payload && <AiCoachCard uid={uid} consent={!!profile.aiConsentAt} payload={payload} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: 16,
    ...Shadow.card,
  },
  head: { padding: 18 },
  eyebrow: { fontSize: 10.5, fontWeight: "700", letterSpacing: 1.2, color: Colors.primaryLight },
  sportName: { fontFamily: Type.heading, fontSize: 26, color: Colors.white, textTransform: "uppercase", marginTop: 2 },
  headSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 8 },
  cell: { width: "50%", padding: 10 },
  cellLabel: { fontSize: 11.5, fontWeight: "700", letterSpacing: 0.4, color: Colors.textSecondary, textTransform: "uppercase" },
  cellValue: { fontFamily: Type.heading, fontSize: 26, marginTop: 2 },
  cellSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  block: { paddingHorizontal: 18, paddingBottom: 16 },
  blockTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, color: Colors.textSecondary, textTransform: "uppercase", marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: Colors.accentTint, borderRadius: Radius.pill, paddingVertical: 6, paddingHorizontal: 12 },
  chipText: { fontSize: 13, fontWeight: "600", color: Colors.canard },
  advice: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 },
  adviceHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  adviceIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  adviceTag: { fontSize: 10.5, fontWeight: "700", letterSpacing: 1, color: Colors.textSecondary },
  adviceTitle: { fontFamily: Type.heading, fontSize: 19, color: Colors.text },
  reason: { fontSize: 13.5, lineHeight: 19, color: Colors.textSecondary },
  suggestion: { fontSize: 14.5, lineHeight: 21, fontWeight: "600", color: Colors.text, marginTop: 8 },
  disclaimer: { fontSize: 11.5, lineHeight: 16, color: Colors.textSecondary, marginTop: 10 },
});
