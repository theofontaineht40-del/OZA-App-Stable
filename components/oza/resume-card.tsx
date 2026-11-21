import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Type } from "../../constants/tokens";

// « Reprendre » : ramène à la séance en cours d'un programme OZA Programs.
export default function OzaResumeCard({
  programName,
  seanceName,
  week,
  percent,
  onPress,
}: {
  programName: string;
  seanceName: string;
  week: number;
  percent: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.wrap}>
      <LinearGradient colors={["#062D2B", "#075B57"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.eyebrow}>REPRENDRE · OZA PROGRAMS</Text>
          <Text style={styles.title} numberOfLines={1}>{programName}</Text>
          <Text style={styles.sub} numberOfLines={1}>Semaine {week} · {seanceName}</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View>
        </View>
        <View style={styles.play}>
          <Ionicons name="play" size={18} color={Colors.primaryDark} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, padding: 16 },
  eyebrow: { fontSize: 10.5, fontWeight: "700", letterSpacing: 1.2, color: Colors.primaryLight },
  title: { fontFamily: Type.heading, fontSize: 20, color: Colors.white, marginTop: 3 },
  sub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  track: { height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.22)", marginTop: 10, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: Colors.turquoise, borderRadius: 3 },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
});
