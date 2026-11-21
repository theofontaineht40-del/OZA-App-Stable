import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { Colors } from "../constants/colors";
import { Type } from "../constants/tokens";
import GradientFill from "./gradient-fill";

type Props = {
  // Bien-être du jour (items /10, 10 = bon état) ; null = check-in à faire.
  wellness: { sommeil: number; fatigue: number; courbatures: number; stress: number; score: number } | null;
  weekLoad: number;
  onCheckin: () => void;
  // Ouvre l'écran Bien-être détaillé (touche sur le haut de la carte).
  onOpen?: () => void;
  // Évolution du bien-être sur 7 jours vs les 7 précédents (en points de %).
  deltaPercent?: number | null;
};

const SIZE = 92;
const STROKE = 10;

// Carte "Bien-être global" de la maquette : anneau du score en %, puis 4
// tuiles (charge de la semaine, sommeil, récupération, énergie).
export default function WellnessSummaryCard({ wellness, weekLoad, onCheckin, onOpen, deltaPercent }: Props) {
  const percent = wellness ? Math.round(wellness.score * 10) : 0;
  const r = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.topRow} onPress={onOpen} disabled={!onOpen} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Bien-être global</Text>
          {wellness ? (
            <>
              <Text style={styles.value}>{percent}%</Text>
              {deltaPercent !== null && deltaPercent !== undefined && (
                <Text style={[styles.delta, deltaPercent < 0 && styles.deltaDown]}>
                  {deltaPercent >= 0 ? "+" : ""}
                  {deltaPercent} % vs semaine dernière
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.pending}>Pas encore renseigné aujourd'hui</Text>
          )}
        </View>
        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Defs>
              <LinearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#2DD4BF" />
                <Stop offset="100%" stopColor="#0A5A53" />
              </LinearGradient>
            </Defs>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={Colors.accentTint} strokeWidth={STROKE} fill="none" />
            {wellness && (
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={r}
                stroke="url(#ring)"
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(circumference * percent) / 100} ${circumference}`}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            )}
          </Svg>
          <View style={styles.ringIcon}>
            <Ionicons name="heart-outline" size={26} color={Colors.primary} />
          </View>
        </View>
      </TouchableOpacity>

      {wellness ? (
        <View style={styles.tiles}>
          <Tile icon="barbell-outline" label="Charge 7 j" value={`${Math.round(weekLoad)} u.a.`} />
          <Tile icon="moon-outline" label="Sommeil" value={`${wellness.sommeil}/10`} />
          <Tile icon="refresh-outline" label="Récup." value={`${wellness.courbatures}/10`} />
          <Tile icon="flash-outline" label="Énergie" value={`${wellness.fatigue}/10`} />
        </View>
      ) : (
        <TouchableOpacity style={styles.cta} onPress={onCheckin} activeOpacity={0.85}>
          <GradientFill />
          <Text style={styles.ctaText}>Renseigner mon bien-être</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Tile({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={18} color={Colors.canard} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#0B2E2D",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  value: { fontFamily: Type.heading, fontSize: 46, color: Colors.primaryDark, marginTop: 2 },
  delta: { fontSize: 12.5, fontWeight: "700", color: Colors.primary, marginTop: 2 },
  deltaDown: { color: Colors.riskHigh },
  pending: { fontSize: 15, fontWeight: "600", color: Colors.text, marginTop: 6, maxWidth: 190 },
  ringWrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  ringIcon: { position: "absolute" },
  tiles: { flexDirection: "row", gap: 8, marginTop: 16 },
  tile: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
  },
  tileLabel: { fontSize: 10.5, color: Colors.textSecondary, fontWeight: "600" },
  tileValue: { fontSize: 13.5, fontWeight: "800", color: Colors.primaryDark },
  cta: {
    overflow: "hidden",
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  ctaText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
