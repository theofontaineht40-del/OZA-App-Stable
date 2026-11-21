import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { OzaSport } from "../../constants/oza-sports";
import { Colors } from "../../constants/colors";
import { Type } from "../../constants/tokens";

// Sélection du poste / de la spécialité / de l'axe. Chaque sport garde sa
// composition : cartes larges (power), tuiles inclinées (speed), liste
// verticale numérotée (vertical), parcours de stations (competition), grosses
// pastilles de distance (clean).
export default function PositionPicker({
  sport,
  selectedId,
  onSelect,
}: {
  sport: OzaSport;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const accent = sport.couleurs.accent;
  const toggle = (id: string) => onSelect(selectedId === id ? null : id);

  switch (sport.variant) {
    case "speed":
      return (
        <View style={styles.speedWrap}>
          {sport.positions.map((p) => {
            const on = selectedId === p.id;
            return (
              <TouchableOpacity key={p.id} onPress={() => toggle(p.id)} activeOpacity={0.85} style={[styles.speedTile, on && { borderColor: accent, backgroundColor: "#E3F7F4" }]}>
                <Text style={[styles.speedText, on && { color: Colors.primaryDark }]}>{p.nom}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    case "vertical":
      return (
        <View style={styles.list}>
          {sport.positions.map((p, i) => {
            const on = selectedId === p.id;
            return (
              <TouchableOpacity key={p.id} onPress={() => toggle(p.id)} activeOpacity={0.85} style={[styles.listRow, on && styles.listRowOn]}>
                <Text style={[styles.listNum, on && { color: Colors.primary }]}>{i + 1}</Text>
                <Text style={styles.listName}>{p.nom}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    case "competition":
      return (
        <View style={styles.stations}>
          {sport.positions.map((p, i) => {
            const on = selectedId === p.id;
            return (
              <TouchableOpacity key={p.id} onPress={() => toggle(p.id)} activeOpacity={0.85} style={styles.stationRow}>
                <View style={styles.stationRail}>
                  <View style={[styles.stationNode, on && { backgroundColor: "#111", borderColor: "#111" }]}>
                    <Text style={[styles.stationNum, on && { color: accent }]}>{i + 1}</Text>
                  </View>
                  {i < sport.positions.length - 1 && <View style={styles.stationLine} />}
                </View>
                <Text style={[styles.stationName, on && { color: Colors.primaryDark, fontWeight: "800" }]}>{p.nom}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    case "clean":
      return (
        <View style={styles.pillWrap}>
          {sport.positions.map((p) => {
            const on = selectedId === p.id;
            return (
              <TouchableOpacity key={p.id} onPress={() => toggle(p.id)} activeOpacity={0.85} style={[styles.pill, on && styles.pillOn]}>
                <Text style={[styles.pillText, on && { color: Colors.white }]}>{p.nom}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    default:
      // power : cartes larges à deux colonnes
      return (
        <View style={styles.cards}>
          {sport.positions.map((p) => {
            const on = selectedId === p.id;
            return (
              <TouchableOpacity key={p.id} onPress={() => toggle(p.id)} activeOpacity={0.85} style={[styles.card, on && { borderColor: accent, backgroundColor: "#E3F7F4" }]}>
                <Text style={styles.cardName}>{p.nom}</Text>
                {!!p.axes?.length && <Text style={styles.cardSub} numberOfLines={2}>{p.axes.slice(0, 2).join(" · ")}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  cards: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", flexGrow: 1, minHeight: 78, borderRadius: 18, padding: 14, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, justifyContent: "space-between" },
  cardName: { fontFamily: Type.heading, fontSize: 18, color: Colors.primaryDark },
  cardSub: { fontSize: 11.5, color: Colors.textSecondary, marginTop: 4 },

  speedWrap: { gap: 8 },
  speedTile: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, transform: [{ skewX: "-6deg" }] },
  speedText: { fontFamily: Type.heading, fontSize: 18, fontStyle: "italic", color: Colors.text, transform: [{ skewX: "6deg" }] },

  list: { backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: "hidden" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  listRowOn: { backgroundColor: "#E3F7F4" },
  listNum: { fontFamily: Type.heading, fontSize: 22, width: 26, color: Colors.textSecondary },
  listName: { fontSize: 16, fontWeight: "700", color: Colors.text },

  stations: { paddingLeft: 4 },
  stationRow: { flexDirection: "row", alignItems: "stretch", gap: 14, minHeight: 50 },
  stationRail: { alignItems: "center", width: 30 },
  stationNode: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "#111", backgroundColor: Colors.white, alignItems: "center", justifyContent: "center" },
  stationNum: { fontSize: 12, fontWeight: "800", color: "#111" },
  stationLine: { flex: 1, width: 2, backgroundColor: "#111", opacity: 0.25 },
  stationName: { flex: 1, fontSize: 16, fontWeight: "600", color: Colors.text, paddingTop: 5 },

  pillWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: { borderRadius: 999, paddingVertical: 14, paddingHorizontal: 22, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  pillOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontFamily: Type.heading, fontSize: 20, color: Colors.primaryDark },
});
