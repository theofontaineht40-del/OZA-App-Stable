import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

import { Colors } from "../constants/colors";
import {
  ExerciseTemplate,
  GROUPES_MUSCULAIRES,
  GroupeMusculaire,
  MATERIELS,
  Materiel,
  QUALITES_PHYSIQUES,
  QualitePhysique,
  SPORTS,
  Sport,
} from "../constants/exercise-library";
import { MovementIllustration } from "./exercise-illustrations";
import InlineLoopingVideo from "./inline-looping-video";
import {
  addCustomExercise,
  getExerciseLibrary,
  uploadExercisePhoto,
  uploadExerciseVideo,
} from "../services/exercises";
import { getFavoriteIds, getRecentIds, rememberUsed, saveFavoriteIds } from "../services/exercise-prefs";

type Props = {
  visible: boolean;
  coachId: string;
  onClose: () => void;
  // Mode simple : un tap choisit l'exercice et ferme (remplacer, 1RM...).
  onSelect: (exercise: ExerciseTemplate) => void;
  // Mode multiple : on coche plusieurs exercices, puis un seul bouton les
  // ajoute tous (dans l'ordre où ils ont été cochés).
  multiple?: boolean;
  onSelectMany?: (exercises: ExerciseTemplate[]) => void;
};

// Recherche insensible aux accents et à la casse : "epaules" trouve "Épaules".
function norm(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function ExercisePickerModal({
  visible,
  coachId,
  onClose,
  onSelect,
  multiple = false,
  onSelectMany,
}: Props) {
  const [library, setLibrary] = useState<ExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGroupe, setFilterGroupe] = useState<GroupeMusculaire | null>(null);
  const [filterMateriels, setFilterMateriels] = useState<Materiel[]>([]);
  const [filterQualites, setFilterQualites] = useState<QualitePhysique[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [picked, setPicked] = useState<ExerciseTemplate[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const thumbSize = windowWidth >= 1024 ? 84 : windowWidth >= 768 ? 72 : 56;
  // Grand écran : les muscles passent dans une colonne à gauche, la liste à droite.
  const twoPanes = windowWidth >= 900;

  const [nom, setNom] = useState("");
  const [groupesMusculaires, setGroupesMusculaires] = useState<GroupeMusculaire[]>([]);
  const [materiel, setMateriel] = useState<Materiel[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [qualitesPhysiques, setQualitesPhysiques] = useState<QualitePhysique[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getExerciseLibrary(coachId).then((data) => {
      setLibrary(data);
      setLoading(false);
    });
    getFavoriteIds().then(setFavoriteIds);
    getRecentIds().then(setRecentIds);
  }, [visible, coachId]);

  function toggleFavorite(id: string) {
    setFavoriteIds((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      saveFavoriteIds(next);
      return next;
    });
  }

  function togglePicked(exercise: ExerciseTemplate) {
    setPicked((prev) =>
      prev.some((e) => e.id === exercise.id) ? prev.filter((e) => e.id !== exercise.id) : [...prev, exercise]
    );
  }

  function handleTap(exercise: ExerciseTemplate) {
    if (multiple) togglePicked(exercise);
    else handleSelect(exercise);
  }

  function handleConfirmMany() {
    if (picked.length === 0) return;
    const chosen = picked;
    rememberUsed(chosen.map((e) => e.id)).then(setRecentIds);
    resetForm();
    onSelectMany?.(chosen);
  }

  function resetForm() {
    setShowCreateForm(false);
    setNom("");
    setGroupesMusculaires([]);
    setMateriel([]);
    setSports([]);
    setQualitesPhysiques([]);
    setPhotoUri(null);
    setVideoUri(null);
    setSearch("");
    setFilterGroupe(null);
    setFilterMateriels([]);
    setFilterQualites([]);
    setOnlyFavorites(false);
    setShowMoreFilters(false);
    setPicked([]);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSelect(exercise: ExerciseTemplate) {
    rememberUsed([exercise.id]).then(setRecentIds);
    resetForm();
    onSelect(exercise);
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
  }

  async function handlePickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], quality: 0.7 });
    if (result.canceled) return;
    setVideoUri(result.assets[0].uri);
  }

  async function handleCreateExercise() {
    if (!nom.trim()) return;
    setSaving(true);
    try {
      let photoUrl: string | null = null;
      let videoUrl: string | null = null;
      const tempId = `custom_${Date.now()}`;
      if (photoUri) {
        photoUrl = await uploadExercisePhoto(coachId, tempId, photoUri);
      }
      if (videoUri) {
        videoUrl = await uploadExerciseVideo(coachId, tempId, videoUri);
      }
      const id = await addCustomExercise(coachId, {
        nom: nom.trim(),
        groupesMusculaires,
        materiel,
        sports,
        qualitesPhysiques,
        photoUrl,
        videoUrl,
      });
      const created: ExerciseTemplate = {
        id,
        nom: nom.trim(),
        groupesMusculaires,
        materiel,
        sports,
        qualitesPhysiques,
        icon: "barbell-outline",
        photoUrl,
        videoUrl,
        custom: true,
      };
      if (multiple) {
        // On reste dans le sélecteur : l'exercice créé rejoint la sélection.
        setLibrary((prev) => [...prev, created]);
        setPicked((prev) => [...prev, created]);
        setShowCreateForm(false);
        setNom("");
        setGroupesMusculaires([]);
        setMateriel([]);
        setSports([]);
        setQualitesPhysiques([]);
        setPhotoUri(null);
        setVideoUri(null);
      } else {
        handleSelect(created);
      }
    } finally {
      setSaving(false);
    }
  }

  // Les compteurs par muscle tiennent compte de tout SAUF du muscle choisi :
  // on voit tout de suite combien d'exercices donnerait chaque muscle.
  const baseFiltered = useMemo(() => {
    const tokens = norm(search).split(/\s+/).filter(Boolean);
    return library.filter((ex) => {
      if (tokens.length > 0) {
        const haystack = norm([ex.nom, ...ex.groupesMusculaires, ...ex.materiel].join(" "));
        if (!tokens.every((t) => haystack.includes(t))) return false;
      }
      if (filterMateriels.length > 0 && !filterMateriels.some((m) => ex.materiel.includes(m))) return false;
      if (filterQualites.length > 0 && !filterQualites.some((q) => ex.qualitesPhysiques.includes(q))) return false;
      if (onlyFavorites && !favoriteIds.includes(ex.id)) return false;
      return true;
    });
  }, [library, search, filterMateriels, filterQualites, onlyFavorites, favoriteIds]);

  const muscleCounts = useMemo(() => {
    const counts: Partial<Record<GroupeMusculaire, number>> = {};
    for (const ex of baseFiltered) {
      for (const g of ex.groupesMusculaires) counts[g] = (counts[g] ?? 0) + 1;
    }
    return counts;
  }, [baseFiltered]);

  const filtered = useMemo(
    () => (filterGroupe ? baseFiltered.filter((ex) => ex.groupesMusculaires.includes(filterGroupe)) : baseFiltered),
    [baseFiltered, filterGroupe]
  );

  const noFilter =
    !search.trim() && !filterGroupe && filterMateriels.length === 0 && filterQualites.length === 0 && !onlyFavorites;
  const recents = useMemo(
    () =>
      noFilter
        ? (recentIds.map((id) => library.find((e) => e.id === id)).filter(Boolean) as ExerciseTemplate[]).slice(0, 8)
        : [],
    [noFilter, recentIds, library]
  );
  const activeExtraFilters = filterMateriels.length + filterQualites.length;

  const muscleOptions = GROUPES_MUSCULAIRES.filter((g) => (muscleCounts[g] ?? 0) > 0 || g === filterGroupe);

  function renderExerciseRow(ex: ExerciseTemplate) {
    const isPicked = picked.some((e) => e.id === ex.id);
    const isFav = favoriteIds.includes(ex.id);
    return (
      <TouchableOpacity
        key={ex.id}
        style={[styles.exerciseRow, isPicked && styles.exerciseRowPicked]}
        onPress={() => handleTap(ex)}
        activeOpacity={0.8}
      >
        {ex.videoUrl ? (
          <InlineLoopingVideo videoUrl={ex.videoUrl} size={thumbSize} borderRadius={12} />
        ) : ex.photoUrl ? (
          <Image source={{ uri: ex.photoUrl }} style={[styles.exerciseThumb, { width: thumbSize, height: thumbSize }]} />
        ) : (
          <MovementIllustration pattern={ex.pattern ?? "isolation"} size={thumbSize} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{ex.nom}</Text>
          <Text style={styles.exerciseTags} numberOfLines={1}>
            {[...ex.groupesMusculaires, ...ex.materiel].join(" · ")}
          </Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(ex.id)} hitSlop={10}>
          <Ionicons
            name={isFav ? "star" : "star-outline"}
            size={20}
            color={isFav ? Colors.riskMedium : Colors.textSecondary}
          />
        </TouchableOpacity>
        {multiple ? (
          <Ionicons
            name={isPicked ? "checkmark-circle" : "add-circle-outline"}
            size={26}
            color={isPicked ? Colors.primary : Colors.textSecondary}
          />
        ) : (
          <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  }

  const muscleList = (
    <>
      <TouchableOpacity
        style={[styles.muscleItem, !filterGroupe && styles.muscleItemActive]}
        onPress={() => setFilterGroupe(null)}
      >
        <Text style={[styles.muscleItemText, !filterGroupe && styles.muscleItemTextActive]}>Tous les muscles</Text>
        <Text style={[styles.muscleCount, !filterGroupe && styles.muscleItemTextActive]}>{baseFiltered.length}</Text>
      </TouchableOpacity>
      {muscleOptions.map((g) => (
        <TouchableOpacity
          key={g}
          style={[styles.muscleItem, filterGroupe === g && styles.muscleItemActive]}
          onPress={() => setFilterGroupe(filterGroupe === g ? null : g)}
        >
          <Text style={[styles.muscleItemText, filterGroupe === g && styles.muscleItemTextActive]}>{g}</Text>
          <Text style={[styles.muscleCount, filterGroupe === g && styles.muscleItemTextActive]}>
            {muscleCounts[g] ?? 0}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );

  const listPanel = loading ? (
    <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
  ) : (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {recents.length > 0 && (
        <View style={styles.recentsBlock}>
          <Text style={styles.sectionLabel}>RÉCENTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {recents.map((ex) => {
              const isPicked = picked.some((e) => e.id === ex.id);
              return (
                <TouchableOpacity
                  key={ex.id}
                  style={[styles.recentChip, isPicked && styles.recentChipPicked]}
                  onPress={() => handleTap(ex)}
                >
                  <Text style={[styles.recentChipText, isPicked && styles.filterChipTextActive]} numberOfLines={1}>
                    {ex.nom}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      <Text style={styles.sectionLabel}>
        {filterGroupe ? filterGroupe.toUpperCase() : "TOUS LES EXERCICES"} · {filtered.length}
      </Text>
      {filtered.map(renderExerciseRow)}
      {filtered.length === 0 && (
        <Text style={styles.emptyText}>
          Aucun exercice ne correspond à ces filtres.{"\n"}Tu peux le créer juste au-dessus.
        </Text>
      )}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {showCreateForm ? "Créer un exercice" : multiple ? "Ajouter des exercices" : "Choisir un exercice"}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showCreateForm ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Nom de l'exercice</Text>
            <TextInput
  placeholderTextColor={Colors.textSecondary} style={styles.input} placeholder="Ex: Squat bulgare" value={nom} onChangeText={setNom} />

            <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color={Colors.textSecondary} />
                  <Text style={styles.photoPickerText}>Ajouter une photo (optionnel)</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoPicker} onPress={handlePickVideo}>
              {videoUri ? (
                <View style={styles.videoPickedRow}>
                  <Ionicons name="videocam" size={22} color={Colors.primary} />
                  <Text style={styles.videoPickedText}>Vidéo sélectionnée</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="videocam-outline" size={24} color={Colors.textSecondary} />
                  <Text style={styles.photoPickerText}>Ajouter une vidéo (optionnel)</Text>
                </>
              )}
            </TouchableOpacity>

            <FilterChipGroup
              label="Groupes musculaires"
              options={GROUPES_MUSCULAIRES}
              selected={groupesMusculaires}
              onToggle={(v) => setGroupesMusculaires((prev) => toggle(prev, v))}
            />
            <FilterChipGroup
              label="Matériel"
              options={MATERIELS}
              selected={materiel}
              onToggle={(v) => setMateriel((prev) => toggle(prev, v))}
            />
            <FilterChipGroup
              label="Sport"
              options={SPORTS}
              selected={sports}
              onToggle={(v) => setSports((prev) => toggle(prev, v))}
            />
            <FilterChipGroup
              label="Qualité physique"
              options={QUALITES_PHYSIQUES}
              selected={qualitesPhysiques}
              onToggle={(v) => setQualitesPhysiques((prev) => toggle(prev, v))}
            />

            <TouchableOpacity
              style={[styles.primaryButton, !nom.trim() && styles.primaryButtonDisabled]}
              onPress={handleCreateExercise}
              disabled={!nom.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Créer et utiliser</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                placeholderTextColor={Colors.textSecondary}
                style={styles.searchInput}
                placeholder="Rechercher (nom, muscle, matériel…)"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.toolRow}>
              <TouchableOpacity
                style={[styles.toolChip, onlyFavorites && styles.filterChipActive]}
                onPress={() => setOnlyFavorites((v) => !v)}
              >
                <Ionicons name="star" size={13} color={onlyFavorites ? Colors.white : Colors.riskMedium} />
                <Text style={[styles.filterChipText, onlyFavorites && styles.filterChipTextActive]}>Favoris</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolChip, (showMoreFilters || activeExtraFilters > 0) && styles.toolChipOn]}
                onPress={() => setShowMoreFilters((v) => !v)}
              >
                <Ionicons name="options-outline" size={14} color={Colors.text} />
                <Text style={styles.filterChipText}>
                  Matériel & qualité{activeExtraFilters > 0 ? ` (${activeExtraFilters})` : ""}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolChip} onPress={() => setShowCreateForm(true)}>
                <Ionicons name="add-circle" size={15} color={Colors.primary} />
                <Text style={[styles.filterChipText, { color: Colors.primary }]}>Créer un exercice</Text>
              </TouchableOpacity>
            </View>

            {showMoreFilters && (
              <View style={styles.moreFilters}>
                <FilterChipGroup
                  label="Matériel"
                  options={MATERIELS}
                  selected={filterMateriels}
                  onToggle={(v) => setFilterMateriels((prev) => toggle(prev, v))}
                />
                <FilterChipGroup
                  label="Qualité physique"
                  options={QUALITES_PHYSIQUES}
                  selected={filterQualites}
                  onToggle={(v) => setFilterQualites((prev) => toggle(prev, v))}
                />
              </View>
            )}

            {twoPanes ? (
              <View style={styles.panes}>
                <ScrollView style={styles.sidebar} showsVerticalScrollIndicator={false}>
                  <Text style={styles.sectionLabel}>MUSCLE</Text>
                  {muscleList}
                </ScrollView>
                <View style={{ flex: 1 }}>{listPanel}</View>
              </View>
            ) : (
              <>
                <View style={styles.filterRowWrapper}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <TouchableOpacity
                      style={[styles.filterChip, !filterGroupe && styles.filterChipActive]}
                      onPress={() => setFilterGroupe(null)}
                    >
                      <Text style={[styles.filterChipText, !filterGroupe && styles.filterChipTextActive]}>
                        Tous · {baseFiltered.length}
                      </Text>
                    </TouchableOpacity>
                    {muscleOptions.map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.filterChip, filterGroupe === g && styles.filterChipActive]}
                        onPress={() => setFilterGroupe(filterGroupe === g ? null : g)}
                      >
                        <Text style={[styles.filterChipText, filterGroupe === g && styles.filterChipTextActive]}>
                          {g} · {muscleCounts[g] ?? 0}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                <View style={{ flex: 1 }}>{listPanel}</View>
              </>
            )}

            {multiple && (
              <View style={styles.pickBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickBarTitle}>
                    {picked.length === 0
                      ? "Touche les exercices à ajouter"
                      : `${picked.length} exercice${picked.length > 1 ? "s" : ""} sélectionné${picked.length > 1 ? "s" : ""}`}
                  </Text>
                  {picked.length > 0 && (
                    <Text style={styles.pickBarNames} numberOfLines={1}>
                      {picked.map((e) => e.nom).join(" · ")}
                    </Text>
                  )}
                </View>
                {picked.length > 0 && (
                  <TouchableOpacity onPress={() => setPicked([])} hitSlop={8}>
                    <Text style={styles.pickBarClear}>Vider</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.pickBarButton, picked.length === 0 && styles.primaryButtonDisabled]}
                  onPress={handleConfirmMany}
                  disabled={picked.length === 0}
                >
                  <Text style={styles.primaryButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

function FilterChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: T[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipsWrap}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.filterChip, selected.includes(opt) && styles.filterChipActive]}
            onPress={() => onToggle(opt)}
          >
            <Text style={[styles.filterChipText, selected.includes(opt) && styles.filterChipTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  searchInput: {
    color: Colors.text,
    flex: 1,
    fontSize: 14,
  },

  filterRowWrapper: {
    height: 44,
    marginBottom: 8,
  },

  filterRow: {
    paddingHorizontal: 24,
    alignItems: "center",
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterChip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    marginRight: 8,
  },

  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  filterChipTextActive: {
    color: Colors.white,
  },

  toolRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 10,
  },

  toolChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
  },

  toolChipOn: {
    borderColor: Colors.primary,
  },

  moreFilters: {
    marginHorizontal: 24,
    marginBottom: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.surface,
  },

  panes: {
    flex: 1,
    flexDirection: "row",
  },

  sidebar: {
    width: 220,
    flexGrow: 0,
    paddingLeft: 24,
    paddingRight: 8,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },

  muscleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
  },

  muscleItemActive: {
    backgroundColor: Colors.primary,
  },

  muscleItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  muscleItemTextActive: {
    color: Colors.white,
  },

  muscleCount: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  recentsBlock: {
    marginBottom: 12,
  },

  recentChip: {
    maxWidth: 200,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    justifyContent: "center",
  },

  recentChipPicked: {
    backgroundColor: Colors.primary,
  },

  recentChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },

  exerciseRowPicked: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },

  pickBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.grayMedium,
    backgroundColor: Colors.background,
  },

  pickBarTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  pickBarNames: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  pickBarClear: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  pickBarButton: {
    backgroundColor: Colors.primary,
    height: 46,
    paddingHorizontal: 26,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  createRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 12,
  },

  createRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  exerciseThumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },

  exerciseName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  exerciseTags: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 24,
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
    marginBottom: 16,
  },

  photoPicker: {
    height: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
    overflow: "hidden",
  },

  photoPickerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  photoPreview: {
    width: "100%",
    height: "100%",
  },

  videoPickedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  videoPickedText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },


  primaryButton: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  primaryButtonDisabled: {
    backgroundColor: Colors.grayMedium,
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
});
