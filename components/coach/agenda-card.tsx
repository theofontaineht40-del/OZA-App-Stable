import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Slot } from "../../services/reservations";

// Créneaux confirmés d'aujourd'hui, dans l'ordre.
export default function AgendaCard({ slots, onPress }: { slots: Slot[]; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.title}>AUJOURD'HUI</Text>
      {slots.length === 0 ? (
        <Text style={styles.empty}>Aucun créneau confirmé aujourd'hui.</Text>
      ) : (
        slots.map((s, i) => (
          <View key={s.id} style={[styles.row, i > 0 && styles.rowBorder]}>
            <Text style={styles.time}>{s.heureDebut}</Text>
            <Text style={styles.label} numberOfLines={1}>
              {s.sportifName ? `Créneau avec ${s.sportifName}` : "Créneau"}
            </Text>
          </View>
        ))
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 14 },
  title: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, color: Colors.textSecondary, marginBottom: 6 },
  empty: { fontSize: 14, color: Colors.textSecondary, paddingVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.grayLight },
  time: { width: 48, fontSize: 14, fontWeight: "700", color: Colors.primaryDark, fontVariant: ["tabular-nums"] },
  label: { flex: 1, fontSize: 14, color: Colors.text },
});
