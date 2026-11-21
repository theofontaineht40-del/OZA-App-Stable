import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import { OzaSport } from "../../constants/oza-sports";
import { Type } from "../../constants/tokens";

// En-tête immersif d'un sport. Cinq compositions différentes (pas seulement
// des couleurs) : « power » (plein cadre sombre), « speed » (diagonales),
// « vertical » (titre vertical), « competition » (parcours de stations),
// « clean » (clair, épuré). La variante vient de la fiche du sport.
export default function SportHero({ sport, onBack }: { sport: OzaSport; onBack: () => void }) {
  const light = sport.variant === "clean";
  const ink = light ? "#062D2B" : "#FFFFFF";
  const sub = light ? "rgba(6,45,43,0.7)" : "rgba(255,255,255,0.82)";

  return (
    <View style={[styles.wrap, sport.variant === "vertical" && { height: 340 }]}>
      <LinearGradient
        colors={[sport.couleurs.from, sport.couleurs.to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {!!sport.heroImage && (
        <Image source={{ uri: sport.heroImage }} style={[StyleSheet.absoluteFill, styles.photo]} resizeMode="cover" />
      )}
      {!sport.heroImage && <Decor sport={sport} />}
      <LinearGradient
        colors={light ? ["transparent", "rgba(255,255,255,0.0)"] : ["rgba(0,0,0,0.05)", "rgba(0,0,0,0.6)"]}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity style={[styles.back, light && styles.backLight]} onPress={onBack} hitSlop={10}>
        <Ionicons name="chevron-back" size={20} color={ink} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: light ? "#087F78" : "#8BEDE0" }]}>OZA PROGRAMS</Text>
        {sport.variant === "vertical" ? (
          <View style={styles.verticalRow}>
            <View style={styles.verticalTitleWrap}>
              <View style={styles.verticalTitleBox}>
                <Text style={[styles.verticalTitle, { color: ink }]}>{sport.nom.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.tagline, { color: sub }]}>{sport.tagline}</Text>
              {sport.axes.slice(0, 4).map((a) => (
                <View key={a} style={styles.axisRow}>
                  <View style={[styles.axisDot, { backgroundColor: sport.couleurs.accent }]} />
                  <Text style={[styles.axisText, { color: ink }]}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <>
            <Text
              style={[
                styles.title,
                { color: ink },
                sport.variant === "speed" && styles.titleSpeed,
                sport.variant === "competition" && { color: sport.couleurs.accent },
                sport.variant === "power" && { fontSize: 56 },
              ]}
            >
              {sport.nom.toUpperCase()}
            </Text>
            <Text style={[styles.tagline, { color: sub }]}>{sport.tagline}</Text>
            <View style={styles.chips}>
              {sport.axes.slice(0, 4).map((a) => (
                <View key={a} style={[styles.chip, light && styles.chipLight]}>
                  <Text style={[styles.chipText, { color: ink }]}>{a}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// Éléments graphiques de remplacement tant qu'il n'y a pas de photo d'action.
function Decor({ sport }: { sport: OzaSport }) {
  const a = sport.couleurs.accent;
  switch (sport.variant) {
    case "power":
      return (
        <Text style={styles.bigWatermark} numberOfLines={1}>
          OZA
        </Text>
      );
    case "speed":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.slash,
                { left: 150 + i * 62, backgroundColor: a, opacity: 0.12 + i * 0.07, width: 36 + i * 14 },
              ]}
            />
          ))}
        </>
      );
    case "competition":
      return (
        <View style={styles.route}>
          {Array.from({ length: 8 }, (_, i) => (
            <View key={i} style={styles.routeItem}>
              <View style={[styles.routeNode, { borderColor: a }]}>
                <Text style={[styles.routeNum, { color: a }]}>{i + 1}</Text>
              </View>
              {i < 7 && <View style={[styles.routeLine, { backgroundColor: a }]} />}
            </View>
          ))}
        </View>
      );
    case "clean":
      return (
        <View style={styles.curve}>
          <Svg width={170} height={86} viewBox="0 0 170 86">
            <Polyline points="4,76 34,62 62,66 96,40 128,34 164,8" fill="none" stroke={a} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={164} cy={8} r={6} fill={a} />
          </Svg>
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  wrap: { height: 270, overflow: "hidden", borderBottomLeftRadius: 28, borderBottomRightRadius: 28, justifyContent: "flex-end" },
  photo: { width: "100%", height: "100%" },
  back: {
    position: "absolute",
    top: 54,
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  backLight: { backgroundColor: "rgba(255,255,255,0.7)" },
  content: { padding: 20, paddingBottom: 22, gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  title: { fontFamily: Type.heading, fontSize: 46, lineHeight: 52 },
  titleSpeed: { fontStyle: "italic", transform: [{ skewX: "-8deg" }] },
  tagline: { fontSize: 14, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  chip: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipLight: { backgroundColor: "rgba(6,45,43,0.08)" },
  chipText: { fontSize: 11.5, fontWeight: "700" },
  verticalRow: { flexDirection: "row", gap: 14, alignItems: "flex-end" },
  verticalTitleWrap: { width: 50, height: 210 },
  // Boîte large puis tournée : le titre se lit de bas en haut, sans être tronqué.
  verticalTitleBox: { position: "absolute", width: 210, height: 50, left: -80, top: 80, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-90deg" }] },
  verticalTitle: { fontFamily: Type.heading, fontSize: 30, letterSpacing: 1 },
  axisRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  axisDot: { width: 6, height: 6, borderRadius: 3 },
  axisText: { fontSize: 13, fontWeight: "600" },
  bigWatermark: {
    position: "absolute",
    right: -10,
    top: 30,
    fontFamily: Type.heading,
    fontSize: 150,
    color: "rgba(255,255,255,0.06)",
  },
  slash: { position: "absolute", top: -20, height: 340, transform: [{ skewX: "-22deg" }] },
  route: { position: "absolute", right: 22, top: 56, alignItems: "center" },
  routeItem: { alignItems: "center" },
  routeNode: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  routeNum: { fontSize: 10, fontWeight: "800" },
  routeLine: { width: 2, height: 9, opacity: 0.6 },
  curve: { position: "absolute", right: 22, top: 70, opacity: 0.9 },
});
