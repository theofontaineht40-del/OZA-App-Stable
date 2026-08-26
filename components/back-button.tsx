import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

import { Colors } from "../constants/colors";

// Flèche de retour discrète, réutilisée sur tous les écrans secondaires
// (tout ce qui n'est pas un onglet racine) pour une navigation cohérente.
export default function BackButton({
  color = Colors.text,
  style,
  onPress,
}: {
  color?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      activeOpacity={0.6}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      onPress={onPress ?? (() => router.back())}
    >
      <Ionicons name="chevron-back" size={20} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 8,
  },
});
