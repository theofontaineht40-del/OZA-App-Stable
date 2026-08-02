import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Colors } from "../constants/colors";

export function AccessDenied({ message }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={40} color={Colors.grayMedium} />
      <Text style={styles.title}>Accès non autorisé</Text>
      <Text style={styles.text}>
        {message ?? "Seul le coach principal peut accéder à cette section."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 8,
    backgroundColor: Colors.background,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },

  text: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
