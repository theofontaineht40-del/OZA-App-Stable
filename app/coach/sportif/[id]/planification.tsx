import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AccessDenied } from "../../../../components/access-denied";
import DateField from "../../../../components/date-field";
import ProgrammeLinkModal from "../../../../components/programme-link-modal";
import { Colors } from "../../../../constants/colors";
import { Niveau, NIVEAUX } from "../../../../constants/periodization";
import { BLOCK_SUGGESTIONS, OBJECTIFS } from "../../../../constants/training-blocks";
import { auth, db } from "../../../../firebase";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";
import { getInjuries, Injury } from "../../../../services/medical";
import {
  blockDateRange,
  getPlanification,
  newBlockId,
  PlanBlock,
  savePlanification,
} from "../../../../services/planification";
import {
  createProgramme,
  getProgrammesForCoachAndSportif,
  Programme,
} from "../../../../services/programmes";

export default function PlanificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [objectif, setObjectif] = useState("");
  const [niveau, setNiveau] = useState<Niveau | "">("");
  const [startDate, setStartDate] = useState("");
  const [competitionDate, setCompetitionDate] = useState("");
  const [weeksTotal, setWeeksTotal] = useState("8");
  const [seancesParSemaine, setSeancesParSemaine] = useState("3");
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [activeInjuries, setActiveInjuries] = useState<Injury[]>([]);
  const [sportifName, setSportifName] = useState("");
  const [sportifProgrammes, setSportifProgrammes] = useState<Programme[]>([]);
  const [linkingBlockId, setLinkingBlockId] = useState<string | null>(null);
  const [creatingProgramme, setCreatingProgramme] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function load() {
      const coachId = auth.currentUser?.uid;
      try {
        const [planification, injuries, sportifSnap, programmes] = await Promise.all([
          getPlanification(id),
          getInjuries(id),
          getDoc(doc(db, "users", id)),
          coachId ? getProgrammesForCoachAndSportif(coachId, id) : Promise.resolve([]),
        ]);

        setObjectif(planification.objectif);
        setNiveau((planification.niveau as Niveau) || "");
        setStartDate(planification.startDate ?? "");
        setCompetitionDate(planification.competitionDate ?? "");
        setWeeksTotal(String(planification.weeksTotal));
        setSeancesParSemaine(String(planification.seancesParSemaine));
        setBlocks(planification.blocks);
        setActiveInjuries(injuries.filter((i) => i.statut === "active"));
        const sportifData = sportifSnap.data();
        setSportifName(`${sportifData?.firstName ?? ""} ${sportifData?.lastName ?? ""}`.trim());
        setSportifProgrammes(programmes);
      } catch {
        // Lecture refusée ou en échec : l'écran affiche le contrôle d'accès
        // ci-dessous (isPrincipal) plutôt que de rester bloqué en chargement.
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  function addBlock(label: string) {
    const lastEnd = blocks.length > 0 ? Math.max(...blocks.map((b) => b.endWeek)) : 0;
    const startWeek = lastEnd + 1;
    const endWeek = startWeek + 1;
    setBlocks((prev) => [...prev, { id: newBlockId(), label, startWeek, endWeek, programmeId: null }]);
  }

  function programmeNom(programmeId: string): string {
    return sportifProgrammes.find((p) => p.id === programmeId)?.nom ?? "Programme";
  }

  async function persistBlocks(nextBlocks: PlanBlock[]) {
    setBlocks(nextBlocks);
    if (!id) return;
    await savePlanification(id, {
      objectif,
      niveau,
      startDate: startDate || null,
      competitionDate: competitionDate || null,
      weeksTotal: parseInt(weeksTotal, 10) || 8,
      seancesParSemaine: parseInt(seancesParSemaine, 10) || 3,
      blocks: nextBlocks,
    });
  }

  function handleUnlinkProgramme(blockId: string) {
    persistBlocks(blocks.map((b) => (b.id === blockId ? { ...b, programmeId: null } : b)));
  }

  async function handleCreateProgrammeForBlock() {
    if (!id || !linkingBlockId) return;
    const block = blocks.find((b) => b.id === linkingBlockId);
    if (!block) return;
    setCreatingProgramme(true);
    try {
      const coachId = auth.currentUser?.uid;
      if (!coachId) return;
      const programmeId = await createProgramme(coachId, block.label, id, sportifName);
      setSportifProgrammes((prev) => [
        {
          id: programmeId,
          coachId,
          sportifId: id,
          sportifName,
          nom: block.label,
          seances: [],
          updatedAt: new Date(),
        },
        ...prev,
      ]);
      await persistBlocks(
        blocks.map((b) => (b.id === linkingBlockId ? { ...b, programmeId } : b))
      );
      setLinkingBlockId(null);
      router.push(`/coach/programme/${programmeId}`);
    } finally {
      setCreatingProgramme(false);
    }
  }

  function handleSelectExistingProgramme(programme: Programme) {
    if (!linkingBlockId) return;
    persistBlocks(
      blocks.map((b) => (b.id === linkingBlockId ? { ...b, programmeId: programme.id } : b))
    );
    setLinkingBlockId(null);
  }

  function handleAddCustom() {
    if (!customLabel.trim()) return;
    addBlock(customLabel.trim());
    setCustomLabel("");
  }

  function removeBlock(blockId: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateBlockWeek(blockId: string, field: "startWeek" | "endWeek", text: string) {
    const value = parseInt(text, 10);
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, [field]: isNaN(value) ? 0 : value } : b))
    );
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await savePlanification(id, {
        objectif,
        niveau,
        startDate: startDate || null,
        competitionDate: competitionDate || null,
        weeksTotal: parseInt(weeksTotal, 10) || 8,
        seancesParSemaine: parseInt(seancesParSemaine, 10) || 3,
        blocks,
      });
    } finally {
      setSaving(false);
    }
  }

  const isPrincipal = usePrincipalAccess(id);

  if (loading || isPrincipal === null) {
    return <View style={styles.container} />;
  }

  if (!isPrincipal) {
    return (
      <AccessDenied message="Seul le coach principal peut créer ou modifier la planification." />
    );
  }

  const baseSuggestions = objectif ? BLOCK_SUGGESTIONS[objectif] ?? [] : [];
  const suggestions =
    activeInjuries.length > 0 && !baseSuggestions.includes("Prévention")
      ? [...baseSuggestions, "Prévention"]
      : baseSuggestions;

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Planification</Text>
      <Text style={styles.subtitle}>
        OZA propose des blocs pertinents selon le profil de l'athlète — vous choisissez, réorganisez et ajustez librement.
      </Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Objectif</Text>
        <View style={styles.chipGrid}>
          {OBJECTIFS.map((o) => (
            <TouchableOpacity
              key={o}
              style={[styles.chip, objectif === o && styles.chipActive]}
              onPress={() => setObjectif(o)}
            >
              <Text style={[styles.chipText, objectif === o && styles.chipTextActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Niveau</Text>
        <View style={styles.chipGrid}>
          {NIVEAUX.map((n) => (
            <TouchableOpacity
              key={n.key}
              style={[styles.chip, niveau === n.key && styles.chipActive]}
              onPress={() => setNiveau(n.key)}
            >
              <Text style={[styles.chipText, niveau === n.key && styles.chipTextActive]}>
                {n.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Date de début du cycle</Text>
        <DateField value={startDate} onChange={setStartDate} placeholder="Choisir une date" />

        <Text style={styles.fieldLabel}>Date de compétition (optionnel)</Text>
        <DateField value={competitionDate} onChange={setCompetitionDate} placeholder="Aucune" />

        <Text style={styles.fieldLabel}>Durée du cycle (semaines)</Text>
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          keyboardType="numeric"
          value={weeksTotal}
          onChangeText={setWeeksTotal}
        />

        <Text style={styles.fieldLabel}>Séances par semaine</Text>
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          keyboardType="numeric"
          value={seancesParSemaine}
          onChangeText={setSeancesParSemaine}
        />
      </View>

      {activeInjuries.length > 0 && (
        <View style={styles.infoBox}>
          <Ionicons name="medkit-outline" size={16} color={Colors.primary} />
          <Text style={styles.infoText}>
            Blessure(s) active(s) détectée(s) : {activeInjuries.map((i) => i.zone).join(", ")}.
            Pensez à intégrer un bloc de prévention.
          </Text>
        </View>
      )}

      {objectif && (
        <>
          <Text style={styles.sectionTitle}>Suggestions pour « {objectif} »</Text>
          <View style={styles.chipGrid}>
            {suggestions.map((label) => (
              <TouchableOpacity
                key={label}
                style={styles.suggestionChip}
                onPress={() => addBlock(label)}
              >
                <Ionicons name="add" size={14} color={Colors.primary} />
                <Text style={styles.suggestionChipText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>Ajouter un bloc personnalisé</Text>
      <View style={styles.customRow}>
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={[styles.input, { flex: 1, marginBottom: 0 }]}
          placeholder="Ex : Technique de course"
          value={customLabel}
          onChangeText={setCustomLabel}
        />
        <TouchableOpacity style={styles.customAddButton} onPress={handleAddCustom}>
          <Ionicons name="add" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Votre planification ({blocks.length} bloc(s))</Text>
      {blocks.length === 0 ? (
        <Text style={styles.emptyText}>
          Aucun bloc pour l'instant — choisissez une suggestion ci-dessus ou ajoutez le vôtre.
        </Text>
      ) : (
        blocks.map((block, index) => (
          <View key={block.id} style={styles.blockCard}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockLabel}>{block.label}</Text>
              <View style={styles.blockActions}>
                <TouchableOpacity onPress={() => moveBlock(index, -1)} disabled={index === 0}>
                  <Ionicons
                    name="chevron-up"
                    size={18}
                    color={index === 0 ? Colors.grayMedium : Colors.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveBlock(index, 1)}
                  disabled={index === blocks.length - 1}
                >
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={index === blocks.length - 1 ? Colors.grayMedium : Colors.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeBlock(block.id)}>
                  <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.weekRow}>
              <Text style={styles.weekLabel}>Semaine</Text>
              <TextInput
  placeholderTextColor={Colors.textSecondary}
                style={styles.weekInput}
                keyboardType="numeric"
                value={String(block.startWeek)}
                onChangeText={(t) => updateBlockWeek(block.id, "startWeek", t)}
              />
              <Text style={styles.weekLabel}>à</Text>
              <TextInput
  placeholderTextColor={Colors.textSecondary}
                style={styles.weekInput}
                keyboardType="numeric"
                value={String(block.endWeek)}
                onChangeText={(t) => updateBlockWeek(block.id, "endWeek", t)}
              />
            </View>

            {!!startDate && (
              <Text style={styles.blockDateRange}>
                {blockDateRange(startDate, block.startWeek, block.endWeek)}
              </Text>
            )}

            {block.programmeId ? (
              <View style={styles.programmeLinkRow}>
                <TouchableOpacity
                  style={styles.programmeChip}
                  onPress={() => router.push(`/coach/programme/${block.programmeId}`)}
                >
                  <Ionicons name="barbell" size={14} color={Colors.primary} />
                  <Text style={styles.programmeChipText}>{programmeNom(block.programmeId)}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleUnlinkProgramme(block.id)}>
                  <Ionicons name="close-circle-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.linkProgrammeButton}
                onPress={() => setLinkingBlockId(block.id)}
              >
                <Ionicons name="link" size={14} color={Colors.primary} />
                <Text style={styles.linkProgrammeButtonText}>Lier un programme</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <TouchableOpacity
        style={[styles.primaryButton, { marginTop: 8 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Enregistrer la planification</Text>
        )}
      </TouchableOpacity>
    </ScrollView>

    <ProgrammeLinkModal
      visible={linkingBlockId !== null}
      defaultNom={blocks.find((b) => b.id === linkingBlockId)?.label ?? ""}
      sportifName={sportifName}
      programmes={sportifProgrammes}
      loading={false}
      creating={creatingProgramme}
      onClose={() => setLinkingBlockId(null)}
      onCreateNew={handleCreateProgrammeForBlock}
      onSelect={handleSelectExistingProgramme}
    />
    </>
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
    marginBottom: 20,
    lineHeight: 18,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },

  chip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  chipTextActive: {
    color: Colors.white,
  },

  input: {
    color: Colors.text,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 16,
  },

  infoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: Colors.accentTint,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },

  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  suggestionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },

  customRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },

  customAddButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },

  blockCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  blockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  blockLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  blockActions: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },

  weekRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  weekLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  blockDateRange: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  weekInput: {
    color: Colors.text,
    width: 50,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 10,
    textAlign: "center",
    fontSize: 13,
  },

  linkProgrammeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
  },

  linkProgrammeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  programmeLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  programmeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accentTint,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  programmeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.primary,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
