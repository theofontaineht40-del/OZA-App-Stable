import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import AnimatedPressable from "../../components/animated-pressable";
import { HeaderTexture } from "../../components/decor";
import NextSessionWidget from "../../components/next-session-widget";
import PhotoBackground from "../../components/photo-background";
import PremiumStatWidget from "../../components/premium-stat-widget";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { computeGoalProgress, getGoal, Goal } from "../../services/goals";
import { buildDailyLoadSeries } from "../../services/load";
import { getProgrammesForSportif, Programme } from "../../services/programmes";
import { getNextSeance, getSeanceExerciseNames } from "../../services/session-muscles";
import { getLatestWellnessScore, getSessionsForSportif, SessionRecord } from "../../services/tracking";

export default function SportifHome() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [checkinDone, setCheckinDone] = useState(true);
  const [goal, setGoalState] = useState<Goal | null>(null);
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

        const [sessionData, programmeData, todayScore, goalData] = await Promise.all([
          getSessionsForSportif(user.uid),
          getProgrammesForSportif(user.uid),
          getLatestWellnessScore(user.uid),
          getGoal(user.uid),
        ]);
        setSessions(sessionData);
        setProgrammes(programmeData);
        setCheckinDone(todayScore !== null);
        setGoalState(goalData);
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

  const goalProgress = goal ? computeGoalProgress(goal) : null;

  const nextSeance = getNextSeance(programmes[0] ?? null, sessions);

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
          <Text style={styles.subtitle}>Prêt à vous dépasser aujourd'hui ?</Text>
        </View>

        <Text style={styles.sectionLabel}>Aujourd'hui</Text>

        <TouchableOpacity
          style={styles.checkinCard}
          activeOpacity={0.75}
          onPress={() => router.push("/sportif/checkin")}
        >
          <Ionicons
            name={checkinDone ? "checkmark-circle" : "pulse-outline"}
            size={18}
            color={checkinDone ? Colors.riskLow : "#5BFCE0"}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.checkinCardTitle}>Check-in du jour</Text>
            <Text style={styles.checkinCardSubtitle}>
              {checkinDone ? "Complété — vous pouvez le modifier" : "Pas encore fait"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textOnDarkSecondary} />
        </TouchableOpacity>

        <AnimatedPressable
          style={styles.ctaButton}
          onPress={() => router.push("/sportif/nouvelle-seance")}
        >
          <Ionicons name="add-circle" size={20} color={Colors.white} />
          <Text style={styles.ctaButtonText}>Enregistrer une séance</Text>
        </AnimatedPressable>

        <View style={styles.todayList}>
          {programmes.length > 0 && (
            <>
              <ListRow
                icon="barbell"
                title={programmes[0].nom}
                subtitle={`${programmes[0].seances.length} séance${
                  programmes[0].seances.length > 1 ? "s" : ""
                }`}
                onPress={() => router.push(`/sportif/programme/${programmes[0].id}`)}
              />
              <Divider />
            </>
          )}

          {nextSeance ? (
            <NextSessionWidget
              workoutName={nextSeance.nom}
              exercises={getSeanceExerciseNames(nextSeance)}
              onPress={() => router.push(`/sportif/programme/${programmes[0].id}`)}
            />
          ) : (
            <ListRow
              icon="time-outline"
              title="Prochaine séance"
              subtitle="Aucune séance prévue"
              onPress={() => router.push("/sportif/reservations")}
            />
          )}
        </View>

        <PremiumStatWidget
          weeklySessionCount={weeklySessionCount}
          weeklyMinutes={weeklyMinutes}
          goalProgress={goalProgress}
          streak={streak}
          onAddSeance={() => router.push("/sportif/nouvelle-seance")}
          onViewActivity={() => router.push("/sportif/historique")}
          onViewGoal={() => router.push("/sportif/objectif")}
          onContinueStreak={() => router.push("/sportif/nouvelle-seance")}
        />

        <Text style={styles.sectionTitle}>Accès rapides</Text>
        <View style={styles.quickGrid}>
          <QuickAction
            icon="calendar-outline"
            label="Réserver"
            delay={0}
            onPress={() => router.push("/sportif/reservations")}
          />
          <QuickAction
            icon="barbell-outline"
            label="Mes programmes"
            delay={250}
            onPress={() => router.push("/sportif/programmes")}
          />
          <QuickAction
            icon="stats-chart-outline"
            label="Historique"
            delay={500}
            onPress={() => router.push("/sportif/historique")}
          />
          <QuickAction
            icon="chatbubble-outline"
            label="Messagerie"
            delay={750}
            onPress={() => router.push("/sportif/messages")}
          />
        </View>
      </Animated.View>
      </ScrollView>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  accent,
  progress,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle: string;
  accent?: boolean;
  progress?: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.listRow, accent && styles.listRowAccent]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={iconColor ?? Colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.listRowTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.listRowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
        {progress !== undefined && (
          <View style={styles.goalProgressTrack}>
            <View
              style={[
                styles.goalProgressFill,
                { width: `${Math.round(progress * 100)}%` },
                progress >= 1 && styles.goalProgressFillDone,
              ]}
            />
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
    </TouchableOpacity>
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
        Animated.timing(float, {
          toValue: -7,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
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
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
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
    color: Colors.textOnDark,
  },

  subtitle: {
    fontSize: 16,
    color: Colors.textOnDarkSecondary,
    marginTop: 4,
    marginBottom: 24,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textOnDarkSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  checkinCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(3, 20, 18, 0.35)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#5BFCE0",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#5BFCE0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 14,
  },

  checkinCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textOnDark,
  },

  checkinCardSubtitle: {
    fontSize: 12,
    color: Colors.textOnDarkSecondary,
    marginTop: 2,
  },

  todayList: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 18,
    marginBottom: 24,
    overflow: "hidden",
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },

  listRowAccent: {
    borderLeftColor: Colors.primary,
  },

  listRowTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  listRowSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  goalProgressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.grayLight,
    overflow: "hidden",
    marginTop: 8,
  },

  goalProgressFill: {
    height: 5,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  goalProgressFillDone: {
    backgroundColor: Colors.riskLow,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 46,
  },

  ctaButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(3, 20, 18, 0.35)",
    borderRadius: 16,
    height: 54,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: "#5BFCE0",
    shadowColor: "#5BFCE0",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 14,
  },

  ctaButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginBottom: 14,
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
