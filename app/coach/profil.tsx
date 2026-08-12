import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { logoutUser } from "../../services/auth";
import { generateCoachCode } from "../../services/tracking";

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  coachCode: string;
};

export default function ProfilScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;

      const data = userSnap.data();
      let coachCode = data.coachCode;

      // Auto-génère un code pour les comptes coach créés avant ce module.
      if (!coachCode) {
        coachCode = generateCoachCode();
        await setDoc(userRef, { coachCode }, { merge: true });
      }

      setProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        coachCode,
      });
    });

    return unsubscribe;
  }, []);

  async function handleLogout() {
    await logoutUser();
    router.replace("/login");
  }

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {profile ? `${profile.firstName} ${profile.lastName}` : ""}
        </Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🏋️ Coach</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Mon code coach</Text>
      <View style={styles.codeCard}>
        <Text style={styles.codeValue}>{profile?.coachCode ?? "······"}</Text>
        <Text style={styles.codeHint}>
          Partagez ce code à vos sportifs pour qu'ils soient suivis dans votre
          espace.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.referentialsLink}
        onPress={() => router.push("/coach/profil-pro")}
      >
        <Ionicons name="person-circle-outline" size={20} color={Colors.primary} />
        <Text style={styles.referentialsLinkText}>Profil professionnel</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.referentialsLink}
        onPress={() => router.push("/coach/referentiels")}
      >
        <Ionicons name="options-outline" size={20} color={Colors.primary} />
        <Text style={styles.referentialsLinkText}>Mes référentiels</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 70,
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

  codeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  codeValue: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 6,
    marginBottom: 10,
  },

  codeHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  referentialsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  referentialsLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
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
