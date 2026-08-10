import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

type Props = {
  visible: boolean;
  coachId: string;
  onClose: () => void;
  onSelect: (exercise: ExerciseTemplate) => void;
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function ExercisePickerModal({ visible, coachId, onClose, onSelect }: Props) {
  const [library, setLibrary] = useState<ExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGroupe, setFilterGroupe] = useState<GroupeMusculaire | null>(null);
  const [filterMateriel, setFilterMateriel] = useState<Materiel | null>(null);
  const [filterSport, setFilterSport] = useState<Sport | null>(null);
  const [filterQualite, setFilterQualite] = useState<QualitePhysique | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
  }, [visible, coachId]);

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
    setFilterMateriel(null);
    setFilterSport(null);
    setFilterQualite(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSelect(exercise: ExerciseTemplate) {
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
      handleSelect({
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
      });
    } finally {
      setSaving(false);
    }
  }

  const filtered = library.filter((ex) => {
    if (search && !ex.nom.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterGroupe && !ex.groupesMusculaires.includes(filterGroupe)) return false;
    if (filterMateriel && !ex.materiel.includes(filterMateriel)) return false;
    if (filterSport && !ex.sports.includes(filterSport)) return false;
    if (filterQualite && !ex.qualitesPhysiques.includes(filterQualite)) return false;
    return true;
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {showCreateForm ? "Créer un exercice" : "Choisir un exercice"}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showCreateForm ? (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Nom de l'exercice</Text>
            <TextInput style={styles.input} placeholder="Ex: Squat bulgare" value={nom} onChangeText={setNom} />

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
          <>
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un exercice"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <SingleFilterRow
              options={GROUPES_MUSCULAIRES}
              selected={filterGroupe}
              onSelect={setFilterGroupe}
            />
            <SingleFilterRow options={MATERIELS} selected={filterMateriel} onSelect={setFilterMateriel} />
            <SingleFilterRow options={SPORTS} selected={filterSport} onSelect={setFilterSport} />
            <SingleFilterRow
              options={QUALITES_PHYSIQUES}
              selected={filterQualite}
              onSelect={setFilterQualite}
            />

            <TouchableOpacity style={styles.createRow} onPress={() => setShowCreateForm(true)}>
              <Ionicons name="add-circle" size={20} color={Colors.primary} />
              <Text style={styles.createRowText}>Créer un exercice personnalisé</Text>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator style={{ marginTop: 24 }} color={Colors.primary} />
            ) : (
              <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                {filtered.map((ex) => (
                  <TouchableOpacity key={ex.id} style={styles.exerciseRow} onPress={() => handleSelect(ex)}>
                    {ex.videoUrl ? (
                      <InlineLoopingVideo videoUrl={ex.videoUrl} size={64} borderRadius={14} />
                    ) : ex.photoUrl ? (
                      <Image source={{ uri: ex.photoUrl }} style={styles.exerciseThumb} />
                    ) : (
                      <MovementIllustration pattern={ex.pattern ?? "isolation"} size={64} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>{ex.nom}</Text>
                      <Text style={styles.exerciseTags} numberOfLines={1}>
                        {[...ex.groupesMusculaires, ...ex.materiel].join(" · ")}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ))}
                {filtered.length === 0 && (
                  <Text style={styles.emptyText}>Aucun exercice ne correspond à ces filtres.</Text>
                )}
              </ScrollView>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

function SingleFilterRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: T[];
  selected: T | null;
  onSelect: (value: T | null) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.filterChip, selected === opt && styles.filterChipActive]}
          onPress={() => onSelect(selected === opt ? null : opt)}
        >
          <Text style={[styles.filterChipText, selected === opt && styles.filterChipTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
    flex: 1,
    fontSize: 14,
  },

  filterRow: {
    paddingHorizontal: 24,
    marginBottom: 8,
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
    paddingBottom: 60,
  },

  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
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
