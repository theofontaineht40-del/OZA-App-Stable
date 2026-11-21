import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import BarChart from "../../components/bar-chart";
import GradientFill from "../../components/gradient-fill";
import PhotoBackground from "../../components/photo-background";
import { Colors } from "../../constants/colors";
import { Type } from "../../constants/tokens";
import { auth } from "../../firebase";
import { todayKey } from "../../services/load";
import { addDays } from "../../services/schedule";
import { getWellnessEntriesForSportif } from "../../services/tracking";

type Entry = Awaited<ReturnType<typeof getWellnessEntriesForSportif>>[number];

const SIZE = 210;
const STROKE = 16;

function energyLabel(v: number): string {
  if (v >= 8) return "Très bien";
  if (v >= 6) return "Bien";
  if (v >= 4) return "Moyen";
  return "Faible";
}

// Écran « Bien-être » : l'énergie du jour en grand cercle, puis sommeil, stress
// et douleurs/courbatures, et l'évolution sur 7 jours. Tout vient des bilans
// déjà saisis (échelle /10, 10 = bon état) ; le questionnaire reste celui du
// check-in. Pas de donnée « humeur » dans l'app : elle n'est donc pas affichée.
export default function BienEtreScreen() {
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        setEntries(await getWellnessEntriesForSportif(user.uid));
      } catch {
        setEntries([]);
      }
    });
    return unsubscribe;
  }, []);

  const today = todayKey();
  const todayEntry = entries?.find((e) => e.date === today) ?? null;
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, -(6 - i));
    const e = entries?.find((x) => x.date === date);
    const [y, m, d] = date.split("-").map(Number);
    return {
      label: new Date(y, m - 1, d, 12).toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3),
      value: e ? e.score : 0,
    };
  });

  const r = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const energy = todayEntry?.fatigue ?? 0;

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground variant="profil" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.text} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Bien-être</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </Text>

        <View style={styles.ringCard}>
          <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
            <Svg width={SIZE} height={SIZE}>
              <Defs>
                <LinearGradient id="energy" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#12C9B8" />
                  <Stop offset="100%" stopColor="#075B57" />
                </LinearGradient>
              </Defs>
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={Colors.accentTint} strokeWidth={STROKE} fill="none" />
              {todayEntry && (
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={r}
                  stroke="url(#energy)"
                  strokeWidth={STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(circumference * energy) / 10} ${circumference}`}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />
              )}
            </Svg>
            <View style={styles.ringCenter}>
              <Ionicons name="flash" size={26} color={Colors.turquoise} />
              <Text style={styles.ringLabel}>Énergie du jour</Text>
              {todayEntry ? (
                <>
                  <Text style={styles.ringValue}>
                    {energy}
                    <Text style={styles.ringMax}>/10</Text>
                  </Text>
                  <Text style={styles.ringState}>{energyLabel(energy)}</Text>
                </>
              ) : (
                <Text style={styles.ringPending}>Pas encore renseigné</Text>
              )}
            </View>
          </View>
        </View>

        {todayEntry && (
          <View style={styles.tiles}>
            <Tile icon="moon-outline" label="Sommeil" value={`${todayEntry.sommeil}/10`} />
            <Tile icon="happy-outline" label="Stress" value={`${todayEntry.stress}/10`} hint="10 = très bas" />
            <Tile icon="body-outline" label="Courbatures" value={`${todayEntry.courbatures}/10`} hint="10 = aucune" />
          </View>
        )}

        <TouchableOpacity style={styles.cta} onPress={() => router.push("/sportif/checkin")} activeOpacity={0.85}>
          <GradientFill />
          <Text style={styles.ctaText}>{todayEntry ? "Mettre à jour mon bien-être" : "Renseigner mon bien-être"}</Text>
        </TouchableOpacity>

        {entries && entries.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Bien-être sur 7 jours</Text>
            <BarChart data={week} height={110} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Tile({ icon, label, value, hint }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; hint?: string }) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={20} color={Colors.canard} />
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
      {!!hint && <Text style={styles.tileHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 70, paddingBottom: 60 },
  back: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  title: { fontFamily: Type.heading, fontSize: 30, fontWeight: "700", color: Colors.text },
  subtitle: { fontSize: 13.5, color: Colors.textSecondary, marginTop: 4, marginBottom: 18, textTransform: "capitalize" },
  ringCard: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingVertical: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringLabel: { fontSize: 12.5, fontWeight: "600", color: Colors.textSecondary, marginTop: 2 },
  ringValue: { fontFamily: Type.heading, fontSize: 54, color: Colors.primaryDark, lineHeight: 62 },
  ringMax: { fontSize: 20, color: Colors.textSecondary },
  ringState: { fontSize: 15, fontWeight: "700", color: Colors.primary },
  ringPending: { fontSize: 14, fontWeight: "600", color: Colors.text, marginTop: 6, textAlign: "center", maxWidth: 120 },
  tiles: { flexDirection: "row", gap: 10, marginBottom: 16 },
  tile: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tileValue: { fontFamily: Type.heading, fontSize: 22, color: Colors.primaryDark },
  tileLabel: { fontSize: 12, fontWeight: "700", color: Colors.text },
  tileHint: { fontSize: 10.5, color: Colors.textSecondary },
  cta: { overflow: "hidden", height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, marginBottom: 16 },
  ctaText: { color: Colors.white, fontWeight: "700", fontSize: 16 },
  chartCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: Colors.border },
  chartTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 14 },
});
