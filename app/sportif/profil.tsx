import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { AvatarHalo } from "../../components/decor";
import PhotoBackground from "../../components/photo-background";
import { auth, db } from "../../firebase";
import { logoutUser } from "../../services/auth";
import { computeGoalProgress, getGoal, Goal } from "../../services/goals";

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

      <Text style={styles.sectionTitle}>Suivi</Text>
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

      <TouchableOpacity
        style={styles.equipeCard}
        onPress={() => router.push("/sportif/objectif")}
      >
        <Ionicons
          name={goalDone ? "checkmark-circle" : "flag-outline"}
          size={22}
          color={goalDone ? Colors.riskLow : Colors.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.equipeTitle}>
            {goal ? goal.description : "Définir un objectif"}
          </Text>
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

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
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
    color: Colors.textOnDark,
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
