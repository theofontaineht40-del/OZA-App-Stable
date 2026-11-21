import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { DEFAULT_OZA_SPORTS, OZA_NIVEAUX, OzaSport } from "../../constants/oza-sports";
import { Radius, Shadow, Type } from "../../constants/tokens";
import { auth } from "../../firebase";
import { AthleteProfile, getAthleteProfile } from "../../services/athlete-profile";
import { getOzaProgramsForSport, getOzaSports } from "../../services/oza-programs";
import { ProgramMatch, recommendPrograms } from "../../services/recommendations";

// Bloc « Pour toi » en tête de OZA Programs : les programmes publiés qui
// correspondent au sport, au poste, au niveau et à la disponibilité du sportif.
export default function ForYou() {
  const [profile, setProfile] = useState<AthleteProfile | null | undefined>(undefined);
  const [sport, setSport] = useState<OzaSport | null>(null);
  const [matches, setMatches] = useState<ProgramMatch[] | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const p = await getAthleteProfile(user.uid);
        setProfile(p);
        if (!p?.sportId) return;
        const sports = await getOzaSports().catch(() => DEFAULT_OZA_SPORTS);
        setSport(sports.find((s) => s.id === p.sportId) ?? null);
        const programs = await getOzaProgramsForSport(p.sportId);
        setMatches(recommendPrograms(programs, p));
      } catch {
        setProfile((prev) => (prev === undefined ? null : prev));
        setMatches([]);
      }
    });
  }, []);

  if (profile === undefined) return null;

  if (!profile || !profile.sportId || !sport) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={() => router.push("/onboarding?edit=1" as never)} style={styles.promptCard}>
        <Ionicons name="sparkles" size={20} color={Colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.promptTitle}>Des programmes pour toi</Text>
          <Text style={styles.promptSub}>Réponds à quelques questions pour voir ceux qui te correspondent.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  }

  const position = sport.positions.find((p) => p.id === profile.positionId);
  const niveau = OZA_NIVEAUX.find((n) => n.key === profile.niveau)?.label;

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={styles.heading}>Pour toi</Text>
        <Text style={styles.headSub} numberOfLines={1}>
          {[sport.nom, position?.nom, niveau].filter(Boolean).join(" · ")}
        </Text>
      </View>

      {matches === null ? null : matches.length === 0 ? (
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push(`/sportif/oza/${sport.id}` as never)}>
          <LinearGradient colors={[sport.couleurs.from, sport.couleurs.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.empty}>
            <Text style={styles.emptyTitle}>Programmes {sport.nom.toLowerCase()} à venir</Text>
            <Text style={styles.emptyText}>
              Aucun programme publié ne correspond encore à ton profil. Ouvre l'univers {sport.nom} pour suivre les nouveautés.
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        matches.map((m) => (
          <TouchableOpacity
            key={m.program.id}
            activeOpacity={0.88}
            style={styles.card}
            onPress={() => router.push(`/sportif/oza/programme/${m.program.id}` as never)}
          >
            <View style={[styles.bar, { backgroundColor: sport.couleurs.accent }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{m.program.nom}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {OZA_NIVEAUX.find((n) => n.key === m.program.niveau)?.label} · {m.program.dureeSemaines} sem. · {m.program.seancesParSemaine} séances/sem.
              </Text>
              {m.reasons.length > 0 && <Text style={styles.reasons}>{m.reasons.join(" · ")}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity onPress={() => router.push(`/sportif/oza/${sport.id}` as never)} style={styles.allBtn}>
        <Text style={styles.allText}>Tous les programmes {sport.nom.toLowerCase()}</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.canard} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 22 },
  headRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  heading: { fontFamily: Type.heading, fontSize: 22, color: Colors.text },
  headSub: { flexShrink: 1, fontSize: 12.5, color: Colors.textSecondary },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
    ...Shadow.card,
  },
  bar: { width: 4, alignSelf: "stretch", borderRadius: 2 },
  cardTitle: { fontFamily: Type.heading, fontSize: 17, color: Colors.text },
  cardMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  reasons: { fontSize: 12, fontWeight: "700", color: Colors.canard, marginTop: 4 },
  empty: { borderRadius: Radius.lg, padding: 18 },
  emptyTitle: { fontFamily: Type.heading, fontSize: 19, color: Colors.white },
  emptyText: { fontSize: 13, lineHeight: 19, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  allBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 6 },
  allText: { fontSize: 13.5, fontWeight: "700", color: Colors.canard },
  promptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    padding: 16,
    marginBottom: 22,
    ...Shadow.card,
  },
  promptTitle: { fontFamily: Type.heading, fontSize: 17, color: Colors.text },
  promptSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
});
