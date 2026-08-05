import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { ProgrammeIllustration } from "../../components/empty-illustrations";
import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import { getProgrammesForSportif, Programme } from "../../services/programmes";

export default function SportifProgrammesScreen() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const data = await getProgrammesForSportif(user.uid);
        setProgrammes(data);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [loading]);

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <Text style={styles.title}>Programmes</Text>

      {programmes.length === 0 ? (
        <View style={styles.emptyCard}>
          <ProgrammeIllustration size={80} />
          <Text style={styles.emptyTitle}>Aucun programme assigné</Text>
          <Text style={styles.emptyText}>
            Votre coach ne vous a pas encore assigné de programme d'entraînement.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/sportif/messages")}>
            <Text style={styles.emptyButtonText}>Écrire à mon coach</Text>
          </TouchableOpacity>
        </View>
      ) : (
        programmes.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={styles.programmeRow}
            onPress={() => router.push(`/sportif/programme/${p.id}`)}
          >
            <View style={styles.programmeIconWrap}>
              <Ionicons name="barbell" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.programmeName}>{p.nom}</Text>
              <Text style={styles.programmeMeta}>
                {p.seances.length} séance{p.seances.length > 1 ? "s" : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))
      )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 24,
    paddingTop: 70,
    paddingBottom: 60,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 20,
  },

  emptyCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 20,
    paddingVertical: 32,
    alignItems: "center",
    gap: 6,
  },

  emptyButton: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  emptyButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 4,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  programmeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  programmeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF1F7",
    justifyContent: "center",
    alignItems: "center",
  },

  programmeName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  programmeMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
