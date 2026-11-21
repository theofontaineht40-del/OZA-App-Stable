import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { Radius, Shadow, Type } from "../../constants/tokens";

// Invite à renseigner (ou finir) le questionnaire d'accueil : c'est lui qui
// permet de proposer des programmes adaptés au sport, au niveau et au poste.
export default function ProfilePromptCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="sparkles" size={20} color={Colors.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title}>Complète ton profil sportif</Text>
        <Text style={styles.sub}>Sport, niveau, objectif : 1 minute pour des programmes faits pour toi.</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    padding: 16,
    marginBottom: 16,
    ...Shadow.card,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: Type.heading, fontSize: 17, color: Colors.text },
  sub: { fontSize: 13, lineHeight: 18, color: Colors.textSecondary, marginTop: 2 },
});
