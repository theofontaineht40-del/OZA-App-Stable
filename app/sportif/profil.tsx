import AthleteProfileCard from "../../components/oza/athlete-profile-card";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { AvatarHalo } from "../../components/decor";
import BarChart from "../../components/bar-chart";
import GradientFill from "../../components/gradient-fill";
import PhotoBackground from "../../components/photo-background";
import { auth, db } from "../../firebase";
import { logoutUser } from "../../services/auth";
import { computeGoalProgress, getGoal, Goal } from "../../services/goals";
import { todayKey } from "../../services/load";
import { addDays } from "../../services/schedule";
import { getSessionsForSportif, getWellnessForSportif } from "../../services/tracking";

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  coachFirstName?: string;
  coachLastName?: string;
};

export default function ProfilScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [goal, setGoalState] = useState<Goal | null>(null);
  const [stats, setStats] = useState<{
    sessions: number;
    load7d: number;
    // Charge des 28 derniers jours vs les 28 précédents, en % (null = pas de base de comparaison).
    progression: number | null;
    wellness: number | null;
    // 4 dernières semaines glissantes, de la plus ancienne à la plus récente.
    weeks: { label: string; load: number; count: number }[];
  } | null>(null);
  const [tab, setTab] = useState<"overview" | "stats" | "goals">("overview");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const [userSnap, goalData] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getGoal(user.uid),
      ]);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfile({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          coachFirstName: data.coachFirstName,
          coachLastName: data.coachLastName,
        });
      }
      setGoalState(goalData);

      // Chiffres clés : un échec ne doit pas bloquer le profil.
      try {
        const [sessions, wellness] = await Promise.all([
          getSessionsForSportif(user.uid),
          getWellnessForSportif(user.uid),
        ]);
        const since = addDays(todayKey(), -6);
        setStats({
          sessions: sessions.length,
          load7d: sessions.filter((x) => x.date >= since).reduce((sum, x) => sum + x.load, 0),
          progression: (() => {
            const t = todayKey();
            const cur = sessions.filter((x) => x.date >= addDays(t, -27)).reduce((sum, x) => sum + x.load, 0);
            const prev = sessions
              .filter((x) => x.date >= addDays(t, -55) && x.date <= addDays(t, -28))
              .reduce((sum, x) => sum + x.load, 0);
            return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
          })(),
          wellness: wellness.length > 0 ? Math.round(wellness[0].score * 10) : null,
          weeks: [3, 2, 1, 0].map((i) => {
            const from = addDays(todayKey(), -(i * 7 + 6));
            const to = addDays(todayKey(), -i * 7);
            const inWeek = sessions.filter((x) => x.date >= from && x.date <= to);
            return {
              label: i === 0 ? "Cette sem." : i === 1 ? "S-1" : `S-${i}`,
              load: inWeek.reduce((sum, x) => sum + x.load, 0),
              count: inWeek.length,
            };
          }),
        });
      } catch {
        setStats(null);
      }
    });

    return unsubscribe;
  }, []);

  const goalProgress = goal ? computeGoalProgress(goal) : null;
  const goalDone = goalProgress !== null && goalProgress >= 1;

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <View style={styles.container}>
      <PhotoBackground variant="profil" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.card}>
        <AvatarHalo />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {profile ? `${profile.firstName} ${profile.lastName}` : ""}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🏃 Sportif</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {(
          [
            ["overview", "Vue d'ensemble"],
            ["stats", "Stats"],
            ["goals", "Objectifs"],
          ] as const
        ).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
            {tab === key && <GradientFill />}
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {stats && (
        <View style={styles.statsRow}>
          {[
            { icon: "heart-outline", value: stats.wellness !== null ? `${stats.wellness}%` : "—", label: "Bien-être" },
            { icon: "calendar-outline", value: String(stats.sessions), label: "Séances" },
            { icon: "barbell-outline", value: `${Math.round(stats.load7d)}`, label: "Charge 7 j (u.a.)" },
            {
              icon: "trending-up-outline",
              value: stats.progression !== null ? `${stats.progression > 0 ? "+" : ""}${stats.progression}%` : "—",
              label: "Progression",
            },
          ].map((t) => (
            <View key={t.label} style={styles.statTile}>
              <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={18} color={Colors.canard} />
              <Text style={styles.statValue}>{t.value}</Text>
              <Text style={styles.statLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      )}

      {tab !== "goals" && stats && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {tab === "stats" ? "Séances par semaine" : "Charge par semaine"}
          </Text>
          <BarChart
            data={stats.weeks.map((w) => ({ label: w.label, value: tab === "stats" ? w.count : w.load }))}
            unit={tab === "stats" ? undefined : "u.a."}
          />
          <Text style={styles.chartHint}>4 dernières semaines</Text>
        </View>
      )}

      {tab === "stats" && stats && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Charge par semaine</Text>
          <BarChart data={stats.weeks.map((w) => ({ label: w.label, value: w.load }))} unit="u.a." />
        </View>
      )}

      {tab === "overview" && (
        <>
          <Text style={styles.sectionTitle}>Raccourcis</Text>
          <View style={styles.shortcuts}>
            {(
              [
                { icon: "flag-outline", label: "Objectifs", to: "/sportif/objectif" },
                { icon: "pulse-outline", label: "Analyse OZA", to: "/sportif/analyse" },
                { icon: "heart-outline", label: "Bien-être", to: "/sportif/bien-etre" },
                { icon: "time-outline", label: "Historique", to: "/sportif/historique" },
              ] as const
            ).map((t) => (
              <TouchableOpacity key={t.label} style={styles.shortcut} onPress={() => router.push(t.to)} activeOpacity={0.8}>
                <View style={styles.shortcutIcon}>
                  <Ionicons name={t.icon} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.shortcutLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

      <AthleteProfileCard />

      <TouchableOpacity style={styles.equipeCard} onPress={() => router.push("/sportif/equipe")}>
        <Ionicons name="people-outline" size={22} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.equipeTitle}>Mon équipe</Text>
          <Text style={styles.equipeSubtitle}>
            {profile?.coachFirstName
              ? `Coach principal : ${profile.coachFirstName} ${profile.coachLastName}`
              : "Aucun coach principal pour l'instant"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>


        </>
      )}

      {tab === "goals" && (
        <>
          <Text style={styles.sectionTitle}>Mon objectif</Text>
      <TouchableOpacity style={styles.equipeCard} onPress={() => router.push("/sportif/objectif")}>
        <Ionicons
          name={goalDone ? "checkmark-circle" : "flag-outline"}
          size={22}
          color={goalDone ? Colors.riskLow : Colors.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.equipeTitle}>{goal ? goal.description : "Définir un objectif"}</Text>
          <Text style={styles.equipeSubtitle}>
            {goal
              ? `${goal.currentValue}${goal.unit} → ${goal.targetValue}${goal.unit}`
              : "Un but concret à suivre, semaine après semaine"}
          </Text>
          {goalProgress !== null && (
            <View style={styles.goalTrack}>
              <View
                style={[
                  styles.goalFill,
                  { width: `${Math.round(goalProgress * 100)}%` },
                  goalDone && styles.goalFillDone,
                ]}
              />
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

        </>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shortcuts: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  shortcut: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  shortcutIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },

  shortcutLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 11,
    overflow: "hidden",
  },

  tabActive: {
    backgroundColor: Colors.primary,
  },

  tabText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: Colors.textSecondary,
  },

  tabTextActive: {
    color: Colors.white,
  },

  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  chartTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },

  chartHint: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  statTile: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#0B2E2D",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primaryDark,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.textSecondary,
    textAlign: "center",
  },

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginBottom: 24,
    overflow: "hidden",
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  avatarText: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: "700",
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  badge: {
    marginTop: 14,
    backgroundColor: Colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  badgeText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },

  equipeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  equipeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  equipeSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  goalTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.grayLight,
    marginTop: 10,
    overflow: "hidden",
  },

  goalFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  goalFillDone: {
    backgroundColor: Colors.riskLow,
  },

  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 16,
    paddingVertical: 16,
  },

  logoutText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
});
