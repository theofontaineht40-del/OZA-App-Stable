import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../constants/colors";
import { Type } from "../constants/tokens";
import GradientFill from "./gradient-fill";

// « Prochaine séance » de la maquette : un titre de section avec « Voir tout »,
// puis une carte blanche — vignette, titre, quand / combien de temps, focus
// musculaire — et le bouton pour démarrer quand la séance est prévue aujourd'hui.
export default function NextSessionCard({
  title,
  when,
  meta,
  focus,
  thumb,
  done,
  buttonLabel,
  onStart,
  onPress,
  onSeeAll,
  emptyText,
}: {
  title: string;
  when?: string;
  meta?: string;
  focus?: string[];
  thumb?: ReactNode;
  done?: boolean;
  buttonLabel?: string;
  onStart?: () => void;
  onPress?: () => void;
  onSeeAll?: () => void;
  emptyText?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Prochaine séance</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
            <Text style={styles.seeAll}>Voir tout</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress} activeOpacity={0.85}>
        <View style={styles.row}>
          {thumb ? (
            <View style={styles.thumb}>{thumb}</View>
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Ionicons name="barbell-outline" size={28} color={Colors.canard} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.titleRow}>
              {done && <Ionicons name="checkmark-circle" size={18} color={Colors.turquoise} />}
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            </View>
            {!!when && <Text style={styles.line}>{when}</Text>}
            {!!meta && <Text style={styles.line}>{meta}</Text>}
            {!!emptyText && <Text style={styles.line}>{emptyText}</Text>}
            {!!focus && focus.length > 0 && (
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Focus : {focus.join(", ")}</Text>
                </View>
              </View>
            )}
          </View>
          {!!onPress && <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />}
        </View>

        {!!buttonLabel && !!onStart && (
          <TouchableOpacity style={styles.button} onPress={onStart} activeOpacity={0.85}>
            <GradientFill />
            <Ionicons name="play" size={15} color={Colors.white} />
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  section: { fontFamily: Type.heading, fontSize: 22, color: Colors.text },
  seeAll: { fontSize: 13.5, fontWeight: "700", color: Colors.primary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#062D2B",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  thumb: { width: 84, height: 84, borderRadius: 16, overflow: "hidden", backgroundColor: Colors.surfaceAlt },
  thumbEmpty: { alignItems: "center", justifyContent: "center", backgroundColor: Colors.accentTint },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 16.5, fontWeight: "800", color: Colors.text, flexShrink: 1 },
  line: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  chipRow: { flexDirection: "row", marginTop: 8 },
  chip: { backgroundColor: Colors.accentTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 11.5, fontWeight: "700", color: Colors.primaryDark },
  button: {
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    marginTop: 14,
  },
  buttonText: { color: Colors.white, fontWeight: "700", fontSize: 15 },
});
