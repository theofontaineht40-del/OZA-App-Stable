import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import ConfirmModal from "../../components/confirm-modal";
import ReviewModal from "../../components/review-modal";
import { Colors } from "../../constants/colors";
import { Specialite, SPECIALITES } from "../../constants/specialites";
import { auth, db } from "../../firebase";
import {
  addSpecialiste,
  getRelationsForSportif,
  Relation,
  removeRelation,
  setPrincipalCoach,
} from "../../services/relations";
import { CoachInfo, findCoachByCode } from "../../services/tracking";
import { showAlert } from "../../utils/alert";

export default function EquipeScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [ownName, setOwnName] = useState<{ firstName: string; lastName: string } | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundCoach, setFoundCoach] = useState<CoachInfo | null>(null);
  const [pickingSpecialite, setPickingSpecialite] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Relation | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    destructive?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);

      // Deux lectures indépendantes : si l'une échoue, elle ne doit pas
      // empêcher l'autre de renseigner son état (ownName est indispensable
      // pour "Ajouter mon coach", même si les relations ne chargent pas).
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          setOwnName({ firstName: userSnap.data().firstName, lastName: userSnap.data().lastName });
        }
      } catch {
        // Ignoré : le formulaire d'ajout signalera l'erreur s'il en a besoin.
      }

      try {
        const relationData = await getRelationsForSportif(user.uid);
        setRelations(relationData);
      } catch {
        // Lecture refusée : on garde une liste vide plutôt que de planter.
      }

      setLoading(false);
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

  async function refresh() {
    if (!uid) return;
    const data = await getRelationsForSportif(uid);
    setRelations(data);
  }

  function resetForm() {
    setShowForm(false);
    setCode("");
    setFoundCoach(null);
    setPickingSpecialite(false);
  }

  async function handleSearch() {
    if (!code.trim() || !uid) return;
    setSearching(true);
    try {
      let coach;
      try {
        coach = await findCoachByCode(code);
      } catch (error: any) {
        showAlert("Erreur", error?.message ?? "Recherche impossible pour le moment.");
        return;
      }
      if (!coach) {
        showAlert("Code invalide", "Aucun coach ne correspond à ce code.");
        return;
      }
      if (relations.some((r) => r.coachId === coach.uid)) {
        showAlert("Déjà associé", "Ce professionnel fait déjà partie de votre équipe.");
        return;
      }

      const hasPrincipal = relations.some((r) => r.type === "principal");
      if (!hasPrincipal && ownName) {
        setAssigning(true);
        try {
          await setPrincipalCoach(
            uid,
            ownName.firstName,
            ownName.lastName,
            coach.uid,
            coach.firstName,
            coach.lastName
          );
          resetForm();
          await refresh();
        } catch (error: any) {
          showAlert("Erreur", error?.message ?? "Impossible d'ajouter ce coach.");
        } finally {
          setAssigning(false);
        }
        return;
      }

      setFoundCoach(coach);
    } finally {
      setSearching(false);
    }
  }

  function handleChoosePrincipal() {
    if (!uid || !foundCoach) return;
    if (!ownName) {
      showAlert(
        "Erreur",
        "Impossible de récupérer votre profil pour le moment. Réessayez dans un instant."
      );
      return;
    }
    setConfirmDialog({
      title: "Changer de coach principal",
      message:
        "Votre nouveau coach principal deviendra responsable de votre suivi. Tout votre historique sera conservé.",
      onConfirm: async () => {
        try {
          await setPrincipalCoach(
            uid,
            ownName.firstName,
            ownName.lastName,
            foundCoach.uid,
            foundCoach.firstName,
            foundCoach.lastName
          );
          resetForm();
          await refresh();
        } catch (error: any) {
          showAlert("Erreur", error?.message ?? "Impossible de changer de coach.");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }

  async function handleChooseSpecialite(specialite: Specialite) {
    if (!uid || !foundCoach) return;
    if (!ownName) {
      showAlert(
        "Erreur",
        "Impossible de récupérer votre profil pour le moment. Réessayez dans un instant."
      );
      return;
    }
    setAssigning(true);
    try {
      await addSpecialiste(
        uid,
        ownName.firstName,
        ownName.lastName,
        foundCoach.uid,
        foundCoach.firstName,
        foundCoach.lastName,
        specialite
      );
      resetForm();
      await refresh();
    } catch (error: any) {
      showAlert("Erreur", error?.message ?? "Impossible d'ajouter cet intervenant.");
    } finally {
      setAssigning(false);
    }
  }

  function handleRemoveSpecialiste(relation: Relation) {
    if (!uid) return;
    setConfirmDialog({
      title: "Retirer cet intervenant",
      message: `${relation.coachFirstName} ${relation.coachLastName} n'aura plus accès à votre suivi.`,
      destructive: true,
      onConfirm: async () => {
        try {
          await removeRelation(uid, relation.coachId);
          await refresh();
        } catch (error: any) {
          showAlert("Erreur", error?.message ?? "Impossible de retirer cet intervenant.");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  const principal = relations.find((r) => r.type === "principal") ?? null;
  const specialistes = relations.filter((r) => r.type === "specialiste");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Mon équipe</Text>
      <Text style={styles.subtitle}>
        Votre coach principal suit l'ensemble de votre entraînement. Vos intervenants
        spécialistes n'ont accès qu'à ce qui concerne leur domaine.
      </Text>

      <Text style={styles.sectionTitle}>Coach principal</Text>
      {principal ? (
        <View style={styles.principalCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {`${principal.coachFirstName?.[0] ?? ""}${principal.coachLastName?.[0] ?? ""}`.toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.personName}>
              {principal.coachFirstName} {principal.coachLastName}
            </Text>
            <Text style={styles.personRole}>Coach principal</Text>
          </View>
          <TouchableOpacity onPress={() => setReviewTarget(principal)} hitSlop={10}>
            <Ionicons name="star-outline" size={20} color={Colors.riskMedium} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="person-add-outline" size={28} color={Colors.grayMedium} />
          <Text style={styles.emptyText}>Aucun coach principal pour l'instant.</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setShowForm(true);
        }}
      >
        <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.addButtonText}>
          {principal ? "Changer de coach ou ajouter un intervenant" : "Ajouter mon coach"}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          {!foundCoach ? (
            <>
              <Text style={styles.fieldLabel}>Code fourni par le professionnel</Text>
              <View style={styles.codeRow}>
                <TextInput
  placeholderTextColor={Colors.textSecondary}
                  style={styles.codeInput}
                  placeholder="Code"
                  autoCapitalize="characters"
                  value={code}
                  onChangeText={setCode}
                />
                <TouchableOpacity
                  style={styles.codeButton}
                  onPress={handleSearch}
                  disabled={searching || !code.trim()}
                >
                  {searching ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.codeButtonText}>Chercher</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : !pickingSpecialite ? (
            <>
              <Text style={styles.foundText}>
                {foundCoach.firstName} {foundCoach.lastName}
              </Text>
              <Text style={styles.fieldLabel}>Quel rôle pour ce professionnel ?</Text>
              <TouchableOpacity
                style={styles.roleButton}
                onPress={handleChoosePrincipal}
                disabled={assigning}
              >
                <Text style={styles.roleButtonText}>Coach principal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.roleButtonSecondary}
                onPress={() => setPickingSpecialite(true)}
                disabled={assigning}
              >
                <Text style={styles.roleButtonSecondaryText}>Intervenant spécialiste</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Spécialité de {foundCoach.firstName}</Text>
              <View style={styles.specialiteGrid}>
                {SPECIALITES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.specialiteChip}
                    onPress={() => handleChooseSpecialite(s)}
                    disabled={assigning}
                  >
                    <Text style={styles.specialiteChipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {assigning && <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />}
            </>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Intervenants spécialistes</Text>
      {specialistes.length === 0 ? (
        <Text style={styles.emptyTextSmall}>Aucun intervenant pour l'instant.</Text>
      ) : (
        specialistes.map((r) => (
          <View key={r.id} style={styles.specialisteCard}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>
                {`${r.coachFirstName?.[0] ?? ""}${r.coachLastName?.[0] ?? ""}`.toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>
                {r.coachFirstName} {r.coachLastName}
              </Text>
              <Text style={styles.personRole}>{r.specialite}</Text>
            </View>
            <TouchableOpacity onPress={() => setReviewTarget(r)} hitSlop={10} style={{ marginRight: 14 }}>
              <Ionicons name="star-outline" size={20} color={Colors.riskMedium} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRemoveSpecialiste(r)} hitSlop={10}>
              <Ionicons name="close-circle-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ))
      )}
      </Animated.View>

      {reviewTarget && ownName && (
        <ReviewModal
          visible={!!reviewTarget}
          coachId={reviewTarget.coachId}
          coachName={`${reviewTarget.coachFirstName} ${reviewTarget.coachLastName}`}
          sportifId={uid ?? ""}
          sportifName={`${ownName.firstName} ${ownName.lastName}`}
          onClose={() => setReviewTarget(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmModal
          visible={!!confirmDialog}
          title={confirmDialog.title}
          message={confirmDialog.message}
          destructive={confirmDialog.destructive}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
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

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },

  principalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
  },

  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarSmallText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
  },

  personName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  personRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  emptyCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  emptyTextSmall: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  addButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 10,
  },

  codeRow: {
    flexDirection: "row",
    gap: 10,
  },

  codeInput: {
    color: Colors.text,
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },

  codeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  codeButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  foundText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },

  roleButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  roleButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  roleButtonSecondary: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  roleButtonSecondaryText: {
    color: Colors.text,
    fontWeight: "700",
    fontSize: 14,
  },

  specialiteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  specialiteChip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  specialiteChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  cancelButton: {
    marginTop: 14,
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  specialisteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
