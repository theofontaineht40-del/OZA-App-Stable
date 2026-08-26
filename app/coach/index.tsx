import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AnimatedPressable from "../../components/animated-pressable";
import { HeaderTexture } from "../../components/decor";
import MiniSparkline from "../../components/mini-sparkline";
import { TeamIllustration } from "../../components/empty-illustrations";
import { riskColor } from "../../components/load-summary";
import PhotoBackground from "../../components/photo-background";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import {
  acwrRiskLevel,
  buildDailyLoadSeries,
  computeAcuteChronicWorkloadRatio,
  sumLoads,
  todayKey,
} from "../../services/load";
import { getRelationsForCoach, Relation } from "../../services/relations";
import { getSlotsForCoach, Slot } from "../../services/reservations";
import {
  getMySportifs,
  getSessionsForCoach,
  SessionRecord,
  SportifSummary,
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

export default function CoachHome() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sportifs, setSportifs] = useState<SportifSummary[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [specialisteRelations, setSpecialisteRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
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

        const [sportifData, sessionData, slotData, relationData] = await Promise.all([
          getMySportifs(user.uid),
          getSessionsForCoach(user.uid),
          getSlotsForCoach(user.uid),
          getRelationsForCoach(user.uid),
        ]);
        setSportifs(sportifData);
        setSessions(sessionData);
        setSlots(slotData);
        setSpecialisteRelations(relationData.filter((r) => r.type === "specialiste"));
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [loading]);

  function comingSoon() {
    showAlert("Bientôt disponible", "Cette fonctionnalité arrive prochainement.");
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  const dailyLoads28 = buildDailyLoadSeries(sessions, 28);
  const last7 = dailyLoads28.slice(-7);
  const today = todayKey();
  const sessionsToday = sessions.filter((s) => s.date === today).length;
  const sessionsThisWeek = sessions.filter((s) =>
    last7.some((d) => d.date === s.date)
  ).length;

  const todaySlots = slots
    .filter((s) => s.date === today && s.status === "confirme")
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

  function getSportifLoadInfo(sportifId: string) {
    const sportifSessions = sessions.filter((s) => s.sportifId === sportifId);
    const series = buildDailyLoadSeries(sportifSessions, 28);
    const weeklyLoad = sumLoads(series.slice(-7));
    const { acwr } = computeAcuteChronicWorkloadRatio(series);
    return { weeklyLoad, riskLevel: acwrRiskLevel(acwr) };
  }

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground variant="accueil" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fade, transform: [{ translateY: slide }] }}
        >
          <View style={styles.header}>
            <HeaderTexture />
            <Text style={styles.greeting}>Bonjour {firstName ?? ""} 👋</Text>
            <Text style={styles.subtitle}>Prêt pour vos séances du jour ?</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>AUJOURD'HUI</Text>
              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroValue}>{sessionsToday}</Text>
                  <Text style={styles.heroCaption}>séances enregistrées</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroValue, styles.heroValueAccent]}>
                    {sportifs.length}
                  </Text>
                  <Text style={styles.heroCaption}>sportifs suivis</Text>
                </View>
                <View style={styles.heroChart}>
                  <MiniSparkline values={last7.map((d) => d.load)} width={72} height={44} color={Colors.primaryLight} />
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard icon="people-outline" label="Sportifs actifs" value={String(sportifs.length)} />
              <StatCard icon="flame-outline" label="Séances / semaine" value={String(sessionsThisWeek)} />
            </View>

            <Text style={styles.sectionTitle}>Mes sportifs</Text>
            {sportifs.length === 0 ? (
              <View style={styles.emptyCard}>
                <TeamIllustration size={72} />
                <Text style={styles.emptyTitle}>Aucun sportif suivi</Text>
                <Text style={styles.emptyText}>
                  Partagez votre code coach depuis votre profil pour associer vos
                  sportifs.
                </Text>
                <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/coach/profil")}>
                  <Text style={styles.emptyButtonText}>Voir mon code coach</Text>
                </TouchableOpacity>
              </View>
            ) : (
              sportifs.map((sportif) => {
                const { weeklyLoad, riskLevel } = getSportifLoadInfo(sportif.uid);
                return (
                  <AnimatedPressable
                    key={sportif.uid}
                    style={styles.sportifRow}
                    onPress={() => router.push(`/coach/sportif/${sportif.uid}`)}
                  >
                    <View style={styles.sportifAvatar}>
                      <Text style={styles.sportifAvatarText}>
                        {`${sportif.firstName?.[0] ?? ""}${sportif.lastName?.[0] ?? ""}`.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.sportifInfo}>
                      <Text style={styles.sportifName}>
                        {sportif.firstName} {sportif.lastName}
                      </Text>
                      <View style={styles.sportifLoadRow}>
                        <View
                          style={[styles.riskDot, { backgroundColor: riskColor(riskLevel) }]}
                        />
                        <Text style={styles.sportifLoadText}>
                          {weeklyLoad} UA cette semaine
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={DARK.textSecondary} />
                  </AnimatedPressable>
                );
              })
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

            <Text style={styles.sectionTitle}>Planning du jour</Text>
            {todaySlots.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="sparkles-outline" size={28} color={DARK.accent} />
                <Text style={styles.emptyTitle}>Aucune séance aujourd'hui</Text>
                <Text style={styles.emptyText}>
                  Profitez-en pour préparer vos prochains programmes.
                </Text>
              </View>
            ) : (
              <View style={styles.timeline}>
                {todaySlots.map((slot, i) => (
                  <View key={slot.id} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View style={styles.timelineDot} />
                      {i < todaySlots.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineCard}>
                      <Text style={styles.planningTime}>
                        {slot.heureDebut} — {slot.heureFin}
                      </Text>
                      <Text style={styles.planningName}>{slot.sportifName}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.sectionTitle}>Accès rapides</Text>
            <View style={styles.quickGrid}>
              <QuickAction
                icon="calendar-outline"
                label="Réservations"
                delay={0}
                onPress={() => router.push("/coach/reservations")}
              />
              <QuickAction
                icon="barbell-outline"
                label="Programmes"
                delay={250}
                onPress={() => router.push("/coach/programmes")}
              />
              <QuickAction
                icon="chatbubble-outline"
                label="Messagerie"
                delay={500}
                onPress={() => router.push("/coach/messages")}
              />
              <QuickAction
                icon="notifications-outline"
                label="Notifications"
                delay={750}
                onPress={comingSoon}
              />
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={DARK.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
    paddingBottom: 28,
    paddingHorizontal: 24,
    overflow: "hidden",
  },

  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textOnDark,
  },

  subtitle: {
    fontSize: 15,
    color: Colors.textOnDarkSecondary,
    marginTop: 4,
  },

  body: {
    paddingHorizontal: 24,
    paddingTop: 22,
  },

  heroCard: {
    backgroundColor: "rgba(3, 20, 18, 0.4)",
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    overflow: "hidden",
  },

  heroLabel: {
    color: Colors.textOnDarkSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 16,
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroStat: {
    marginRight: 24,
  },

  heroValue: {
    color: Colors.textOnDark,
    fontSize: 30,
    fontWeight: "700",
  },

  heroValueAccent: {
    color: Colors.primaryLight,
  },

  heroCaption: {
    color: Colors.textOnDarkSecondary,
    fontSize: 12,
    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginRight: 24,
  },

  heroChart: {
    marginLeft: "auto",
    flexShrink: 1,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },

  statCard: {
    flex: 1,
    backgroundColor: DARK.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 6,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: DARK.text,
  },

  statLabel: {
    fontSize: 11,
    color: DARK.textSecondary,
    textAlign: "center",
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

  sportifAvatarText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  sportifInfo: {
    flex: 1,
  },

  sportifName: {
    fontSize: 15,
    fontWeight: "600",
    color: DARK.text,
  },

  sportifLoadRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  sportifLoadText: {
    fontSize: 12,
    color: DARK.textSecondary,
  },

  timeline: {
    marginBottom: 28,
  },

  timelineRow: {
    flexDirection: "row",
  },

  timelineRail: {
    width: 20,
    alignItems: "center",
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DARK.accent,
    marginTop: 18,
  },

  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: DARK.border,
  },

  timelineCard: {
    flex: 1,
    backgroundColor: DARK.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    marginLeft: 8,
  },

  planningTime: {
    fontSize: 14,
    fontWeight: "700",
    color: DARK.text,
  },

  planningName: {
    fontSize: 12,
    color: DARK.textSecondary,
    marginTop: 2,
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
