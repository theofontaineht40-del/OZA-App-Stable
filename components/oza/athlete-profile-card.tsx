import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { DEFAULT_OZA_SPORTS, OZA_NIVEAUX } from "../../constants/oza-sports";
import { materielLabel, objectifLabel } from "../../constants/onboarding";
import { Radius, Shadow, Type } from "../../constants/tokens";
import { auth } from "../../firebase";
import { AthleteProfile, getAthleteProfile } from "../../services/athlete-profile";
import { getOzaSports } from "../../services/oza-programs";

// Résumé du profil sportif (questionnaire d'accueil) avec accès à la
// modification. Auto-suffisant : charge ses propres données.
export default function AthleteProfileCard() {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [sports, setSports] = useState(DEFAULT_OZA_SPORTS);

  useEffect(() => {
    // auth.currentUser est vide juste après un rechargement : on attend l'état.
    getOzaSports().then(setSports).catch(() => {});
    return onAuthStateChanged(auth, (user) => {
      if (user) getAthleteProfile(user.uid).then(setProfile).catch(() => {});
    });
  }, []);

  const sport = sports.find((s) => s.id === profile?.sportId);
  const position = sport?.positions.find((p) => p.id === profile?.positionId);
  const niveau = OZA_NIVEAUX.find((n) => n.key === profile?.niveau)?.label;

  const lines: string[] = [];
  if (sport) lines.push([sport.nom, position?.nom].filter(Boolean).join(" · "));
  if (niveau) lines.push(niveau);
  if (profile?.objectif) lines.push(objectifLabel(profile.objectif));
  if (profile?.seancesParSemaine)
    lines.push(`${profile.seancesParSemaine} séance${profile.seancesParSemaine > 1 ? "s" : ""} / semaine${profile.dureeMinutes ? ` · ${profile.dureeMinutes} min` : ""}`);
  if (profile?.materiel.length) lines.push(profile.materiel.map(materielLabel).join(", "));

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/onboarding?edit=1" as never)} style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="trophy-outline" size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title}>Mon profil sportif</Text>
        {lines.length === 0 ? (
          <Text style={styles.sub}>Renseigne ton sport, ton niveau et ton objectif.</Text>
        ) : (
          lines.map((l, i) => (
            <Text key={i} style={styles.sub} numberOfLines={1}>
              {l}
            </Text>
          ))
        )}
      </View>
      <Text style={styles.edit}>Modifier</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 18,
    marginBottom: 14,
    ...Shadow.card,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: Type.heading, fontSize: 17, color: Colors.text, marginBottom: 2 },
  sub: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  edit: { fontSize: 13, fontWeight: "700", color: Colors.canard },
});
