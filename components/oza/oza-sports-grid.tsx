import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { DEFAULT_OZA_SPORTS, OzaSport } from "../../constants/oza-sports";
import { Type } from "../../constants/tokens";
import { auth } from "../../firebase";
import {
  getOzaProgramsByIds,
  getOzaSports,
  getOzaUserState,
  isOzaAdmin,
  OzaProgram,
  seedDefaultOzaSports,
  seedStarterPrograms,
} from "../../services/oza-programs";
import { showAlert } from "../../utils/alert";
import { useOzaBase } from "./use-oza-base";

// Contenu de l'onglet « OZA Programs » : recherche, favoris à reprendre, puis
// une tuile par sport (chacune dans les couleurs de son univers).
export default function OzaSportsGrid() {
  const base = useOzaBase();
  const [sports, setSports] = useState<OzaSport[] | null>(DEFAULT_OZA_SPORTS); // catalogue tout de suite, Firestore ensuite
  const [favorites, setFavorites] = useState<OzaProgram[]>([]);
  const [search, setSearch] = useState("");
  const uid = auth.currentUser?.uid;
  const admin = isOzaAdmin(auth.currentUser?.email);

  useEffect(() => {
    getOzaSports().then(setSports);
    if (uid) {
      getOzaUserState(uid)
        .then((s) => getOzaProgramsByIds(s.favorites))
        .then(setFavorites)
        .catch(() => setFavorites([]));
    }
  }, [uid]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sports ?? [];
    return (sports ?? []).filter(
      (s) => s.nom.toLowerCase().includes(q) || s.positions.some((p) => p.nom.toLowerCase().includes(q))
    );
  }, [sports, search]);

  async function seed() {
    try {
      const n = await seedDefaultOzaSports();
      showAlert("Catalogue enregistré", `${n} sports sont maintenant dans Firebase et modifiables sans toucher au code.`);
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  async function seedPrograms() {
    try {
      const { added, updated, skipped } = await seedStarterPrograms();
      showAlert(
        "Programmes importés",
        `${added} ajouté(s), ${updated} brouillon(s) mis à jour, ${skipped} publié(s) laissé(s) intact(s). Ouvre un sport pour relire les brouillons avant de publier.`
      );
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  if (!sports) return <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />;

  return (
    <View>
      <View style={styles.search}>
        <Ionicons name="search-outline" size={17} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un sport ou un poste…"
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {favorites.length > 0 && !search && (
        <View style={{ marginBottom: 18 }}>
          <Text style={styles.section}>Mes favoris</Text>
          {favorites.map((p) => (
            <TouchableOpacity key={p.id} style={styles.favRow} onPress={() => router.push(`${base}/programme/${p.id}` as never)}>
              <Ionicons name="star" size={18} color={Colors.riskMedium} />
              <View style={{ flex: 1 }}>
                <Text style={styles.favName} numberOfLines={1}>{p.nom}</Text>
                <Text style={styles.favMeta}>
                  {sports.find((s) => s.id === p.sportId)?.nom ?? ""} · {p.dureeSemaines} sem.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.section}>Choisis ton sport</Text>
      <View style={styles.grid}>
        {filtered.map((s) => {
          const light = s.variant === "clean";
          return (
            <TouchableOpacity key={s.id} style={styles.tileWrap} activeOpacity={0.88} onPress={() => router.push(`${base}/${s.id}` as never)}>
              <LinearGradient colors={[s.couleurs.from, s.couleurs.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
                {s.variant === "competition" && <View style={styles.stripe} />}
                <Text style={[styles.tileName, { color: light ? Colors.primaryDark : s.variant === "competition" ? s.couleurs.accent : Colors.white }]}>
                  {s.nom.toUpperCase()}
                </Text>
                <Text style={[styles.tileSub, { color: light ? "rgba(6,45,43,0.7)" : "rgba(255,255,255,0.8)" }]}>
                  {s.positions.length} {s.positionLabel === "poste" ? "postes" : s.positionLabel === "axe" ? "axes" : s.positionLabel === "objectif" ? "objectifs" : "spécialités"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
      {filtered.length === 0 && <Text style={styles.empty}>Aucun sport ne correspond à « {search} ».</Text>}

      {admin && (
        <TouchableOpacity style={styles.adminButton} onPress={seed}>
          <Ionicons name="cloud-upload-outline" size={16} color={Colors.primary} />
          <Text style={styles.adminText}>Administrateur : enregistrer le catalogue dans Firebase</Text>
        </TouchableOpacity>
      )}
      {admin && (
        <TouchableOpacity style={styles.adminButton} onPress={seedPrograms}>
          <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
          <Text style={styles.adminText}>Administrateur : importer les programmes de démarrage (brouillons)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 12, height: 44, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  section: { fontFamily: Type.heading, fontSize: 22, color: Colors.text, marginBottom: 10 },
  favRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 12, marginBottom: 8 },
  favName: { fontSize: 14.5, fontWeight: "700", color: Colors.text },
  favMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tileWrap: { width: "47.5%", flexGrow: 1 },
  tile: { height: 128, borderRadius: 20, padding: 14, justifyContent: "flex-end", overflow: "hidden" },
  tileName: { fontFamily: Type.heading, fontSize: 24, lineHeight: 28 },
  tileSub: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  stripe: { position: "absolute", top: 0, right: 18, width: 26, height: "140%", backgroundColor: "#F2D300", opacity: 0.18, transform: [{ skewX: "-20deg" }] },
  empty: { fontSize: 13.5, color: Colors.textSecondary, textAlign: "center", marginTop: 20 },
  adminButton: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 24, paddingVertical: 12 },
  adminText: { fontSize: 12.5, fontWeight: "700", color: Colors.primary },
});
