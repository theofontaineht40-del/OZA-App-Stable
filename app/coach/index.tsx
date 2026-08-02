import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { riskColor } from "../../components/load-summary";
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
    Alert.alert("Bientôt disponible", "Cette fonctionnalité arrive prochainement.");
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

  const todaySlots = slots.filter((s) => s.date === today && s.status === "confirme");

  function getSportifLoadInfo(sportifId: string) {
    const sportifSessions = sessions.filter((s) => s.sportifId === sportifId);
    const series = buildDailyLoadSeries(sportifSessions, 28);
    const weeklyLoad = sumLoads(series.slice(-7));
    const { acwr } = computeAcuteChronicWorkloadRatio(series);
    return { weeklyLoad, riskLevel: acwrRiskLevel(acwr) };
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{ opacity: fade, transform: [{ translateY: slide }] }}
      >
        <Text style={styles.greeting}>Bonjour {firstName ?? ""} 👋</Text>
        <Text style={styles.subtitle}>Prêt pour vos séances du jour ?</Text>

        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>Aujourd'hui</Text>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroValue}>{sessionsToday}</Text>
              <Text style={styles.heroCaption}>séances enregistrées</Text>
            </View>
            <View style={styles.heroDivider} />
            <View>
              <Text style={styles.heroValue}>{sportifs.length}</Text>
              <Text style={styles.heroCaption}>sportifs suivis</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard icon="people-outline" label="Sportifs actifs" value={String(sportifs.length)} />
          <StatCard icon="flame-outline" label="Séances / semaine" value={String(sessionsThisWeek)} />
        </View>

        <Text style={styles.sectionTitle}>Mes sportifs</Text>
        {sportifs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={28} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Aucun sportif suivi</Text>
            <Text style={styles.emptyText}>
              Partagez votre code coach depuis votre profil pour associer vos
              sportifs.
            </Text>
          </View>
        ) : (
          sportifs.map((sportif) => {
            const { weeklyLoad, riskLevel } = getSportifLoadInfo(sportif.uid);
            return (
              <TouchableOpacity
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
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
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
                  <Ionicons name="star-outline" size={18} color={Colors.white} />
                </View>
                <View style={styles.sportifInfo}>
                  <Text style={styles.sportifName}>
                    {relation.sportifFirstName} {relation.sportifLastName}
                  </Text>
                  <Text style={styles.sportifLoadText}>{relation.specialite}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>Planning du jour</Text>
        {todaySlots.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={28} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Aucune séance aujourd'hui</Text>
            <Text style={styles.emptyText}>
              Profitez-en pour préparer vos prochains programmes.
            </Text>
          </View>
        ) : (
          todaySlots.map((slot) => (
            <View key={slot.id} style={styles.planningRow}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.planningTime}>
                  {slot.heureDebut} — {slot.heureFin}
                </Text>
                <Text style={styles.planningName}>{slot.sportifName}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon="calendar-outline"
            label="Réservations"
            onPress={() => router.push("/coach/reservations")}
          />
          <QuickAction
            icon="barbell-outline"
            label="Programmes"
            onPress={() => router.push("/coach/programmes")}
          />
          <QuickAction
            icon="chatbubble-outline"
            label="Messagerie"
            onPress={() => router.push("/coach/messages")}
          />
          <QuickAction
            icon="notifications-outline"
            label="Notifications"
            onPress={comingSoon}
          />
        </View>
      </Animated.View>
    </ScrollView>
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
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  }

  function pressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <Animated.View style={[styles.quickAction, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.quickActionInner}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name={icon} size={22} color={Colors.primary} />
        </View>
        <Text style={styles.quickActionText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
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
    paddingBottom: 40,
  },

  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },

  hero: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },

  heroLabel: {
    color: "#FFE3EE",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroValue: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: "700",
  },

  heroCaption: {
    color: "#FFE3EE",
    fontSize: 13,
    marginTop: 2,
  },

  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 28,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },

  sportifRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  sportifAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  specialisteAvatar: {
    backgroundColor: Colors.text,
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
    color: Colors.text,
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
    color: Colors.textSecondary,
  },

  planningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  planningTime: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  planningName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  emptyCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 20,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 28,
    gap: 6,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF1F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
});
