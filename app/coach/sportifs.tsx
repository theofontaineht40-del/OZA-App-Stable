import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { GraphGridTexture } from "../../components/decor";
import { TeamIllustration } from "../../components/empty-illustrations";
import { Colors } from "../../constants/colors";
import { auth, db } from "../../firebase";
import { createManagedSportif } from "../../services/relations";
import { getMySportifs, SportifSummary } from "../../services/tracking";
import { showAlert } from "../../utils/alert";

// Onglet dédié à la liste des sportifs — chaque sportif ouvre sa fiche
// complète (planification, programme, bilans, historique...), accessible
// directement depuis la barre du bas plutôt qu'en passant par le dashboard.
//
// Deux façons d'arriver dans cette liste : le sportif s'inscrit lui-même et
// entre le code coach (flux historique), ou le coach crée directement un
// profil "géré" ici — pour un client qui n'utilisera jamais l'app lui-même
// (voir createManagedSportif). Les deux se mélangent dans la même liste ;
// seul un badge distingue les profils gérés.
export default function SportifsTabScreen() {
  const [coachUid, setCoachUid] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<{ firstName: string; lastName: string } | null>(null);
  const [sportifs, setSportifs] = useState<SportifSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setCoachUid(user.uid);
      try {
        const [data, coachSnap] = await Promise.all([
          getMySportifs(user.uid),
          getDoc(doc(db, "users", user.uid)),
        ]);
        setSportifs(data);
        if (coachSnap.exists()) {
          setCoachName({ firstName: coachSnap.data().firstName ?? "", lastName: coachSnap.data().lastName ?? "" });
        }
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

  function openCreate() {
    setNewFirstName("");
    setNewLastName("");
    setShowCreate(true);
  }

  async function handleCreate() {
    if (!coachUid || !coachName) return;
    if (!newFirstName.trim() || !newLastName.trim()) {
      showAlert("Nom manquant", "Renseignez le prénom et le nom du sportif.");
      return;
    }
    setCreating(true);
    try {
      const id = await createManagedSportif(
        coachUid,
        coachName.firstName,
        coachName.lastName,
        newFirstName.trim(),
        newLastName.trim()
      );
      setSportifs((prev) => [
        ...(prev ?? []),
        { uid: id, firstName: newFirstName.trim(), lastName: newLastName.trim(), managed: true },
      ]);
      setShowCreate(false);
      router.push(`/coach/sportif/${id}`);
    } catch {
      showAlert("Erreur", "Impossible de créer ce profil pour le moment.");
    } finally {
      setCreating(false);
    }
  }

  if (!sportifs) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <GraphGridTexture />
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Sportifs</Text>
            <Text style={styles.subtitle}>Vos clients suivis</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openCreate}>
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {sportifs.length === 0 ? (
        <View style={styles.emptyCard}>
          <TeamIllustration size={72} />
          <Text style={styles.emptyTitle}>Aucun sportif suivi</Text>
          <Text style={styles.emptyText}>
            Partagez votre code coach pour qu'un sportif s'inscrive lui-même, ou créez
            directement un profil pour un client qui n'utilisera pas l'app.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={openCreate}>
            <Text style={styles.emptyButtonText}>Créer un sportif</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.emptyLink} onPress={() => router.push("/coach/profil")}>
            <Text style={styles.emptyLinkText}>Voir mon code coach</Text>
          </TouchableOpacity>
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
                onPress={() => router.push(`/coach/sportif/${s.uid}`)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{s.firstName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.rowName}>
                  {s.firstName} {s.lastName}
                </Text>
                {s.managed && (
                  <View style={styles.managedBadge}>
                    <Text style={styles.managedBadgeText}>Profil géré</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Créer un sportif</Text>
            <Text style={styles.modalSubtitle}>
              Pour un client qui n'utilisera pas l'app lui-même — vous saisirez ses séances,
              son suivi et ses bilans à sa place.
            </Text>

            <Text style={styles.fieldLabel}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={Colors.textSecondary}
              value={newFirstName}
              onChangeText={setNewFirstName}
              autoFocus
            />

            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={Colors.textSecondary}
              value={newLastName}
              onChangeText={setNewLastName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCreate(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleCreate} disabled={creating}>
                {creating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.modalConfirmText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  header: {
    position: "relative",
    overflow: "hidden",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
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

  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
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
    gap: 10,
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

  managedBadge: {
    backgroundColor: Colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  managedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
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

  emptyButton: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },

  emptyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
  },

  emptyLink: {
    marginTop: 4,
    paddingVertical: 8,
  },

  emptyLinkText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },

  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },

  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 18,
    lineHeight: 18,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },

  input: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 14,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  modalCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.grayLight,
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  modalConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary,
  },

  modalConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
});
