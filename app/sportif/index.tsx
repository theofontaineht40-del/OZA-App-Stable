import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AnimatedPressable from "../../components/animated-pressable";
import { HeaderTexture } from "../../components/decor";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { buildDailyLoadSeries } from "../../services/load";
import { getProgrammesForSportif, Programme } from "../../services/programmes";
import { getSlotsForSportif, Slot } from "../../services/reservations";
import { getSessionsForSportif, SessionRecord } from "../../services/tracking";

export default function SportifHome() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [upcomingSlots, setUpcomingSlots] = useState<Slot[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
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

        const [sessionData, slotData, programmeData] = await Promise.all([
          getSessionsForSportif(user.uid),
          getSlotsForSportif(user.uid),
          getProgrammesForSportif(user.uid),
        ]);
        setSessions(sessionData);
        setUpcomingSlots(slotData);
        setProgrammes(programmeData);
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

  if (loading) {
    return <View style={styles.container} />;
  }

  const dailyLoads28 = buildDailyLoadSeries(sessions, 28);
  const last7 = dailyLoads28.slice(-7);
  const weeklySessionCount = sessions.filter((s) =>
    last7.some((d) => d.date === s.date)
  ).length;
  const weeklyMinutes = sessions
    .filter((s) => last7.some((d) => d.date === s.date))
    .reduce((sum, s) => sum + s.duration, 0);

  let streak = 0;
  for (let i = dailyLoads28.length - 1; i >= 0; i--) {
    if (dailyLoads28[i].load > 0) streak++;
    else break;
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
        <View style={styles.header}>
          <HeaderTexture />
          <Text style={styles.greeting}>Bonjour {firstName ?? ""} 👋</Text>
          <Text style={styles.subtitle}>Prêt à vous dépasser aujourd'hui ?</Text>
        </View>

        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroLabel}>Cette semaine</Text>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroValue}>{weeklySessionCount}</Text>
              <Text style={styles.heroCaption}>séances réalisées</Text>
            </View>
            <View style={styles.heroDivider} />
            <View>
              <Text style={styles.heroValue}>{weeklyMinutes}</Text>
              <Text style={styles.heroCaption}>min d'entraînement</Text>
            </View>
          </View>
        </LinearGradient>

        <AnimatedPressable
          style={styles.ctaButton}
          onPress={() => router.push("/sportif/nouvelle-seance")}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.ctaButtonText}>Enregistrer une séance</Text>
        </AnimatedPressable>

        <View style={styles.statsRow}>
          <StatCard icon="trophy-outline" label="Séances totales" value={String(sessions.length)} />
          <StatCard icon="flame-outline" label="Streak (jours)" value={String(streak)} />
          <StatCard
            icon="list-outline"
            label="Programmes actifs"
            value={String(programmes.length)}
          />
        </View>

        {programmes.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Mon programme</Text>
            <AnimatedPressable
              style={styles.programmeCard}
              onPress={() => router.push(`/sportif/programme/${programmes[0].id}`)}
            >
              <View style={styles.programmeIconWrap}>
                <Ionicons name="barbell" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.programmeName}>{programmes[0].nom}</Text>
                <Text style={styles.programmeMeta}>
                  {programmes[0].seances.length} séance
                  {programmes[0].seances.length > 1 ? "s" : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
            </AnimatedPressable>
          </>
        )}

        <Text style={styles.sectionTitle}>Prochaine séance</Text>
        {upcomingSlots.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="sparkles-outline" size={28} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Aucune séance prévue</Text>
            <Text style={styles.emptyText}>
              Réservez votre prochaine séance avec un coach.
            </Text>
          </View>
        ) : (
          <View style={styles.planningRow}>
            <Ionicons name="time-outline" size={18} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.planningDate}>{upcomingSlots[0].date}</Text>
              <Text style={styles.planningTime}>
                {upcomingSlots[0].heureDebut} — {upcomingSlots[0].heureFin}
              </Text>
            </View>
            <Text
              style={[
                styles.planningStatus,
                upcomingSlots[0].status === "confirme"
                  ? styles.planningStatusConfirmed
                  : styles.planningStatusPending,
              ]}
            >
              {upcomingSlots[0].status === "confirme" ? "Confirmée" : "En attente"}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon="calendar-outline"
            label="Réserver"
            onPress={() => router.push("/sportif/reservations")}
          />
          <QuickAction
            icon="barbell-outline"
            label="Mes programmes"
            onPress={() => router.push("/sportif/programmes")}
          />
          <QuickAction
            icon="stats-chart-outline"
            label="Historique"
            onPress={() => router.push("/sportif/historique")}
          />
          <QuickAction
            icon="chatbubble-outline"
            label="Messagerie"
            onPress={() => router.push("/sportif/messages")}
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

  header: {
    position: "relative",
    overflow: "hidden",
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
    marginBottom: 16,
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

  ctaButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 16,
    height: 54,
    marginBottom: 24,
  },

  ctaButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
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

  programmeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  programmeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentTint,
    justifyContent: "center",
    alignItems: "center",
  },

  programmeName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  programmeMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  planningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  planningDate: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  planningTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  planningStatus: {
    fontSize: 11,
    fontWeight: "700",
  },

  planningStatusPending: {
    color: Colors.riskMedium,
  },

  planningStatusConfirmed: {
    color: Colors.primary,
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
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.accentTint,
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
