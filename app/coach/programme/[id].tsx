import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { AccessDenied } from "../../../components/access-denied";
import ConfirmModal from "../../../components/confirm-modal";
import ExercisePickerModal from "../../../components/exercise-picker-modal";
import { MovementIllustration } from "../../../components/exercise-illustrations";
import ImagePreviewModal from "../../../components/image-preview-modal";
import InlineLoopingVideo from "../../../components/inline-looping-video";
import MuscleSelector from "../../../components/muscle-selector";
import PhotoBackground from "../../../components/photo-background";
import VideoPreviewModal from "../../../components/video-preview-modal";
import { Colors } from "../../../constants/colors";
import { BLOC_COLORS, EXERCISE_LIBRARY, ExerciseTemplate } from "../../../constants/exercise-library";
import { MuscleId } from "../../../constants/muscle-selection";
import { auth } from "../../../firebase";
import { usePrincipalAccess } from "../../../hooks/use-principal-access";
import {
  Bloc,
  BLOC_MODES,
  blocModeWarning,
  BlocExercice,
  ChargeType,
  getProgramme,
  cloneExercices,
  cloneSeance,
  countSeanceSets,
  estimateSeanceMinutes,
  newBloc,
  newBlocExercice,
  newSeance,
  Programme,
  saveProgramme,
  Seance,
} from "../../../services/programmes";
import { getExerciseLibrary } from "../../../services/exercises";
import {
  deleteWarmupProtocol,
  getWarmupProtocols,
  saveWarmupProtocol,
  WarmupProtocol,
} from "../../../services/warmups";
import { showAlert } from "../../../utils/alert";

const CHARGE_LABELS: Record<ChargeType, string> = {
  "1rm": "% 1RM",
  rpe: "RPE",
  libre: "kg",
};

function showInfo(title: string, message: string) {
  showAlert(title, message);
}

export default function ProgrammeEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [programme, setProgramme] = useState<Programme | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeSeanceId, setActiveSeanceId] = useState<string | null>(null);
  const [pickerBlocId, setPickerBlocId] = useState<string | null>(null);
  const [replaceExerciceId, setReplaceExerciceId] = useState<string | null>(null);
  const [colorPickerBlocId, setColorPickerBlocId] = useState<string | null>(null);
  const [deleteSeanceConfirm, setDeleteSeanceConfirm] = useState(false);
  const [deleteBlocId, setDeleteBlocId] = useState<string | null>(null);
  const [library, setLibrary] = useState<ExerciseTemplate[]>(EXERCISE_LIBRARY);
  const [warmups, setWarmups] = useState<WarmupProtocol[]>([]);
  const [showWarmupPicker, setShowWarmupPicker] = useState(false);
  const [deleteWarmupId, setDeleteWarmupId] = useState<string | null>(null);
  const [protocolBlocId, setProtocolBlocId] = useState<string | null>(null);
  const [protocolName, setProtocolName] = useState("");

  useEffect(() => {
    if (!id) return;
    getProgramme(id)
      .then((p) => {
        setProgramme(p);
        setNotFound(p === null);
        if (p) setActiveSeanceId(p.seances[0]?.id ?? null);
      })
      // Un programme supprimé (ou d'un autre coach) est refusé par les règles
      // Firestore au lieu d'être "introuvable" : même message dans les deux cas.
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getExerciseLibrary(uid).then(setLibrary);
    // Les protocoles sont un plus : sans eux (ex. règles pas publiées) le
    // constructeur doit rester utilisable.
    getWarmupProtocols(uid).then(setWarmups).catch(() => setWarmups([]));
  }, []);

  const isPrincipal = usePrincipalAccess(programme?.sportifId ?? undefined);

  if (!programme) {
    if (!notFound) return <View style={styles.container} />;
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }]}>
        <Ionicons name="alert-circle-outline" size={36} color={Colors.textOnDark} />
        <Text style={{ fontSize: 17, fontWeight: "700", color: Colors.textOnDark, textAlign: "center" }}>
          Ce programme n'existe plus
        </Text>
        <Text style={{ fontSize: 13, color: Colors.textOnDarkSecondary, textAlign: "center", maxWidth: 320 }}>
          Il a été supprimé, ou il appartient à un autre coach. Le bloc du planning qui y renvoie peut être
          détaché depuis la planification du sportif.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: Colors.textOnDark }}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (programme.sportifId) {
    if (isPrincipal === null) {
      return <View style={styles.container} />;
    }
    if (!isPrincipal) {
      return (
        <AccessDenied message="Seul le coach principal peut créer ou modifier ce programme." />
      );
    }
  } else if (programme.coachId !== auth.currentUser?.uid) {
    return <AccessDenied message="Vous n'avez pas accès à ce programme." />;
  }

  const coachId = auth.currentUser?.uid ?? programme.coachId;

  function persist(seances: Seance[], nom?: string) {
    const updated = { ...programme!, seances, nom: nom ?? programme!.nom };
    setProgramme(updated);
    saveProgramme(updated.id, { nom: updated.nom, seances: updated.seances });
  }

  const activeSeance = programme.seances.find((s) => s.id === activeSeanceId) ?? programme.seances[0];

  function updateSeances(updater: (seances: Seance[]) => Seance[]) {
    persist(updater(programme!.seances));
  }

  function handleAddSeance() {
    const s = newSeance(programme!.seances.length + 1);
    updateSeances((seances) => [...seances, s]);
    setActiveSeanceId(s.id);
  }

  function handleRenameSeance(text: string) {
    updateSeances((seances) =>
      seances.map((s) => (s.id === activeSeance.id ? { ...s, nom: text } : s))
    );
  }

  function handleMoveSeance(seanceId: string, direction: -1 | 1) {
    updateSeances((seances) => {
      const index = seances.findIndex((s) => s.id === seanceId);
      const target = index + direction;
      if (target < 0 || target >= seances.length) return seances;
      const copy = [...seances];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function handleDuplicateSeance() {
    const copy = cloneSeance(activeSeance, `${activeSeance.nom} (copie)`);
    updateSeances((seances) => {
      const index = seances.findIndex((s) => s.id === activeSeance.id);
      const next = [...seances];
      next.splice(index + 1, 0, copy);
      return next;
    });
    setActiveSeanceId(copy.id);
  }

  function handleToggleMuscle(muscleId: MuscleId) {
    updateSeances((seances) =>
      seances.map((s) => {
        if (s.id !== activeSeance.id) return s;
        const current = s.muscles ?? [];
        const next = current.includes(muscleId)
          ? current.filter((m) => m !== muscleId)
          : [...current, muscleId];
        return { ...s, muscles: next };
      })
    );
  }

  function handleDeleteSeance() {
    if (programme!.seances.length <= 1) return;
    setDeleteSeanceConfirm(true);
  }

  function confirmDeleteSeance() {
    const remaining = programme!.seances.filter((s) => s.id !== activeSeance.id);
    updateSeances(() => remaining);
    setActiveSeanceId(remaining[0]?.id ?? null);
    setDeleteSeanceConfirm(false);
  }

  function updateBlocs(updater: (blocs: Bloc[]) => Bloc[]) {
    updateSeances((seances) =>
      seances.map((s) => (s.id === activeSeance.id ? { ...s, blocs: updater(s.blocs) } : s))
    );
  }

  function handleAddBloc() {
    const b = newBloc();
    b.nom = `Bloc ${activeSeance.blocs.length + 1}`;
    b.couleur = BLOC_COLORS[activeSeance.blocs.length % BLOC_COLORS.length];
    updateBlocs((blocs) => [...blocs, b]);
  }

  // Un protocole s'insère en TÊTE de séance (un échauffement vient d'abord).
  function handleInsertWarmup(protocol: WarmupProtocol) {
    const b = newBloc();
    b.nom = "Échauffement";
    b.objectif = protocol.nom;
    b.couleur = "#FF9F0A";
    b.exercices = cloneExercices(protocol.exercices);
    updateBlocs((blocs) => [b, ...blocs]);
    setShowWarmupPicker(false);
  }

  async function handleSaveProtocol() {
    const bloc = activeSeance.blocs.find((b) => b.id === protocolBlocId);
    if (!bloc || !protocolName.trim()) return;
    try {
      await saveWarmupProtocol(coachId, protocolName, bloc.exercices);
      setWarmups(await getWarmupProtocols(coachId));
      setProtocolBlocId(null);
      setProtocolName("");
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    }
  }

  async function confirmDeleteWarmup() {
    if (!deleteWarmupId) return;
    try {
      await deleteWarmupProtocol(deleteWarmupId);
      setWarmups(await getWarmupProtocols(coachId));
    } catch (error) {
      showAlert("Erreur", error instanceof Error ? error.message : String(error));
    } finally {
      setDeleteWarmupId(null);
    }
  }

  function handleUpdateBloc(blocId: string, patch: Partial<Bloc>) {
    updateBlocs((blocs) => blocs.map((b) => (b.id === blocId ? { ...b, ...patch } : b)));
  }

  function handleDeleteBloc(blocId: string) {
    setDeleteBlocId(blocId);
  }

  function confirmDeleteBloc() {
    if (!deleteBlocId) return;
    updateBlocs((blocs) => blocs.filter((b) => b.id !== deleteBlocId));
    setDeleteBlocId(null);
  }

  function handleMoveBloc(blocId: string, direction: -1 | 1) {
    updateBlocs((blocs) => {
      const index = blocs.findIndex((b) => b.id === blocId);
      const target = index + direction;
      if (target < 0 || target >= blocs.length) return blocs;
      const copy = [...blocs];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  // Remplacement d'un exercice (garde ses séries / reps / charge).
  function handleReplaceExercice(exercise: ExerciseTemplate) {
    if (!pickerBlocId || !replaceExerciceId) return;
    updateBlocs((blocs) =>
      blocs.map((b) =>
        b.id !== pickerBlocId
          ? b
          : {
              ...b,
              exercices: b.exercices.map((ex) =>
                ex.id === replaceExerciceId
                  ? { ...ex, exerciceId: exercise.id, exerciceNom: exercise.nom, exerciceIcon: exercise.icon }
                  : ex
              ),
            }
      )
    );
    setPickerBlocId(null);
    setReplaceExerciceId(null);
  }

  // Ajout de plusieurs exercices d'un coup, dans l'ordre de sélection.
  function handleAddExercicesToBloc(exercises: ExerciseTemplate[]) {
    if (!pickerBlocId) return;
    updateBlocs((blocs) =>
      blocs.map((b) =>
        b.id !== pickerBlocId ? b : { ...b, exercices: [...b.exercices, ...exercises.map(newBlocExercice)] }
      )
    );
    setPickerBlocId(null);
    setReplaceExerciceId(null);
  }

  // Bouton principal : on ouvre la banque tout de suite, sans avoir à créer un
  // bloc à la main (il est créé s'il n'y en a pas encore).
  function handleQuickAdd() {
    setReplaceExerciceId(null);
    if (activeSeance.blocs.length === 0) {
      const b = newBloc();
      b.nom = "Bloc 1";
      b.couleur = BLOC_COLORS[0];
      updateBlocs(() => [b]);
      setPickerBlocId(b.id);
    } else {
      setPickerBlocId(activeSeance.blocs[activeSeance.blocs.length - 1].id);
    }
  }

  function handleDuplicateExercice(blocId: string, exerciceId: string) {
    updateBlocs((blocs) =>
      blocs.map((b) => {
        if (b.id !== blocId) return b;
        const index = b.exercices.findIndex((ex) => ex.id === exerciceId);
        if (index < 0) return b;
        const [copy] = cloneExercices([b.exercices[index]]);
        const exercices = [...b.exercices];
        exercices.splice(index + 1, 0, copy);
        return { ...b, exercices };
      })
    );
  }

  function handleMoveExercice(blocId: string, exerciceId: string, direction: -1 | 1) {
    updateBlocs((blocs) =>
      blocs.map((b) => {
        if (b.id !== blocId) return b;
        const index = b.exercices.findIndex((ex) => ex.id === exerciceId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= b.exercices.length) return b;
        const exercices = [...b.exercices];
        [exercices[index], exercices[target]] = [exercices[target], exercices[index]];
        return { ...b, exercices };
      })
    );
  }

  function handleUpdateExercice(blocId: string, exerciceId: string, patch: Partial<BlocExercice>) {
    updateBlocs((blocs) =>
      blocs.map((b) =>
        b.id !== blocId
          ? b
          : { ...b, exercices: b.exercices.map((ex) => (ex.id === exerciceId ? { ...ex, ...patch } : ex)) }
      )
    );
  }

  function handleDeleteExercice(blocId: string, exerciceId: string) {
    updateBlocs((blocs) =>
      blocs.map((b) => (b.id !== blocId ? b : { ...b, exercices: b.exercices.filter((ex) => ex.id !== exerciceId) }))
    );
  }

  return (
    <View style={styles.container}>
      <PhotoBackground variant="programmes" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textOnDark} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <TextInput
  placeholderTextColor={Colors.textOnDarkSecondary}
            style={styles.programmeNomInput}
            value={programme.nom}
            onChangeText={(text) => setProgramme((prev) => (prev ? { ...prev, nom: text } : prev))}
            onBlur={() => persist(programme.seances, programme.nom)}
          />
          <Text style={styles.programmeSportifLabel}>
            {programme.sportifName ? `Pour ${programme.sportifName}` : "Non assigné à un sportif"}
          </Text>
        </View>
      </View>

      <View style={styles.seanceTabsWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.seanceTabs}
      >
        {programme.seances.map((s, i) => (
          <View
            key={s.id}
            style={[styles.seanceTab, activeSeance.id === s.id && styles.seanceTabActive]}
          >
            <TouchableOpacity
              onPress={() => handleMoveSeance(s.id, -1)}
              disabled={i === 0}
              hitSlop={6}
            >
              <Ionicons
                name="chevron-back"
                size={14}
                color={
                  i === 0
                    ? Colors.textOnDarkSecondary
                    : activeSeance.id === s.id
                    ? Colors.white
                    : Colors.textOnDark
                }
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveSeanceId(s.id)}>
              <Text style={[styles.seanceTabText, activeSeance.id === s.id && styles.seanceTabTextActive]}>
                {s.nom}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleMoveSeance(s.id, 1)}
              disabled={i === programme.seances.length - 1}
              hitSlop={6}
            >
              <Ionicons
                name="chevron-forward"
                size={14}
                color={
                  i === programme.seances.length - 1
                    ? Colors.textOnDarkSecondary
                    : activeSeance.id === s.id
                    ? Colors.white
                    : Colors.textOnDark
                }
              />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.seanceAddTab} onPress={handleAddSeance}>
          <Ionicons name="add" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </ScrollView>
      </View>

      <View style={styles.seanceHeaderRow}>
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={styles.seanceNomInput}
          value={activeSeance.nom}
          onChangeText={handleRenameSeance}
          placeholder="Nom de la séance"
        />
        <TouchableOpacity onPress={handleDuplicateSeance} hitSlop={8}>
          <Ionicons name="copy-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteSeance} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {activeSeance.blocs.reduce((n, b) => n + b.exercices.length, 0)} exercice
          {activeSeance.blocs.reduce((n, b) => n + b.exercices.length, 0) > 1 ? "s" : ""} ·{" "}
          {countSeanceSets(activeSeance)} séries
          {estimateSeanceMinutes(activeSeance) > 0 ? ` · ≈ ${estimateSeanceMinutes(activeSeance)} min` : ""}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeSeance.blocs.length === 0 && (
          <View style={styles.emptySeance}>
            <Ionicons name="barbell-outline" size={34} color={Colors.primary} />
            <Text style={styles.emptySeanceTitle}>Compose ta séance</Text>
            <Text style={styles.emptySeanceText}>
              Ouvre la banque d'exercices, filtre par muscle et coche tout ce que tu veux ajouter
              en une fois.
            </Text>
            <TouchableOpacity style={styles.emptySeanceButton} onPress={handleQuickAdd}>
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.emptySeanceButtonText}>Ajouter des exercices</Text>
            </TouchableOpacity>
          </View>
        )}

        <MuscleSelector selected={activeSeance.muscles ?? []} onToggle={handleToggleMuscle} />

        {activeSeance.blocs.map((bloc, index) => (
          <BlocCard
            key={bloc.id}
            bloc={bloc}
            library={library}
            isFirst={index === 0}
            isLast={index === activeSeance.blocs.length - 1}
            colorPickerOpen={colorPickerBlocId === bloc.id}
            onToggleColorPicker={() => setColorPickerBlocId((cur) => (cur === bloc.id ? null : bloc.id))}
            onSelectColor={(couleur) => {
              handleUpdateBloc(bloc.id, { couleur });
              setColorPickerBlocId(null);
            }}
            onUpdate={(patch) => handleUpdateBloc(bloc.id, patch)}
            onDelete={() => handleDeleteBloc(bloc.id)}
            onMoveUp={() => handleMoveBloc(bloc.id, -1)}
            onMoveDown={() => handleMoveBloc(bloc.id, 1)}
            onAddExercice={() => {
              setPickerBlocId(bloc.id);
              setReplaceExerciceId(null);
            }}
            onReplaceExercice={(exerciceId) => {
              setPickerBlocId(bloc.id);
              setReplaceExerciceId(exerciceId);
            }}
            onUpdateExercice={(exerciceId, patch) => handleUpdateExercice(bloc.id, exerciceId, patch)}
            onDeleteExercice={(exerciceId) => handleDeleteExercice(bloc.id, exerciceId)}
            onDuplicateExercice={(exerciceId) => handleDuplicateExercice(bloc.id, exerciceId)}
            onMoveExercice={(exerciceId, direction) => handleMoveExercice(bloc.id, exerciceId, direction)}
            onSaveAsProtocol={() => {
              setProtocolBlocId(bloc.id);
              setProtocolName(bloc.objectif || bloc.nom);
            }}
          />
        ))}

        <TouchableOpacity style={styles.addBlocButton} onPress={handleAddBloc}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addBlocButtonText}>Ajouter un bloc</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addBlocButton} onPress={() => setShowWarmupPicker(true)}>
          <Ionicons name="flame-outline" size={20} color={Colors.primary} />
          <Text style={styles.addBlocButtonText}>Insérer un protocole d'échauffement</Text>
        </TouchableOpacity>
      </ScrollView>

      <ExercisePickerModal
        visible={pickerBlocId !== null}
        coachId={coachId}
        onClose={() => {
          setPickerBlocId(null);
          setReplaceExerciceId(null);
        }}
        multiple={replaceExerciceId === null}
        onSelect={handleReplaceExercice}
        onSelectMany={handleAddExercicesToBloc}
      />

      <Modal
        visible={showWarmupPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowWarmupPicker(false)}
      >
        <View style={styles.protocolBackdrop}>
          <View style={styles.protocolCard}>
            <Text style={styles.protocolTitle}>Protocoles d'échauffement</Text>
            {warmups.length === 0 ? (
              <Text style={styles.protocolHint}>
                Aucun protocole pour l'instant. Construis un bloc d'échauffement, puis touche
                « Enregistrer comme protocole » en bas du bloc pour le réutiliser ici.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {warmups.map((w) => (
                  <View key={w.id} style={styles.protocolRow}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => handleInsertWarmup(w)}>
                      <Text style={styles.protocolName}>{w.nom}</Text>
                      <Text style={styles.protocolMeta}>
                        {w.exercices.length} exercice{w.exercices.length > 1 ? "s" : ""} · Insérer
                        en tête de séance
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDeleteWarmupId(w.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.protocolClose} onPress={() => setShowWarmupPicker(false)}>
              <Text style={styles.protocolCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={protocolBlocId !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setProtocolBlocId(null)}
      >
        <View style={styles.protocolBackdrop}>
          <View style={styles.protocolCard}>
            <Text style={styles.protocolTitle}>Enregistrer comme protocole</Text>
            <TextInput
              style={styles.protocolInput}
              value={protocolName}
              onChangeText={setProtocolName}
              placeholder="Nom du protocole (ex. Échauffement bas du corps)"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.protocolSave, !protocolName.trim() && styles.protocolSaveDisabled]}
              onPress={handleSaveProtocol}
              disabled={!protocolName.trim()}
            >
              <Text style={styles.protocolSaveText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.protocolClose} onPress={() => setProtocolBlocId(null)}>
              <Text style={styles.protocolCloseText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={deleteWarmupId !== null}
        title="Supprimer ce protocole"
        message="Les blocs déjà insérés dans des séances ne sont pas modifiés."
        confirmLabel="Supprimer"
        destructive
        onConfirm={confirmDeleteWarmup}
        onCancel={() => setDeleteWarmupId(null)}
      />

      <ConfirmModal
        visible={deleteSeanceConfirm}
        title="Supprimer la séance"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        onConfirm={confirmDeleteSeance}
        onCancel={() => setDeleteSeanceConfirm(false)}
      />

      <ConfirmModal
        visible={deleteBlocId !== null}
        title="Supprimer ce bloc"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        destructive
        onConfirm={confirmDeleteBloc}
        onCancel={() => setDeleteBlocId(null)}
      />
    </View>
  );
}

function BlocCard({
  bloc,
  library,
  isFirst,
  isLast,
  colorPickerOpen,
  onToggleColorPicker,
  onSelectColor,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddExercice,
  onReplaceExercice,
  onUpdateExercice,
  onDeleteExercice,
  onDuplicateExercice,
  onMoveExercice,
  onSaveAsProtocol,
}: {
  bloc: Bloc;
  library: ExerciseTemplate[];
  isFirst: boolean;
  isLast: boolean;
  colorPickerOpen: boolean;
  onToggleColorPicker: () => void;
  onSelectColor: (couleur: string) => void;
  onUpdate: (patch: Partial<Bloc>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddExercice: () => void;
  onReplaceExercice: (exerciceId: string) => void;
  onUpdateExercice: (exerciceId: string, patch: Partial<BlocExercice>) => void;
  onDeleteExercice: (exerciceId: string) => void;
  onDuplicateExercice: (exerciceId: string) => void;
  onMoveExercice: (exerciceId: string, direction: -1 | 1) => void;
  onSaveAsProtocol: () => void;
}) {
  const [nomDraft, setNomDraft] = useState(bloc.nom);
  const [objectifDraft, setObjectifDraft] = useState(bloc.objectif);

  return (
    <View style={[styles.blocCard, { borderLeftColor: bloc.couleur }]}>
      <View style={styles.blocHeaderRow}>
        <TouchableOpacity style={[styles.colorDot, { backgroundColor: bloc.couleur }]} onPress={onToggleColorPicker} />
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={styles.blocNomInput}
          value={nomDraft}
          onChangeText={setNomDraft}
          onBlur={() => onUpdate({ nom: nomDraft })}
        />
        <TouchableOpacity onPress={onMoveUp} disabled={isFirst}>
          <Ionicons name="chevron-up" size={18} color={isFirst ? Colors.grayMedium : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onMoveDown} disabled={isLast}>
          <Ionicons name="chevron-down" size={18} color={isLast ? Colors.grayMedium : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {colorPickerOpen && (
        <View style={styles.colorRow}>
          {BLOC_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorSwatch, { backgroundColor: c }, c === bloc.couleur && styles.colorSwatchActive]}
              onPress={() => onSelectColor(c)}
            />
          ))}
        </View>
      )}

      <TextInput
  placeholderTextColor={Colors.textSecondary}
        style={styles.objectifInput}
        placeholder="Objectif du bloc (ex: Force maximale)"
        value={objectifDraft}
        onChangeText={setObjectifDraft}
        onBlur={() => onUpdate({ objectif: objectifDraft })}
      />

      <View style={styles.modeRow}>
        {BLOC_MODES.map((m) => {
          const active = (bloc.mode ?? "serie") === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeChip, active && styles.modeChipActive]}
              onPress={() => onUpdate({ mode: m.key })}
            >
              <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {blocModeWarning(bloc) && <Text style={styles.modeWarning}>{blocModeWarning(bloc)}</Text>}

      {bloc.exercices.map((ex, i) => (
        <ExerciceCard
          key={ex.id}
          exercice={ex}
          library={library}
          isFirst={i === 0}
          isLast={i === bloc.exercices.length - 1}
          onChangeExercise={() => onReplaceExercice(ex.id)}
          onUpdate={(patch) => onUpdateExercice(ex.id, patch)}
          onDelete={() => onDeleteExercice(ex.id)}
          onDuplicate={() => onDuplicateExercice(ex.id)}
          onMove={(direction) => onMoveExercice(ex.id, direction)}
        />
      ))}

      <TouchableOpacity style={styles.addExerciceButton} onPress={onAddExercice}>
        <Ionicons name="add" size={16} color={Colors.primary} />
        <Text style={styles.addExerciceButtonText}>Ajouter des exercices</Text>
      </TouchableOpacity>

      {bloc.exercices.length > 0 && (
        <TouchableOpacity style={styles.saveProtocolButton} onPress={onSaveAsProtocol}>
          <Ionicons name="bookmark-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.saveProtocolText}>Enregistrer comme protocole d'échauffement</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Champ numérique avec − / + : un tap pour ajuster, ou on tape la valeur.
// Les valeurs non numériques ("8-10", "30m") restent saisissables à la main ;
// − / + repartent alors du pas.
function QuickStepper({
  label,
  value,
  step = 1,
  min = 0,
  max = 999,
  suffix,
  onChange,
  onCommit,
}: {
  label: string;
  value: string;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  // onChange : valeur locale (à chaque frappe) ; onCommit : enregistrement
  // (à la fin de la saisie ou au tap sur − / +), pour ne pas écrire dans
  // Firestore à chaque touche.
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
}) {
  const current = parseFloat(value.replace(",", "."));
  const base = Number.isFinite(current) ? current : 0;
  function bump(direction: -1 | 1) {
    const next = Math.min(max, Math.max(min, base + direction * step));
    const text = String(Math.round(next * 100) / 100);
    onChange(text);
    onCommit(text);
  }
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity style={styles.stepperButton} onPress={() => bump(-1)} hitSlop={4}>
          <Ionicons name="remove" size={16} color={Colors.text} />
        </TouchableOpacity>
        <TextInput
          style={styles.stepperInput}
          value={value}
          onChangeText={onChange}
          onBlur={() => onCommit(value)}
          keyboardType="numbers-and-punctuation"
          selectTextOnFocus
        />
        <TouchableOpacity style={styles.stepperButton} onPress={() => bump(1)} hitSlop={4}>
          <Ionicons name="add" size={16} color={Colors.text} />
        </TouchableOpacity>
      </View>
      {suffix ? <Text style={styles.stepperSuffix}>{suffix}</Text> : null}
    </View>
  );
}

function ExerciceCard({
  exercice,
  library,
  isFirst,
  isLast,
  onChangeExercise,
  onUpdate,
  onDelete,
  onDuplicate,
  onMove,
}: {
  exercice: BlocExercice;
  library: ExerciseTemplate[];
  isFirst: boolean;
  isLast: boolean;
  onChangeExercise: () => void;
  onUpdate: (patch: Partial<BlocExercice>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const [series, setSeries] = useState(exercice.series);
  const [repetitions, setRepetitions] = useState(exercice.repetitions);
  const [tempo, setTempo] = useState(exercice.tempo);
  const [chargeValeur, setChargeValeur] = useState(exercice.chargeValeur);
  const [poidsIndicatif, setPoidsIndicatif] = useState(exercice.poidsIndicatif ?? "");
  const [reposSeries, setReposSeries] = useState(exercice.reposSeries);
  const [reposRepetitions, setReposRepetitions] = useState(exercice.reposRepetitions);
  const [commentaires, setCommentaires] = useState(exercice.commentaires);
  const [showVideo, setShowVideo] = useState(false);
  const [showImage, setShowImage] = useState(false);
  // Replié par défaut : la ligne de réglages rapides suffit dans 90 % des cas.
  const [expanded, setExpanded] = useState(false);

  const libraryExercise = library.find((e) => e.id === exercice.exerciceId);
  const hasMedia = !!(libraryExercise?.videoUrl || libraryExercise?.photoUrl);

  // Desktop : deux colonnes côte à côte (paramètres d'effort à gauche, gros
  // visuel à droite) pour garder l'image grande ET les paramètres visibles en
  // même temps. En dessous de 1024px, tout se réempile en une colonne.
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 1024;
  const bannerHeight = isDesktop ? 460 : windowWidth >= 768 ? 340 : 200;

  function openMedia() {
    if (libraryExercise?.videoUrl) setShowVideo(true);
    else if (libraryExercise?.photoUrl) setShowImage(true);
  }

  const imageBlock = (
    <TouchableOpacity
      style={[styles.exerciceBanner, { height: bannerHeight }]}
      onPress={openMedia}
      activeOpacity={hasMedia ? 0.85 : 1}
    >
      {libraryExercise?.videoUrl ? (
        <InlineLoopingVideo videoUrl={libraryExercise.videoUrl} width="100%" height={bannerHeight} borderRadius={16} />
      ) : libraryExercise?.photoUrl ? (
        <Image source={{ uri: libraryExercise.photoUrl }} style={styles.exerciceBannerMedia} resizeMode="contain" />
      ) : (
        <View style={styles.exerciceBannerIllustration}>
          <MovementIllustration pattern={libraryExercise?.pattern ?? "isolation"} size={Math.min(bannerHeight * 0.4, 160)} />
        </View>
      )}
      {libraryExercise?.videoUrl && (
        <View style={styles.exerciceBannerPlay}>
          <Ionicons name="play" size={20} color={Colors.white} />
        </View>
      )}
      {hasMedia && (
        <View style={styles.exerciceBannerExpand}>
          <Ionicons name="expand-outline" size={16} color={Colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );

  const paramsCard = (
    <View style={styles.paramsCard}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>Séries × répétitions</Text>
        <TouchableOpacity
          onPress={() => showInfo("Séries × répétitions", "5 × 5 signifie 5 séries de 5 répétitions.")}
        >
          <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.setsRepsRow}>
        <TextInput
          placeholderTextColor={Colors.textSecondary}
          style={styles.setsRepsInput}
          value={series}
          onChangeText={setSeries}
          onBlur={() => onUpdate({ series })}
          keyboardType="numeric"
        />
        <Text style={styles.setsRepsX}>×</Text>
        <TextInput
          placeholderTextColor={Colors.textSecondary}
          style={styles.setsRepsInput}
          value={repetitions}
          onChangeText={setRepetitions}
          onBlur={() => onUpdate({ repetitions })}
        />
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>Tempo</Text>
        <TouchableOpacity
          onPress={() =>
            showInfo(
              "Tempo",
              "Format : Excentrique / Pause bas / Concentrique / Pause haut.\n\nExemple : 2/0/1/3\n• 2 : descente en 2s (excentrique)\n• 0 : pas de pause en bas\n• 1 : remontée en 1s (concentrique)\n• 3 : pause de 3s en haut\n\nNotation : \" = secondes, ' = minutes"
            )
          }
        >
          <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <TextInput
        placeholderTextColor={Colors.textSecondary}
        style={styles.input}
        value={tempo}
        onChangeText={setTempo}
        onBlur={() => onUpdate({ tempo })}
        placeholder="2/0/1/2"
      />

      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>Charge</Text>
        <TouchableOpacity
          onPress={() =>
            showInfo(
              "RPE",
              "Le RPE représente la difficulté ressentie.\n\nRPE 10 : aucune répétition supplémentaire possible.\nRPE 9 : ~1 répétition restante.\nRPE 8 : ~2 répétitions restantes.\nRPE 7 : ~3 répétitions restantes."
            )
          }
        >
          <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.chargeTypeRow}>
        {(["1rm", "rpe"] as ChargeType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chargeTypeChip, exercice.chargeType === type && styles.chargeTypeChipActive]}
            onPress={() => onUpdate({ chargeType: type })}
          >
            <Text
              style={[
                styles.chargeTypeChipText,
                exercice.chargeType === type && styles.chargeTypeChipTextActive,
              ]}
            >
              {CHARGE_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* La charge en RPE conditionne directement l'intensité de la séance :
          on lui donne le traitement visuel le plus marqué de la carte. */}
      <TextInput
        placeholderTextColor={Colors.textSecondary}
        style={[
          styles.chargeValeurInput,
          exercice.chargeType === "rpe" && styles.chargeValeurInputRpe,
        ]}
        value={chargeValeur}
        onChangeText={setChargeValeur}
        onBlur={() => onUpdate({ chargeValeur })}
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>Poids indicatif (kg)</Text>
      <TextInput
        placeholderTextColor={Colors.textSecondary}
        style={styles.input}
        value={poidsIndicatif}
        onChangeText={setPoidsIndicatif}
        onBlur={() => onUpdate({ poidsIndicatif })}
        keyboardType="numeric"
        placeholder="Ex: 60"
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Repos séries</Text>
          <TextInput
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            value={reposSeries}
            onChangeText={setReposSeries}
            onBlur={() => onUpdate({ reposSeries })}
            placeholder="3'"
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Repos répétitions</Text>
            <TouchableOpacity
              onPress={() =>
                showInfo(
                  "Repos",
                  "R = repos entre les séries\nr = repos entre les répétitions (utile pour le sprint, les intervalles...)\n\nExemple : 6 × 30m, r = 20\", R = 3'"
                )
              }
            >
              <Ionicons name="information-circle-outline" size={15} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <TextInput
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
            value={reposRepetitions}
            onChangeText={setReposRepetitions}
            onBlur={() => onUpdate({ reposRepetitions })}
            placeholder="0&quot;"
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>Commentaires</Text>
      <TextInput
        placeholderTextColor={Colors.textSecondary}
        style={[styles.input, styles.commentInput]}
        value={commentaires}
        onChangeText={setCommentaires}
        onBlur={() => onUpdate({ commentaires })}
        placeholder="Notes pour le sportif..."
        multiline
      />
    </View>
  );

  const chargeIsRpe = exercice.chargeType === "rpe";
  const thumb = libraryExercise?.photoUrl ? (
    <Image source={{ uri: libraryExercise.photoUrl }} style={styles.exThumb} />
  ) : (
    <MovementIllustration pattern={libraryExercise?.pattern ?? "isolation"} size={52} />
  );

  return (
    <View style={styles.exerciceCard}>
      <View style={styles.exHeader}>
        <TouchableOpacity onPress={hasMedia ? openMedia : () => setExpanded((v) => !v)}>{thumb}</TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setExpanded((v) => !v)}>
          <Text style={styles.exerciceName} numberOfLines={2}>
            {exercice.exerciceNom}
          </Text>
          <Text style={styles.exSummary} numberOfLines={1}>
            {[
              libraryExercise?.groupesMusculaires.join(" · "),
              exercice.poidsIndicatif ? `${exercice.poidsIndicatif} kg` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMove(-1)} disabled={isFirst} hitSlop={6}>
          <Ionicons name="chevron-up" size={18} color={isFirst ? Colors.grayMedium : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onMove(1)} disabled={isLast} hitSlop={6}>
          <Ionicons name="chevron-down" size={18} color={isLast ? Colors.grayMedium : Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onChangeExercise} hitSlop={6}>
          <Ionicons name="swap-horizontal" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDuplicate} hitSlop={6}>
          <Ionicons name="copy-outline" size={17} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} hitSlop={6}>
          <Ionicons name="close" size={19} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickRow}>
        <QuickStepper
          label="SÉRIES"
          value={series}
          min={1}
          max={20}
          onChange={setSeries}
          onCommit={(v) => onUpdate({ series: v })}
        />
        <QuickStepper
          label="RÉPÉTITIONS"
          value={repetitions}
          min={1}
          max={100}
          onChange={setRepetitions}
          onCommit={(v) => onUpdate({ repetitions: v })}
        />
        <View style={styles.stepper}>
          <View style={styles.chargeSwitch}>
            {(["rpe", "1rm"] as ChargeType[]).map((type) => (
              <TouchableOpacity key={type} onPress={() => onUpdate({ chargeType: type })} hitSlop={4}>
                <Text style={[styles.chargeSwitchText, exercice.chargeType === type && styles.chargeSwitchTextOn]}>
                  {CHARGE_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              hitSlop={4}
              onPress={() => {
                const cur = parseFloat(chargeValeur.replace(",", ".")) || 0;
                const next = String(Math.max(0, cur - (chargeIsRpe ? 0.5 : 5)));
                setChargeValeur(next);
                onUpdate({ chargeValeur: next });
              }}
            >
              <Ionicons name="remove" size={16} color={Colors.text} />
            </TouchableOpacity>
            <TextInput
              style={[styles.stepperInput, chargeIsRpe && styles.stepperInputRpe]}
              value={chargeValeur}
              onChangeText={setChargeValeur}
              onBlur={() => onUpdate({ chargeValeur })}
              keyboardType="numbers-and-punctuation"
              selectTextOnFocus
            />
            <TouchableOpacity
              style={styles.stepperButton}
              hitSlop={4}
              onPress={() => {
                const cur = parseFloat(chargeValeur.replace(",", ".")) || 0;
                const next = String(Math.min(chargeIsRpe ? 10 : 150, cur + (chargeIsRpe ? 0.5 : 5)));
                setChargeValeur(next);
                onUpdate({ chargeValeur: next });
              }}
            >
              <Ionicons name="add" size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.stepper}>
          <Text style={styles.stepperLabel}>REPOS</Text>
          <TextInput
            style={[styles.stepperInput, styles.restInput]}
            value={reposSeries}
            onChangeText={setReposSeries}
            onBlur={() => onUpdate({ reposSeries })}
            placeholder="2'"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.detailsToggle} onPress={() => setExpanded((v) => !v)}>
        <Text style={styles.detailsToggleText}>
          {expanded ? "Masquer les réglages" : "Tempo, poids indicatif, notes, visuel…"}
        </Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.textSecondary} />
      </TouchableOpacity>

      {expanded &&
        (isDesktop ? (
          <View style={styles.desktopRow}>
            <View style={styles.desktopParamsCol}>{paramsCard}</View>
            <View style={styles.desktopVisualCol}>{imageBlock}</View>
          </View>
        ) : (
          <>
            {imageBlock}
            {paramsCard}
          </>
        ))}

      <VideoPreviewModal
        visible={showVideo}
        videoUrl={libraryExercise?.videoUrl ?? null}
        onClose={() => setShowVideo(false)}
      />
      <ImagePreviewModal
        visible={showImage}
        imageUrl={libraryExercise?.photoUrl ?? null}
        onClose={() => setShowImage(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 12,
  },

  programmeNomInput: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textOnDark,
  },

  programmeSportifLabel: {
    fontSize: 12,
    color: Colors.textOnDarkSecondary,
    marginTop: 2,
  },

  seanceTabsWrapper: {
    height: 44,
    marginBottom: 8,
  },

  seanceTabs: {
    paddingHorizontal: 20,
    alignItems: "center",
  },

  seanceTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    marginRight: 8,
  },

  seanceTabActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },

  seanceTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textOnDark,
  },

  seanceTabTextActive: {
    color: Colors.white,
  },

  seanceAddTab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  seanceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  seanceNomInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },

  blocCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  blocHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  colorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  colorSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },

  colorSwatchActive: {
    borderWidth: 2,
    borderColor: Colors.text,
  },

  saveProtocolButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },

  saveProtocolText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  protocolBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  protocolCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
  },

  protocolTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },

  protocolHint: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
    marginBottom: 8,
  },

  protocolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },

  protocolName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },

  protocolMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  protocolInput: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },

  protocolSave: {
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  protocolSaveDisabled: {
    backgroundColor: Colors.grayMedium,
  },

  protocolSaveText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  protocolClose: {
    height: 44,
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  protocolCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },

  modeChip: {
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  modeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  modeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  modeChipTextActive: {
    color: Colors.white,
  },

  modeWarning: {
    fontSize: 12,
    color: Colors.riskMedium,
    marginBottom: 10,
  },

  blocNomInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },

  objectifInput: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },

  statsRow: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  statsText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  emptySeance: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    backgroundColor: Colors.surface,
  },
  emptySeanceTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  emptySeanceText: {
    fontSize: 13,
    textAlign: "center",
    color: Colors.textSecondary,
    maxWidth: 360,
  },
  emptySeanceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  emptySeanceButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },
  exHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  exThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  exSummary: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  stepper: {
    flexGrow: 1,
    flexBasis: 120,
    gap: 4,
  },
  stepperLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepperButton: {
    width: 32,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperInput: {
    flex: 1,
    minWidth: 40,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  stepperInputRpe: {
    color: Colors.primary,
  },
  restInput: {
    flex: 0,
    width: "100%",
  },
  stepperSuffix: {
    fontSize: 10.5,
    color: Colors.textSecondary,
  },
  chargeSwitch: {
    flexDirection: "row",
    gap: 10,
  },
  chargeSwitchText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  chargeSwitchTextOn: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  detailsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    marginBottom: 2,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  exerciceCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Desktop : paramètres à gauche (~34%) et visuel (nom + image + détails) à
  // droite (~66%), pour garder la photo grande sans jamais la sacrifier au
  // profit des champs de séries/charge/repos.
  desktopRow: {
    flexDirection: "row",
    gap: 20,
    alignItems: "flex-start",
  },

  desktopParamsCol: {
    width: "34%",
  },

  desktopVisualCol: {
    flex: 1,
  },

  paramsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },

  exerciceBanner: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    // Fond sombre cohérent avec le thème plutôt qu'une carte blanche isolée —
    // les photos gardent leur propre fond blanc (généré), mais la marge
    // sombre autour évite que ça tranche trop fort sur le reste de l'écran.
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },

  exerciceBannerExpand: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(17,17,17,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Les photos générées ont un fond blanc figé dans l'image — en plein cadre
  // sur une carte sombre, ça tranchait trop fort. Un léger cadre + coins
  // arrondis sur la photo elle-même la fait lire comme une carte posée sur
  // le fond anthracite plutôt qu'un bloc blanc qui casse le thème.
  exerciceBannerMedia: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },

  exerciceBannerIllustration: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  exerciceBannerPlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(17,17,17,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  exerciceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  exerciceNameButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  exerciceName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  setsRepsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },

  setsRepsInput: {
    width: 64,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },

  setsRepsX: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textSecondary,
  },

  input: {
    color: Colors.text,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 14,
  },

  commentInput: {
    color: Colors.text,
    height: 60,
    textAlignVertical: "top",
    paddingTop: 10,
  },

  chargeTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  chargeTypeChip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: "center",
  },

  chargeTypeChipActive: {
    backgroundColor: Colors.primary,
  },

  chargeTypeChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  chargeTypeChipTextActive: {
    color: Colors.white,
  },

  chargeValeurInput: {
    width: "100%",
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },

  // RPE = donnée de programmation la plus consultée en séance : traitement
  // visuel nettement plus marqué que les autres champs de la carte.
  chargeValeurInputRpe: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.accentTint,
    borderWidth: 1,
    borderColor: Colors.primary,
    fontSize: 24,
    fontWeight: "800",
    color: Colors.primary,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },


  addExerciceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },

  addExerciceButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  addBlocButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    marginBottom: 20,
  },

  addBlocButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
});
