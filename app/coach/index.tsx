import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import AnimatedPressable from "../../components/animated-pressable";
import AreaChart from "../../components/coach/area-chart";
import SportifsTable from "../../components/coach/sportifs-table";
import StatusDonut from "../../components/coach/status-donut";
import { HeaderTexture } from "../../components/decor";
import MiniSparkline from "../../components/mini-sparkline";
import { TeamIllustration } from "../../components/empty-illustrations";
import PhotoBackground from "../../components/photo-background";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import {
  buildDailyLoadSeries,
  todayKey,
} from "../../services/load";
import {
  buildSportifRow,
  computeCoachAnalysis,
  computeCoachKpis,
  computeTrainingLoadStats,
  computeWellnessBreakdown,
  SportifRow,
  TrainingLoadStats,
} from "../../services/coach-analytics";
import { getRelationsForCoach, Relation } from "../../services/relations";
import { getSlotsForCoach, Slot } from "../../services/reservations";
import {
  getMySportifs,
  getSessionsForCoach,
  getWellnessForCoach,
  SessionRecord,
  SportifSummary,
  WellnessEntry,
} from "../../services/tracking";
import { showAlert } from "../../utils/alert";

// Alias vers le système de tokens central : cet écran a été le prototype de
// la direction "premium dark" avec sa propre palette locale ; conservé comme
// simple alias pour que ce fichier suive désormais constants/colors.ts sans
// devoir toucher ses ~45 usages de DARK.*.
const DARK = {
  bg: Colors.background,
  card: Colors.surface,
  cardAlt: Colors.surfaceAlt,
  border: Colors.border,
  text: Colors.text,
  textSecondary: Colors.textSecondary,
  accent: Colors.primary,
};

function comingSoon() {
  showAlert("Bientôt disponible", "Cette fonctionnalité arrive prochainement.");
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CoachHome() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sportifs, setSportifs] = useState<SportifSummary[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [specialisteRelations, setSpecialisteRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportifSearch, setSportifSearch] = useState("");
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        setFirstName(userSnap.exists() ? userSnap.data().firstName : null);

        const [sportifData, sessionData, slotData, relationData, wellnessData] = await Promise.all([
          getMySportifs(user.uid),
          getSessionsForCoach(user.uid),
          getSlotsForCoach(user.uid),
          getRelationsForCoach(user.uid),
          getWellnessForCoach(user.uid),
        ]);
        setSportifs(sportifData);
        setSessions(sessionData);
        setSlots(slotData);
        setSpecialisteRelations(relationData.filter((r) => r.type === "specialiste"));
        setWellness(wellnessData);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [loading]);

  const dailyLoads28 = useMemo(() => buildDailyLoadSeries(sessions, 28), [sessions]);
  const last7 = dailyLoads28.slice(-7);

  const kpis = useMemo(
    () => computeCoachKpis(sportifs.length, sessions, wellness),
    [sportifs, sessions, wellness]
  );

  const sportifRows: SportifRow[] = useMemo(
    () => sportifs.map((s) => buildSportifRow(s, sessions, wellness)),
    [sportifs, sessions, wellness]
  );

  const analysis = useMemo(() => computeCoachAnalysis(sportifRows), [sportifRows]);
  const wellnessBreakdown = useMemo(() => computeWellnessBreakdown(wellness), [wellness]);

  // ACWR/monotonie/strain n'ont de sens que par individu (mélanger la charge
  // de plusieurs sportifs dans un seul calcul ne représente personne) : ce
  // widget porte donc toujours sur UN sportif, sélectionné ci-dessous — pas
  // sur l'ensemble de l'équipe. Par défaut, celui qui a le plus besoin
  // d'attention (sinon le premier de la liste).
  const defaultSportifId = useMemo(() => {
    const attention = sportifRows.find((r) => r.status === "attention");
    const vigilance = sportifRows.find((r) => r.status === "vigilance");
    return attention?.uid ?? vigilance?.uid ?? sportifRows[0]?.uid ?? null;
  }, [sportifRows]);
  const [selectedSportifId, setSelectedSportifId] = useState<string | null>(null);
  const [loadTab, setLoadTab] = useState<"interne" | "acwr">("interne");
  const effectiveSportifId = selectedSportifId ?? defaultSportifId;
  const selectedSportif = sportifs.find((s) => s.uid === effectiveSportifId) ?? null;

  const trainingLoad = useMemo(
    () => computeTrainingLoadStats(sessions.filter((s) => s.sportifId === effectiveSportifId)),
    [sessions, effectiveSportifId]
  );

  const today = todayKey();
  const tomorrow = tomorrowKey();
  const todaySlots = slots
    .filter((s) => s.date === today && s.status === "confirme")
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
  const tomorrowSlots = slots
    .filter((s) => s.date === tomorrow && s.status === "confirme")
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  const filteredSportifs = sportifs.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(sportifSearch.trim().toLowerCase())
  );

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground variant="accueil" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          {/* ── 1. HEADER ── */}
          <View style={styles.header}>
            <HeaderTexture />
            <View style={styles.headerTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>Espace coach</Text>
                <Text style={styles.greeting}>Bonjour {firstName ?? ""} 👋</Text>
                <Text style={styles.subtitle}>Vue d'ensemble</Text>
              </View>
              <TouchableOpacity style={styles.headerIconButton} onPress={comingSoon}>
                <Ionicons name="notifications-outline" size={20} color={Colors.textOnDark} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconButton} onPress={() => router.push("/coach/profil")}>
                <Ionicons name="person-outline" size={20} color={Colors.textOnDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.headerSearchRow}>
              <Ionicons name="search" size={16} color={Colors.textOnDarkSecondary} />
              <TextInput
                style={styles.headerSearchInput}
                placeholder="Rechercher un sportif"
                placeholderTextColor={Colors.textOnDarkSecondary}
                value={sportifSearch}
                onChangeText={setSportifSearch}
              />
            </View>
            {sportifSearch.trim().length > 0 && (
              <View style={styles.searchResults}>
                {filteredSportifs.length === 0 ? (
                  <Text style={styles.searchEmptyText}>Aucun sportif trouvé.</Text>
                ) : (
                  filteredSportifs.slice(0, 4).map((s) => (
                    <TouchableOpacity
                      key={s.uid}
                      style={styles.searchResultRow}
                      onPress={() => {
                        setSportifSearch("");
                        router.push(`/coach/sportif/${s.uid}`);
                      }}
                    >
                      <Text style={styles.searchResultText}>
                        {s.firstName} {s.lastName}
                      </Text>
                      <Ionicons name="arrow-forward" size={14} color={Colors.textOnDarkSecondary} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          <View style={styles.body}>
            {/* ── 2. 4 KPI PRINCIPAUX ── */}
            <View style={styles.kpiGrid}>
              <KpiCard
                label="Sportifs suivis"
                value={String(kpis.sportifsCount)}
              />
              <KpiCard
                label="Séances / semaine"
                value={String(kpis.sessionsThisWeek)}
                deltaPercent={kpis.sessionsDelta}
                sparkline={last7.map((d) => d.load > 0 ? 1 : 0)}
              />
              <KpiCard
                label="Charge 7 jours"
                value={`${kpis.load7d} UA`}
                deltaPercent={kpis.loadDelta}
                sparkline={last7.map((d) => d.load)}
              />
              <KpiCard
                label="Bien-être moyen"
                value={kpis.wellnessAvg !== null ? `${kpis.wellnessAvg.toFixed(1)} / 10` : "—"}
                deltaAbsolute={kpis.wellnessDelta}
              />
            </View>

            {/* ── 3. OZA ANALYSE ── */}
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <View style={styles.analysisBadge}>
                  <Ionicons name="flash" size={14} color={Colors.primaryDark} />
                </View>
                <Text style={styles.analysisTitle}>OZA Analyse</Text>
              </View>
              <Text style={styles.analysisSummary}>
                {analysis.attentionCount + analysis.vigilanceCount > 0
                  ? `${analysis.attentionCount + analysis.vigilanceCount} situation${
                      analysis.attentionCount + analysis.vigilanceCount > 1 ? "s" : ""
                    } nécessite${analysis.attentionCount + analysis.vigilanceCount > 1 ? "nt" : ""} une adaptation aujourd'hui`
                  : "Tous vos sportifs sont dans une zone stable aujourd'hui"}
              </Text>

              {analysis.attentionCount > 0 && (
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisDot}>🔴</Text>
                  <Text style={styles.analysisRowText}>
                    {analysis.attentionCount} sportif{analysis.attentionCount > 1 ? "s" : ""} présente
                    {analysis.attentionCount > 1 ? "nt" : ""} une charge ou une récupération à risque
                    {analysis.attentionSportifs.length > 0 ? ` (${analysis.attentionSportifs.join(", ")})` : ""}
                  </Text>
                </View>
              )}
              {analysis.vigilanceCount > 0 && (
                <View style={styles.analysisRow}>
                  <Text style={styles.analysisDot}>🟠</Text>
                  <Text style={styles.analysisRowText}>
                    {analysis.vigilanceCount} sportif{analysis.vigilanceCount > 1 ? "s" : ""} à surveiller
                    {analysis.vigilanceSportifs.length > 0 ? ` (${analysis.vigilanceSportifs.join(", ")})` : ""}
                  </Text>
                </View>
              )}
              <View style={styles.analysisRow}>
                <Text style={styles.analysisDot}>🟢</Text>
                <Text style={styles.analysisRowText}>
                  {analysis.okCount} sportif{analysis.okCount > 1 ? "s" : ""} peu{analysis.okCount > 1 ? "vent" : "t"} suivre sa séance prévue normalement
                </Text>
              </View>

              <TouchableOpacity
                style={styles.analysisButton}
                onPress={() =>
                  showAlert(
                    "Recommandations",
                    "Le détail des recommandations par sportif arrive prochainement. Pour l'instant, consulte le tableau « Mes sportifs » ci-dessous : le statut de chacun reflète exactement ce calcul."
                  )
                }
              >
                <Text style={styles.analysisButtonText}>Voir les recommandations</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primaryDark} />
              </TouchableOpacity>
            </View>

            {/* ── 4. CHARGE D'ENTRAÎNEMENT ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Charge d'entraînement
                {selectedSportif ? ` — ${selectedSportif.firstName} ${selectedSportif.lastName}` : ""}
              </Text>

              {sportifs.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sportifPickerRow}>
                  {sportifs.map((s) => (
                    <TouchableOpacity
                      key={s.uid}
                      style={[styles.sportifChip, effectiveSportifId === s.uid && styles.sportifChipActive]}
                      onPress={() => setSelectedSportifId(s.uid)}
                    >
                      <Text
                        style={[
                          styles.sportifChipText,
                          effectiveSportifId === s.uid && styles.sportifChipTextActive,
                        ]}
                      >
                        {s.firstName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, loadTab === "interne" && styles.tabActive]}
                  onPress={() => setLoadTab("interne")}
                >
                  <Text style={[styles.tabText, loadTab === "interne" && styles.tabTextActive]}>
                    Charge interne
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tab} onPress={comingSoon}>
                  <Text style={styles.tabText}>Charge externe</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, loadTab === "acwr" && styles.tabActive]}
                  onPress={() => setLoadTab("acwr")}
                >
                  <Text style={[styles.tabText, loadTab === "acwr" && styles.tabTextActive]}>
                    ACWR détaillé
                  </Text>
                </TouchableOpacity>
              </View>

              {loadTab === "interne" ? (
                <>
                  <View style={styles.loadHeaderRow}>
                    <Text style={styles.loadValue}>{trainingLoad.load7d} UA</Text>
                    {trainingLoad.loadDeltaPercent !== null && (
                      <View
                        style={[
                          styles.deltaPill,
                          { backgroundColor: trainingLoad.loadDeltaPercent >= 0 ? "rgba(255, 59, 48, 0.1)" : "rgba(52, 199, 89, 0.12)" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.deltaPillText,
                            { color: trainingLoad.loadDeltaPercent >= 0 ? Colors.riskHigh : Colors.riskLow },
                          ]}
                        >
                          {trainingLoad.loadDeltaPercent >= 0 ? "+" : ""}
                          {Math.round(trainingLoad.loadDeltaPercent)}% vs semaine précédente
                        </Text>
                      </View>
                    )}
                  </View>

                  <AreaChart
                    points={trainingLoad.series7d.map((d) => ({ date: d.date, value: d.load }))}
                    color={Colors.primary}
                    height={130}
                  />

                  <View style={styles.metricsGrid}>
                    <MetricTile label="Monotonie" value={trainingLoad.monotony.toFixed(2)} basis="47%" />
                    <MetricTile label="Strain" value={String(Math.round(trainingLoad.strain))} basis="47%" />
                    <MetricTile label="Jours de récup." value={String(trainingLoad.recoveryDays)} basis="47%" />
                    <MetricTile
                      label="ACWR"
                      value={trainingLoad.hasEnoughHistory ? trainingLoad.acwr.toFixed(2) : "—"}
                      basis="47%"
                    />
                  </View>
                </>
              ) : (
                <AcwrDetail stats={trainingLoad} />
              )}
            </View>

            <View style={styles.twoColRow}>
              {/* ── 5. PROCHAINS RENDEZ-VOUS ── */}
              <View style={[styles.card, styles.colCard]}>
                <Text style={styles.cardTitle}>Prochains rendez-vous</Text>
                {todaySlots.length === 0 && tomorrowSlots.length === 0 ? (
                  <Text style={styles.emptyText}>Aucun rendez-vous à venir.</Text>
                ) : (
                  <>
                    {todaySlots.length > 0 && (
                      <>
                        <Text style={styles.rdvGroupLabel}>Aujourd'hui</Text>
                        {todaySlots.map((slot) => (
                          <RdvRow key={slot.id} slot={slot} />
                        ))}
                      </>
                    )}
                    {tomorrowSlots.length > 0 && (
                      <>
                        <Text style={styles.rdvGroupLabel}>Demain</Text>
                        {tomorrowSlots.map((slot) => (
                          <RdvRow key={slot.id} slot={slot} />
                        ))}
                      </>
                    )}
                  </>
                )}
                <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push("/coach/reservations")}>
                  <Text style={styles.seeAllText}>Voir tout</Text>
                  <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              {/* ── 6. ÉTAT DES SPORTIFS ── */}
              <View style={[styles.card, styles.colCard]}>
                <Text style={styles.cardTitle}>État des sportifs</Text>
                <Text style={styles.wellnessAvgValue}>
                  {wellnessBreakdown.average !== null ? wellnessBreakdown.average.toFixed(1) : "—"}
                  <Text style={styles.wellnessAvgSuffix}> / 10</Text>
                </Text>
                {wellnessBreakdown.items.map((item) => (
                  <View key={item.label} style={styles.wellnessItemRow}>
                    <Text style={styles.wellnessItemLabel}>{item.label}</Text>
                    <View style={styles.wellnessItemValueRow}>
                      <Text style={styles.wellnessItemValue}>
                        {item.value !== null ? item.value.toFixed(1) : "—"}
                      </Text>
                      {item.deltaFromLastWeek !== null && Math.abs(item.deltaFromLastWeek) >= 0.1 && (
                        <Ionicons
                          name={item.deltaFromLastWeek > 0 ? "arrow-up" : "arrow-down"}
                          size={12}
                          color={item.deltaFromLastWeek > 0 ? Colors.riskLow : Colors.riskHigh}
                        />
                      )}
                    </View>
                  </View>
                ))}
                <Text style={styles.wellnessTrendText}>{wellnessBreakdown.trendLabel}</Text>
              </View>
            </View>

            {/* ── 7. ÉVOLUTION DU HOOPER ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Évolution du bien-être</Text>
              <AreaChart points={wellnessBreakdown.series7d} color={Colors.primaryLight} height={130} />
            </View>

            {/* ── 8. RÉPARTITION DES STATUTS ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Répartition des statuts</Text>
              <StatusDonut ok={analysis.okCount} vigilance={analysis.vigilanceCount} attention={analysis.attentionCount} />
            </View>

            {/* ── 9. MES SPORTIFS ── */}
            <Text style={styles.sectionTitle}>Mes sportifs</Text>
            {sportifs.length === 0 ? (
              <View style={styles.emptyCard}>
                <TeamIllustration size={72} />
                <Text style={styles.emptyTitle}>Aucun sportif suivi</Text>
                <Text style={styles.emptyText}>
                  Partagez votre code coach depuis votre profil pour associer vos sportifs.
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/coach/profil")}>
                  <Text style={styles.emptyButtonText}>Voir mon code coach</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                <SportifsTable rows={sportifRows} onPressRow={(uid) => router.push(`/coach/sportif/${uid}`)} />
              </View>
            )}

            {specialisteRelations.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Suivi en tant qu'intervenant</Text>
                {specialisteRelations.map((relation) => (
                  <TouchableOpacity
                    key={relation.id}
                    style={styles.sportifRow}
                    onPress={() => router.push(`/coach/sportif/${relation.sportifId}`)}
                  >
                    <View style={[styles.sportifAvatar, styles.specialisteAvatar]}>
                      <Ionicons name="star-outline" size={18} color={DARK.text} />
                    </View>
                    <View style={styles.sportifInfo}>
                      <Text style={styles.sportifName}>
                        {relation.sportifFirstName} {relation.sportifLastName}
                      </Text>
                      <Text style={styles.sportifLoadText}>{relation.specialite}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={DARK.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* ── 10. TENDANCES GLOBALES ── */}
            <Text style={styles.sectionTitle}>Tendances globales</Text>
            <View style={styles.trendsGrid}>
              <TrendTile
                label="Charge"
                deltaPercent={kpis.loadDelta}
                sparkline={last7.map((d) => d.load)}
                goodDirection="down"
              />
              <TrendTile
                label="Bien-être"
                deltaAbsolute={kpis.wellnessDelta}
                sparkline={wellnessBreakdown.series7d.map((d) => d.value)}
                goodDirection="up"
              />
              <TrendTile
                label="Séances"
                deltaPercent={kpis.sessionsDelta}
                sparkline={last7.map((d) => (d.load > 0 ? 1 : 0))}
                goodDirection="up"
              />
            </View>

            {/* ── 11. ACTION RAPIDE ── */}
            <View style={styles.actionBanner}>
              <Text style={styles.actionBannerTitle}>L'objectif, c'est la progression.</Text>
              <Text style={styles.actionBannerText}>
                OZA vous aide à prendre les bonnes décisions, au bon moment.
              </Text>
              <AnimatedPressable
                style={styles.actionBannerButton}
                onPress={() => {
                  if (sportifs.length === 0) {
                    showAlert("Aucun sportif", "Associez d'abord un sportif pour lui enregistrer une séance.");
                    return;
                  }
                  router.push(`/coach/sportif/${sportifs[0].uid}/nouvelle-seance`);
                }}
              >
                <Ionicons name="add-circle" size={18} color={Colors.white} />
                <Text style={styles.actionBannerButtonText}>Enregistrer une séance</Text>
              </AnimatedPressable>
            </View>

            <Text style={styles.sectionTitle}>Accès rapides</Text>
            <View style={styles.quickGrid}>
              <QuickAction icon="calendar-outline" label="Réservations" delay={0} onPress={() => router.push("/coach/reservations")} />
              <QuickAction icon="barbell-outline" label="Programmes" delay={250} onPress={() => router.push("/coach/programmes")} />
              <QuickAction icon="chatbubble-outline" label="Messagerie" delay={500} onPress={() => router.push("/coach/messages")} />
              <QuickAction icon="notifications-outline" label="Notifications" delay={750} onPress={comingSoon} />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function KpiCard({
  label,
  value,
  deltaPercent,
  deltaAbsolute,
  sparkline,
}: {
  label: string;
  value: string;
  deltaPercent?: number | null;
  deltaAbsolute?: number | null;
  sparkline?: number[];
}) {
  const delta = deltaPercent ?? deltaAbsolute ?? null;
  const isPercent = deltaPercent !== undefined;
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {delta !== null ? (
        <Text style={[styles.kpiDelta, { color: delta >= 0 ? Colors.riskLow : Colors.riskHigh }]}>
          {delta >= 0 ? "+" : ""}
          {isPercent ? `${Math.round(delta)}%` : delta.toFixed(1)} vs sem. dernière
        </Text>
      ) : (
        <Text style={styles.kpiDeltaMuted}>—</Text>
      )}
      {sparkline && sparkline.some((v) => v > 0) && (
        <View style={styles.kpiSparkline}>
          <MiniSparkline values={sparkline} width={70} height={28} color={Colors.primaryLight} />
        </View>
      )}
    </View>
  );
}

const ACWR_LABEL: Record<TrainingLoadStats["acwrLevel"], string> = {
  "sous-charge": "Sous-charge",
  optimale: "Zone optimale",
  risque: "Zone à risque",
  danger: "Danger",
};

const ACWR_COLOR: Record<TrainingLoadStats["acwrLevel"], string> = {
  "sous-charge": Colors.riskUnder,
  optimale: Colors.riskLow,
  risque: Colors.riskMedium,
  danger: Colors.riskHigh,
};

// Zones sur une échelle 0 → 2.0 (au-delà de 2.0 on plafonne visuellement,
// le chiffre exact reste affiché à côté). Bornes = acwrRiskLevel dans
// services/load.ts, pas un nouveau barème pour ce seul écran.
const ACWR_GAUGE_MAX = 2.0;
const ACWR_ZONES: { level: TrainingLoadStats["acwrLevel"]; from: number; to: number }[] = [
  { level: "sous-charge", from: 0, to: 0.8 },
  { level: "optimale", from: 0.8, to: 1.3 },
  { level: "risque", from: 1.3, to: 1.5 },
  { level: "danger", from: 1.5, to: ACWR_GAUGE_MAX },
];

function AcwrDetail({ stats }: { stats: TrainingLoadStats }) {
  const markerPercent = Math.min(stats.acwr / ACWR_GAUGE_MAX, 1) * 100;

  return (
    <View>
      {stats.hasEnoughHistory ? (
        <>
          <View style={styles.acwrHeaderRow}>
            <Text style={[styles.acwrBigValue, { color: ACWR_COLOR[stats.acwrLevel] }]}>
              {stats.acwr.toFixed(2)}
            </Text>
            <View style={[styles.acwrZonePill, { backgroundColor: `${ACWR_COLOR[stats.acwrLevel]}1A` }]}>
              <Text style={[styles.acwrZoneText, { color: ACWR_COLOR[stats.acwrLevel] }]}>
                {ACWR_LABEL[stats.acwrLevel]}
              </Text>
            </View>
          </View>

          <View style={styles.acwrGaugeTrack}>
            {ACWR_ZONES.map((zone) => (
              <View
                key={zone.level}
                style={{
                  flex: zone.to - zone.from,
                  backgroundColor: ACWR_COLOR[zone.level],
                  opacity: 0.35,
                }}
              />
            ))}
            <View style={[styles.acwrMarker, { left: `${markerPercent}%` }]} />
          </View>
          <View style={styles.acwrGaugeLabelsRow}>
            <Text style={styles.acwrGaugeLabel}>0</Text>
            <Text style={styles.acwrGaugeLabel}>0.8</Text>
            <Text style={styles.acwrGaugeLabel}>1.3</Text>
            <Text style={styles.acwrGaugeLabel}>1.5</Text>
            <Text style={styles.acwrGaugeLabel}>2.0+</Text>
          </View>
        </>
      ) : (
        <View style={styles.acwrInsufficientBanner}>
          <Ionicons name="information-circle-outline" size={16} color={DARK.textSecondary} />
          <Text style={styles.acwrInsufficientText}>
            Historique trop court pour un ACWR fiable : toute la charge enregistrée tombe dans les
            7 derniers jours, donc la "charge chronique" ci-dessous ne reflète pas un vrai passé
            d'entraînement — le ratio serait trompeur. Il redeviendra pertinent après quelques
            semaines de suivi.
          </Text>
        </View>
      )}

      <View style={styles.metricsGrid}>
        <MetricTile label="Charge aiguë (7j)" value={String(Math.round(stats.acute))} />
        <MetricTile label="Charge chronique (moy. 28j)" value={String(Math.round(stats.chronic))} />
        <MetricTile label="Monotonie" value={stats.monotony.toFixed(2)} />
        <MetricTile label="Strain" value={String(Math.round(stats.strain))} />
      </View>

      <Text style={styles.acwrCaption}>
        ACWR = charge aiguë (moyenne des 7 derniers jours) ÷ charge chronique (moyenne des 28
        derniers jours). Entre 0,8 et 1,3 : progression maîtrisée. Au-delà de 1,5 : risque de
        blessure significativement accru.
      </Text>

      <AreaChart
        points={stats.series28d.map((d) => ({ date: d.date, value: d.load }))}
        color={ACWR_COLOR[stats.acwrLevel]}
        height={110}
      />
    </View>
  );
}

function MetricTile({
  label,
  value,
  basis,
}: {
  label: string;
  value: string;
  // Largeur relative de la tuile dans sa grille — "47%" pour 2 par rangée,
  // non renseigné = 4 par rangée (styles.metricTile) sur une carte de cette
  // taille.
  basis?: "47%";
}) {
  return (
    <View style={[styles.metricTile, basis ? { minWidth: basis } : null]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function RdvRow({ slot }: { slot: Slot }) {
  return (
    <View style={styles.rdvRow}>
      <View style={styles.rdvDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rdvTime}>
          {slot.heureDebut} — {slot.heureFin}
        </Text>
        <Text style={styles.rdvName}>{slot.sportifName}</Text>
      </View>
    </View>
  );
}

function TrendTile({
  label,
  deltaPercent,
  deltaAbsolute,
  sparkline,
  goodDirection,
}: {
  label: string;
  deltaPercent?: number | null;
  deltaAbsolute?: number | null;
  sparkline: number[];
  goodDirection: "up" | "down";
}) {
  const delta = deltaPercent ?? deltaAbsolute ?? null;
  const isPercent = deltaPercent !== undefined;
  const isGood = delta === null ? null : goodDirection === "up" ? delta >= 0 : delta <= 0;
  return (
    <View style={styles.trendTile}>
      <Text style={styles.trendLabel}>{label}</Text>
      {delta !== null ? (
        <View style={styles.trendValueRow}>
          <Ionicons
            name={delta >= 0 ? "arrow-up" : "arrow-down"}
            size={13}
            color={isGood ? Colors.riskLow : Colors.riskHigh}
          />
          <Text style={[styles.trendValue, { color: isGood ? Colors.riskLow : Colors.riskHigh }]}>
            {isPercent ? `${Math.round(Math.abs(delta))}%` : Math.abs(delta).toFixed(1)}
          </Text>
        </View>
      ) : (
        <Text style={styles.trendValueMuted}>—</Text>
      )}
      {sparkline.some((v) => v > 0) && (
        <MiniSparkline values={sparkline} width={80} height={24} color={Colors.primary} />
      )}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  delay = 0,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  delay?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.35)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0.35, duration: 1500, useNativeDriver: false }),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(float, { toValue: -7, duration: 1500, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    glowLoop.start();
    floatLoop.start();
    return () => {
      glowLoop.stop();
      floatLoop.stop();
    };
  }, []);

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={[styles.quickAction, { transform: [{ scale }, { translateY: float }] }]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <Animated.View style={[styles.quickActionInner, { shadowOpacity: glow }]}>
          <View style={styles.quickActionIcon}>
            <Ionicons name={icon} size={22} color="#5BFCE0" />
          </View>
          <Text style={styles.quickActionText}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  content: {
    paddingBottom: 40,
  },

  header: {
    backgroundColor: "transparent",
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 24,
    overflow: "hidden",
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(3, 20, 18, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textOnDarkSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  greeting: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginTop: 2,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.textOnDarkSecondary,
    marginTop: 2,
  },

  headerSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(3, 20, 18, 0.35)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
  },

  headerSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textOnDark,
  },

  searchResults: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginTop: 8,
    overflow: "hidden",
  },

  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  searchResultText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  searchEmptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    padding: 14,
  },

  body: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },

  kpiCard: {
    width: "47%",
    backgroundColor: DARK.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DARK.border,
    padding: 16,
  },

  kpiLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  kpiValue: {
    fontSize: 22,
    fontWeight: "700",
    color: DARK.text,
    marginTop: 6,
  },

  kpiDelta: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },

  kpiDeltaMuted: {
    fontSize: 11,
    color: DARK.textSecondary,
    marginTop: 4,
  },

  kpiSparkline: {
    marginTop: 6,
    alignItems: "flex-end",
  },

  analysisCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    gap: 10,
  },

  analysisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  analysisBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  analysisTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnDark,
  },

  analysisSummary: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
  },

  analysisRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  analysisDot: {
    fontSize: 13,
  },

  analysisRowText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textOnDarkSecondary,
    lineHeight: 18,
  },

  analysisButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 6,
  },

  analysisButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryDark,
  },

  card: {
    backgroundColor: DARK.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DARK.border,
    padding: 18,
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK.text,
    marginBottom: 14,
  },

  sportifPickerRow: {
    marginBottom: 14,
    flexGrow: 0,
  },

  sportifChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: DARK.cardAlt,
    marginRight: 8,
  },

  sportifChipActive: {
    backgroundColor: Colors.primaryDark,
  },

  sportifChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: DARK.textSecondary,
  },

  sportifChipTextActive: {
    color: Colors.white,
  },

  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },

  tab: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: DARK.cardAlt,
  },

  tabActive: {
    backgroundColor: Colors.primary,
  },

  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: DARK.textSecondary,
  },

  tabTextActive: {
    color: Colors.white,
  },

  loadHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  loadValue: {
    fontSize: 24,
    fontWeight: "700",
    color: DARK.text,
  },

  deltaPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },

  deltaPillText: {
    fontSize: 11,
    fontWeight: "700",
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },

  acwrHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  acwrBigValue: {
    fontSize: 32,
    fontWeight: "700",
  },

  acwrZonePill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
  },

  acwrZoneText: {
    fontSize: 12,
    fontWeight: "700",
  },

  acwrGaugeTrack: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    backgroundColor: DARK.cardAlt,
    position: "relative",
  },

  acwrMarker: {
    position: "absolute",
    top: -3,
    width: 4,
    height: 16,
    borderRadius: 2,
    backgroundColor: DARK.text,
    marginLeft: -2,
  },

  acwrGaugeLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  acwrGaugeLabel: {
    fontSize: 10,
    color: DARK.textSecondary,
  },

  acwrInsufficientBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: DARK.cardAlt,
    borderRadius: 14,
    padding: 14,
  },

  acwrInsufficientText: {
    flex: 1,
    fontSize: 12,
    color: DARK.textSecondary,
    lineHeight: 17,
  },

  acwrCaption: {
    fontSize: 11,
    color: DARK.textSecondary,
    lineHeight: 16,
    marginTop: 16,
    marginBottom: 12,
  },

  metricTile: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: DARK.cardAlt,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  metricValue: {
    fontSize: 16,
    fontWeight: "700",
    color: DARK.text,
  },

  metricLabel: {
    fontSize: 10,
    color: DARK.textSecondary,
    marginTop: 2,
    textAlign: "center",
  },

  twoColRow: {
    flexDirection: "row",
    gap: 12,
  },

  colCard: {
    flex: 1,
  },

  rdvGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 4,
  },

  rdvRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },

  rdvDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },

  rdvTime: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK.text,
  },

  rdvName: {
    fontSize: 12,
    color: DARK.textSecondary,
    marginTop: 1,
  },

  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  wellnessAvgValue: {
    fontSize: 24,
    fontWeight: "700",
    color: DARK.text,
    marginBottom: 12,
  },

  wellnessAvgSuffix: {
    fontSize: 13,
    fontWeight: "600",
    color: DARK.textSecondary,
  },

  wellnessItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },

  wellnessItemLabel: {
    fontSize: 13,
    color: DARK.text,
  },

  wellnessItemValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  wellnessItemValue: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK.text,
  },

  wellnessTrendText: {
    fontSize: 11,
    color: DARK.textSecondary,
    marginTop: 10,
    fontStyle: "italic",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginBottom: 14,
  },

  sportifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: DARK.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  sportifAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  specialisteAvatar: {
    backgroundColor: DARK.cardAlt,
    borderWidth: 1,
    borderColor: DARK.border,
  },

  sportifInfo: {
    flex: 1,
  },

  sportifName: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK.text,
  },

  sportifLoadText: {
    fontSize: 12,
    color: DARK.textSecondary,
  },

  trendsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  trendTile: {
    flex: 1,
    backgroundColor: DARK.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK.border,
    padding: 12,
    gap: 6,
  },

  trendLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: DARK.textSecondary,
  },

  trendValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  trendValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  trendValueMuted: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK.textSecondary,
  },

  actionBanner: {
    backgroundColor: "rgba(3, 20, 18, 0.35)",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#5BFCE0",
    padding: 20,
    marginBottom: 24,
    gap: 6,
  },

  actionBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnDark,
  },

  actionBannerText: {
    fontSize: 13,
    color: Colors.textOnDarkSecondary,
    marginBottom: 8,
  },

  actionBannerButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 14,
  },

  actionBannerButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  emptyCard: {
    backgroundColor: DARK.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DARK.border,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 28,
    gap: 6,
  },

  emptyButton: {
    marginTop: 10,
    backgroundColor: DARK.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  emptyButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: DARK.text,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 13,
    color: DARK.textSecondary,
    textAlign: "center",
    paddingHorizontal: 30,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  quickAction: {
    width: "47%",
  },

  quickActionInner: {
    backgroundColor: "rgba(3, 20, 18, 0.35)",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#5BFCE0",
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#5BFCE0",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 8,
  },

  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(91, 252, 224, 0.14)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
  },
});
