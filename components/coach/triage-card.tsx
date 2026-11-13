import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { SignalTone, TriageItem } from "../../services/coach-signals";

const TONE_COLOR: Record<SignalTone, string> = {
  ok: Colors.riskLow,
  warn: Colors.riskMedium,
  alert: Colors.riskHigh,
};

const MAX_VISIBLE = 6;

// Boîte « À traiter » : un sportif par ligne, la raison en pastilles et le
// bon bouton (Répondre s'il a écrit, sinon Voir la fiche).
export default function TriageCard({
  items,
  onOpen,
  onReply,
  onSeeAll,
}: {
  items: TriageItem[];
  onOpen: (uid: string) => void;
  onReply: (uid: string) => void;
  onSeeAll: () => void;
}) {
  const visible = items.slice(0, MAX_VISIBLE);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>À TRAITER</Text>

      {items.length === 0 ? (
        <Text style={styles.empty}>Rien d'urgent : tous tes sportifs sont dans le vert.</Text>
      ) : (
        visible.map((item, i) => (
          <TouchableOpacity
            key={item.uid}
            style={[styles.row, i > 0 && styles.rowBorder]}
            onPress={() => onOpen(item.uid)}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.stripe,
                { backgroundColor: item.severity === "alert" ? Colors.riskHigh : Colors.riskMedium },
              ]}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.chips}>
                {item.chips.map((c) => (
                  <View
                    key={c.label}
                    style={[
                      styles.chip,
                      { backgroundColor: `${TONE_COLOR[c.tone]}1F`, borderColor: `${TONE_COLOR[c.tone]}55` },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: TONE_COLOR[c.tone] }]}>{c.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.action}
              onPress={() => (item.unreadMessage ? onReply(item.uid) : onOpen(item.uid))}
            >
              <Text style={styles.actionText}>{item.unreadMessage ? "Répondre" : "Voir la fiche"}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}

      {items.length > MAX_VISIBLE && (
        <TouchableOpacity style={styles.more} onPress={onSeeAll}>
          <Text style={styles.moreText}>Voir les {items.length - MAX_VISIBLE} autres</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 14 },
  title: { fontSize: 11, fontWeight: "700", letterSpacing: 0.6, color: Colors.textSecondary, marginBottom: 6 },
  empty: { fontSize: 14, color: Colors.text, paddingVertical: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.grayLight },
  stripe: { width: 4, alignSelf: "stretch", borderRadius: 2 },
  name: { fontSize: 15, fontWeight: "700", color: Colors.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 5 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipText: { fontSize: 11.5, fontWeight: "600" },
  action: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionText: { fontSize: 12, fontWeight: "700", color: Colors.primaryDark },
  more: { paddingTop: 12, alignItems: "center", borderTopWidth: 1, borderTopColor: Colors.grayLight },
  moreText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
});
