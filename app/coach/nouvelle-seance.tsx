import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { GraphGridTexture } from "../../components/decor";
import { TeamIllustration } from "../../components/empty-illustrations";
import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import { getMySportifs, SportifSummary } from "../../services/tracking";

// Étape "choisir le sportif" avant d'enregistrer une séance depuis le
// dashboard coach — avant cet écran, l'action rapide enregistrait toujours
// la séance pour sportifs[0] sans jamais demander lequel.
export default function CoachChoisirSportifScreen() {
  const [sportifs, setSportifs] = useState<SportifSummary[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const data = await getMySportifs(user.uid);
        setSportifs(data);
      } catch {
        setSportifs([]);
      }
    });

    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    if (!sportifs) return [];
    const q = search.trim().toLowerCase();
    if (!q) return sportifs;
    return sportifs.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q));
  }, [sportifs, search]);

  if (!sportifs) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <GraphGridTexture />
        <Text style={styles.title}>Enregistrer une séance</Text>
        <Text style={styles.subtitle}>Pour quel sportif ?</Text>
      </View>

      {sportifs.length === 0 ? (
        <View style={styles.emptyCard}>
          <TeamIllustration size={72} />
          <Text style={styles.emptyTitle}>Aucun sportif suivi</Text>
          <Text style={styles.emptyText}>
            Partagez votre code coach depuis votre profil pour associer vos sportifs.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un sportif"
              placeholderTextColor={Colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>Aucun sportif ne correspond à cette recherche.</Text>
          ) : (
            filtered.map((s) => (
              <TouchableOpacity
                key={s.uid}
                style={styles.row}
                onPress={() => router.push(`/coach/sportif/${s.uid}/nouvelle-seance`)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{s.firstName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.rowName}>
                  {s.firstName} {s.lastName}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))
          )}
        </>
      )}
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

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  backText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
  },

  header: {
    position: "relative",
    overflow: "hidden",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accentTint,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },

  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  emptyCard: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
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
  },
});
