import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AccessDenied } from "../../../components/access-denied";
import ConfirmModal from "../../../components/confirm-modal";
import ExercisePickerModal from "../../../components/exercise-picker-modal";
import { MovementIllustration } from "../../../components/exercise-illustrations";
import InlineLoopingVideo from "../../../components/inline-looping-video";
import VideoPreviewModal from "../../../components/video-preview-modal";
import { Colors } from "../../../constants/colors";
import { BLOC_COLORS, EXERCISE_LIBRARY, ExerciseTemplate } from "../../../constants/exercise-library";
import { auth } from "../../../firebase";
import { usePrincipalAccess } from "../../../hooks/use-principal-access";
import {
  Bloc,
  BlocExercice,
  ChargeType,
  getProgramme,
  newBloc,
  newBlocExercice,
  newSeance,
  Programme,
  saveProgramme,
  Seance,
} from "../../../services/programmes";
import { getExerciseLibrary } from "../../../services/exercises";
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
  const [activeSeanceId, setActiveSeanceId] = useState<string | null>(null);
  const [pickerBlocId, setPickerBlocId] = useState<string | null>(null);
  const [replaceExerciceId, setReplaceExerciceId] = useState<string | null>(null);
  const [colorPickerBlocId, setColorPickerBlocId] = useState<string | null>(null);
  const [deleteSeanceConfirm, setDeleteSeanceConfirm] = useState(false);
  const [deleteBlocId, setDeleteBlocId] = useState<string | null>(null);
  const [library, setLibrary] = useState<ExerciseTemplate[]>(EXERCISE_LIBRARY);

  useEffect(() => {
    if (!id) return;
    getProgramme(id).then((p) => {
      setProgramme(p);
      if (p) setActiveSeanceId(p.seances[0]?.id ?? null);
    });
  }, [id]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getExerciseLibrary(uid).then(setLibrary);
  }, []);

  const isPrincipal = usePrincipalAccess(programme?.sportifId ?? undefined);

  if (!programme) {
    return <View style={styles.container} />;
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

  function handleAddExerciceToBloc(exercise: ExerciseTemplate) {
    if (!pickerBlocId) return;
    updateBlocs((blocs) =>
      blocs.map((b) => {
        if (b.id !== pickerBlocId) return b;
        if (replaceExerciceId) {
          return {
            ...b,
            exercices: b.exercices.map((ex) =>
              ex.id === replaceExerciceId
                ? { ...ex, exerciceId: exercise.id, exerciceNom: exercise.nom, exerciceIcon: exercise.icon }
                : ex
            ),
          };
        }
        return { ...b, exercices: [...b.exercices, newBlocExercice(exercise)] };
      })
    );
    setPickerBlocId(null);
    setReplaceExerciceId(null);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <TextInput
  placeholderTextColor={Colors.textSecondary}
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seanceTabs}>
        {programme.seances.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.seanceTab, activeSeance.id === s.id && styles.seanceTabActive]}
            onPress={() => setActiveSeanceId(s.id)}
          >
            <Text style={[styles.seanceTabText, activeSeance.id === s.id && styles.seanceTabTextActive]}>
              {s.nom}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.seanceAddTab} onPress={handleAddSeance}>
          <Ionicons name="add" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.seanceHeaderRow}>
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={styles.seanceNomInput}
          value={activeSeance.nom}
          onChangeText={handleRenameSeance}
          placeholder="Nom de la séance"
        />
        <TouchableOpacity onPress={handleDeleteSeance}>
          <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          />
        ))}

        <TouchableOpacity style={styles.addBlocButton} onPress={handleAddBloc}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.addBlocButtonText}>Ajouter un bloc</Text>
        </TouchableOpacity>
      </ScrollView>

      <ExercisePickerModal
        visible={pickerBlocId !== null}
        coachId={coachId}
        onClose={() => {
          setPickerBlocId(null);
          setReplaceExerciceId(null);
        }}
        onSelect={handleAddExerciceToBloc}
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

      {bloc.exercices.map((ex) => (
        <ExerciceCard
          key={ex.id}
          exercice={ex}
          library={library}
          onChangeExercise={() => onReplaceExercice(ex.id)}
          onUpdate={(patch) => onUpdateExercice(ex.id, patch)}
          onDelete={() => onDeleteExercice(ex.id)}
        />
      ))}

      <TouchableOpacity style={styles.addExerciceButton} onPress={onAddExercice}>
        <Ionicons name="add" size={16} color={Colors.primary} />
        <Text style={styles.addExerciceButtonText}>Ajouter un exercice</Text>
      </TouchableOpacity>
    </View>
  );
}

function ExerciceCard({
  exercice,
  library,
  onChangeExercise,
  onUpdate,
  onDelete,
}: {
  exercice: BlocExercice;
  library: ExerciseTemplate[];
  onChangeExercise: () => void;
  onUpdate: (patch: Partial<BlocExercice>) => void;
  onDelete: () => void;
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

  const libraryExercise = library.find((e) => e.id === exercice.exerciceId);

  return (
    <View style={styles.exerciceCard}>
      <TouchableOpacity
        style={styles.exerciceBanner}
        onPress={() => libraryExercise?.videoUrl && setShowVideo(true)}
        activeOpacity={libraryExercise?.videoUrl ? 0.85 : 1}
      >
        {libraryExercise?.videoUrl ? (
          <InlineLoopingVideo videoUrl={libraryExercise.videoUrl} width="100%" height={180} borderRadius={16} />
        ) : libraryExercise?.photoUrl ? (
          <Image source={{ uri: libraryExercise.photoUrl }} style={styles.exerciceBannerMedia} resizeMode="contain" />
        ) : (
          <View style={styles.exerciceBannerIllustration}>
            <MovementIllustration pattern={libraryExercise?.pattern ?? "isolation"} size={100} />
          </View>
        )}
        {libraryExercise?.videoUrl && (
          <View style={styles.exerciceBannerPlay}>
            <Ionicons name="play" size={20} color={Colors.white} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.exerciceHeaderRow}>
        <TouchableOpacity style={styles.exerciceNameButton} onPress={onChangeExercise}>
          <Text style={styles.exerciceName}>{exercice.exerciceNom}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete}>
          <Ionicons name="close" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

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
  placeholderTextColor={Colors.textSecondary} style={styles.input} value={tempo} onChangeText={setTempo} onBlur={() => onUpdate({ tempo })} placeholder="2/0/1/2" />

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
        <TextInput
  placeholderTextColor={Colors.textSecondary}
          style={styles.chargeValeurInput}
          value={chargeValeur}
          onChangeText={setChargeValeur}
          onBlur={() => onUpdate({ chargeValeur })}
          keyboardType="numeric"
        />
      </View>

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

      <VideoPreviewModal
        visible={showVideo}
        videoUrl={libraryExercise?.videoUrl ?? null}
        onClose={() => setShowVideo(false)}
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
    color: Colors.text,
  },

  programmeSportifLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  seanceTabs: {
    height: 44,
    paddingHorizontal: 20,
    marginBottom: 8,
    flexGrow: 0,
  },

  seanceTab: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    marginRight: 8,
  },

  seanceTabActive: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.text,
  },

  seanceTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
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

  exerciceCard: {
    backgroundColor: Colors.grayLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  exerciceBanner: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: Colors.surface,
  },

  exerciceBannerMedia: {
    width: "100%",
    height: "100%",
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
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.surface,
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
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
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
