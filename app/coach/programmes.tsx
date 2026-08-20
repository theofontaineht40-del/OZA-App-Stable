import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AnimatedPressable from "../../components/animated-pressable";
import ConfirmModal from "../../components/confirm-modal";
import { TeamIllustration } from "../../components/empty-illustrations";
import PlanificationTimeline from "../../components/planification-timeline";
import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import {
  blockDateRange,
  getPlanification,
  PlanBlock,
  Planification,
} from "../../services/planification";
import { downloadProgrammePdf } from "../../services/programme-pdf";
import {
  assignProgrammeToSportif,
  createProgramme,
  deleteProgramme,
  getProgrammesForCoach,
  Programme,
} from "../../services/programmes";
import { getMySportifs, SportifSummary } from "../../services/tracking";
import { showAlert } from "../../utils/alert";

export default function ProgrammesScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [sportifs, setSportifs] = useState<SportifSummary[]>([]);
  const [planifications, setPlanifications] = useState<Record<string, Planification>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nom, setNom] = useState("");
  const [selectedSportifId, setSelectedSportifId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [expandedSportifId, setExpandedSportifId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      try {
        const [data, sportifData] = await Promise.all([
          getProgrammesForCoach(user.uid),
          getMySportifs(user.uid),
        ]);
        setProgrammes(data);
        setSportifs(sportifData);

        const planifEntries = await Promise.all(
          sportifData.map(async (s) => [s.uid, await getPlanification(s.uid)] as const)
        );
        setPlanifications(Object.fromEntries(planifEntries));
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

  async function refresh() {
    if (!uid) return;
    const data = await getProgrammesForCoach(uid);
    setProgrammes(data);
  }

  async function handleCreate() {
    if (!uid || !nom.trim()) return;
    setSaving(true);
    try {
      const sportif = sportifs.find((s) => s.uid === selectedSportifId);
      const sportifName = sportif ? `${sportif.firstName} ${sportif.lastName}`.trim() : null;
      const id = await createProgramme(uid, nom.trim(), selectedSportifId, sportifName);
      setShowForm(false);
      setNom("");
      setSelectedSportifId(null);
      await refresh();
      router.push(`/coach/programme/${id}`);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string) {
    setDeleteTargetId(id);
  }

  async function handleDownload(programme: Programme) {
    setDownloadingId(programme.id);
    try {
      await downloadProgrammePdf(programme);
    } catch {
      showAlert("Téléchargement impossible", "Réessayez dans quelques instants.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    await deleteProgramme(deleteTargetId);
    setDeleteTargetId(null);
    await refresh();
  }

  async function handleAssign(sportif: SportifSummary) {
    if (!assignTargetId) return;
    setAssigningId(sportif.uid);
    try {
      const sportifName = `${sportif.firstName} ${sportif.lastName}`.trim();
      await assignProgrammeToSportif(assignTargetId, sportif.uid, sportifName);
      setAssignTargetId(null);
      await refresh();
    } finally {
      setAssigningId(null);
    }
  }

  function handlePressBlock(sportifId: string, block: PlanBlock) {
    if (block.programmeId) {
      router.push(`/coach/programme/${block.programmeId}`);
    } else {
      router.push(`/coach/sportif/${sportifId}/planification`);
    }
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  const programmeNames = Object.fromEntries(programmes.map((p) => [p.id, p.nom]));
  const assignedProgrammes = programmes.filter((p) => p.sportifId);
  const orphanProgrammes = programmes.filter((p) => !p.sportifId);

  function programmeDateLabel(p: Programme): string {
    const planification = p.sportifId ? planifications[p.sportifId] : undefined;
    const block = planification?.blocks.find((b) => b.programmeId === p.id);
    if (!planification || !block) return "Non planifié";
    if (!planification.startDate) return `Semaine ${block.startWeek}-${block.endWeek}`;
    return blockDateRange(planification.startDate, block.startWeek, block.endWeek);
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Programmes</Text>
        <TouchableOpacity onPress={() => setShowForm((v) => !v)}>
          <Ionicons
            name={showForm ? "close-circle" : "add-circle"}
            size={28}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Nom du programme</Text>
          <TextInput
  placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            placeholder="Ex: Prise de masse débutant"
            value={nom}
            onChangeText={setNom}
          />

          <Text style={styles.fieldLabel}>Sportif (optionnel)</Text>
          <View style={styles.sportifChipRow}>
            <TouchableOpacity
              style={[styles.sportifChip, selectedSportifId === null && styles.sportifChipActive]}
              onPress={() => setSelectedSportifId(null)}
            >
              <Text
                style={[
                  styles.sportifChipText,
                  selectedSportifId === null && styles.sportifChipTextActive,
                ]}
              >
                Aucun
              </Text>
            </TouchableOpacity>
            {sportifs.map((s) => (
              <TouchableOpacity
                key={s.uid}
                style={[styles.sportifChip, selectedSportifId === s.uid && styles.sportifChipActive]}
                onPress={() => setSelectedSportifId(s.uid)}
              >
                <Text
                  style={[
                    styles.sportifChipText,
                    selectedSportifId === s.uid && styles.sportifChipTextActive,
                  ]}
                >
                  {s.firstName} {s.lastName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, !nom.trim() && styles.primaryButtonDisabled]}
            onPress={handleCreate}
            disabled={saving || !nom.trim()}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Créer le programme</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {sportifs.length === 0 ? (
        <View style={styles.emptyCard}>
          <TeamIllustration size={80} />
          <Text style={styles.emptyTitle}>Aucun sportif suivi</Text>
          <Text style={styles.emptyText}>
            Partagez votre code coach pour associer des sportifs et leur créer des programmes.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/coach/profil")}>
            <Text style={styles.emptyButtonText}>Voir mon code coach</Text>
          </TouchableOpacity>
        </View>
      ) : (
        sportifs.map((s) => {
          const planification = planifications[s.uid];
          const expanded = expandedSportifId === s.uid;
          return (
            <View key={s.uid} style={styles.sportifCard}>
              <TouchableOpacity
                style={styles.sportifHeader}
                onPress={() => setExpandedSportifId(expanded ? null : s.uid)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {`${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sportifName}>
                    {s.firstName} {s.lastName}
                  </Text>
                  {!!planification?.objectif && (
                    <Text style={styles.sportifSubtitle}>
                      {planification.objectif}
                      {planification.niveau ? ` · ${planification.niveau}` : ""}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={expanded ? "chevron-down" : "chevron-forward"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {expanded && (
                <PlanificationTimeline
                  blocks={planification?.blocks ?? []}
                  weeksTotal={planification?.weeksTotal ?? 8}
                  startDate={planification?.startDate ?? null}
                  programmeNames={programmeNames}
                  onPressBlock={(block) => handlePressBlock(s.uid, block)}
                />
              )}
            </View>
          );
        })
      )}

      {assignedProgrammes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Programmes coachés</Text>
          {assignedProgrammes.map((p) => (
            <AnimatedPressable
              key={p.id}
              style={styles.programmeRow}
              onPress={() => router.push(`/coach/programme/${p.id}`)}
            >
              <View style={styles.programmeIconWrap}>
                <Ionicons name="barbell" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.programmeName}>
                  {p.sportifName} — {p.nom}
                </Text>
                <Text style={styles.programmeMeta}>{programmeDateLabel(p)}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDownload(p)}
                disabled={downloadingId === p.id}
                hitSlop={10}
                style={styles.rowActionButton}
              >
                {downloadingId === p.id ? (
                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                ) : (
                  <Ionicons name="download-outline" size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(p.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </AnimatedPressable>
          ))}
        </>
      )}

      {orphanProgrammes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Programmes non assignés</Text>
          {orphanProgrammes.map((p) => (
            <AnimatedPressable
              key={p.id}
              style={styles.programmeRow}
              onPress={() => router.push(`/coach/programme/${p.id}`)}
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
              <TouchableOpacity
                onPress={() => setAssignTargetId(p.id)}
                hitSlop={10}
                style={styles.rowActionButton}
              >
                <Ionicons name="person-add-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDownload(p)}
                disabled={downloadingId === p.id}
                hitSlop={10}
                style={styles.rowActionButton}
              >
                {downloadingId === p.id ? (
                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                ) : (
                  <Ionicons name="download-outline" size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(p.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </AnimatedPressable>
          ))}
        </>
      )}
      </Animated.View>

      <Modal
        visible={assignTargetId !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setAssignTargetId(null)}
      >
        <View style={styles.assignBackdrop}>
          <View style={styles.assignCard}>
            <Text style={styles.assignTitle}>Assigner à un sportif</Text>
            {sportifs.length === 0 ? (
              <Text style={styles.assignEmptyText}>Aucun sportif suivi pour l'instant.</Text>
            ) : (
              sportifs.map((s) => (
                <TouchableOpacity
                  key={s.uid}
                  style={styles.assignRow}
                  onPress={() => handleAssign(s)}
                  disabled={assigningId !== null}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {`${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.assignRowText}>
                    {s.firstName} {s.lastName}
                  </Text>
                  {assigningId === s.uid ? (
                    <ActivityIndicator size="small" color={Colors.textSecondary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity
              style={styles.assignCancelButton}
              onPress={() => setAssignTargetId(null)}
              disabled={assigningId !== null}
            >
              <Text style={styles.assignCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteTargetId !== null}
        title="Supprimer ce programme"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </ScrollView>
    </View>
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

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
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
    marginBottom: 8,
  },

  input: {
    color: Colors.text,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 14,
  },

  sportifChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  sportifChip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  sportifChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  sportifChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  sportifChipTextActive: {
    color: Colors.white,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonDisabled: {
    backgroundColor: Colors.grayMedium,
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
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

  sportifCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  sportifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  sportifName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  sportifSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 8,
    marginBottom: 12,
  },

  programmeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.accentTint,
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

  rowActionButton: {
    marginRight: 4,
  },

  assignBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  assignCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 22,
  },

  assignTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },

  assignEmptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },

  assignRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },

  assignRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  assignCancelButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },

  assignCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
});
