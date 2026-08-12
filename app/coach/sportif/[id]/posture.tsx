import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AccessDenied } from "../../../../components/access-denied";
import { Colors } from "../../../../constants/colors";
import {
  anomaliesForView,
  getAnomaly,
  PosturalView,
} from "../../../../constants/postural-anomalies";
import { usePrincipalAccess } from "../../../../hooks/use-principal-access";
import {
  addAnomalyPoint,
  AnomalyPoint,
  getPosturalAssessment,
  PosturalAssessment,
  removeAnomalyPoint,
  uploadPosturalPhoto,
} from "../../../../services/postural";

const VIEWS: { key: PosturalView; label: string }[] = [
  { key: "face", label: "Face" },
  { key: "profil", label: "Profil" },
  { key: "dos", label: "Dos" },
];

export default function PostureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [assessment, setAssessment] = useState<PosturalAssessment | null>(null);
  const [view, setView] = useState<PosturalView>("face");
  const [uploading, setUploading] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    const empty = { photoUrl: null, anomalies: [] };
    getPosturalAssessment(id)
      .then(setAssessment)
      .catch(() => setAssessment({ face: empty, profil: empty, dos: empty }));
  }, [id]);

  const isPrincipal = usePrincipalAccess(id);

  if (!assessment || isPrincipal === null) {
    return <View style={styles.container} />;
  }

  if (!isPrincipal) {
    return <AccessDenied message="La posture n'est visible que par le coach principal." />;
  }

  const currentView = assessment[view];

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !id) return;

    setUploading(true);
    try {
      const url = await uploadPosturalPhoto(id, view, result.assets[0].uri);
      setAssessment((prev) =>
        prev ? { ...prev, [view]: { photoUrl: url, anomalies: [] } } : prev
      );
    } finally {
      setUploading(false);
    }
  }

  function handlePhotoPress(e: any) {
    if (containerSize.width === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    const x = (locationX / containerSize.width) * 100;
    const y = (locationY / containerSize.height) * 100;
    setPendingPoint({ x, y });
  }

  async function handlePickAnomaly(key: string) {
    if (!id || !pendingPoint) return;
    const point: AnomalyPoint = { key, x: pendingPoint.x, y: pendingPoint.y };
    await addAnomalyPoint(id, view, point, currentView.anomalies);
    setAssessment((prev) =>
      prev
        ? {
            ...prev,
            [view]: { ...prev[view], anomalies: [...prev[view].anomalies, point] },
          }
        : prev
    );
    setPendingPoint(null);
  }

  async function handleRemoveAnomaly(index: number) {
    if (!id) return;
    await removeAnomalyPoint(id, view, index, currentView.anomalies);
    setAssessment((prev) =>
      prev
        ? {
            ...prev,
            [view]: {
              ...prev[view],
              anomalies: prev[view].anomalies.filter((_, i) => i !== index),
            },
          }
        : prev
    );
  }

  // Agrège les anomalies des 3 vues pour générer la routine corrective.
  const allAnomalyKeys = Array.from(
    new Set([
      ...assessment.face.anomalies.map((a) => a.key),
      ...assessment.profil.anomalies.map((a) => a.key),
      ...assessment.dos.anomalies.map((a) => a.key),
    ])
  );
  const detectedAnomalies = allAnomalyKeys
    .map((key) => getAnomaly(key))
    .filter((a): a is NonNullable<typeof a> => !!a);

  const chainesRaccourcies = Array.from(
    new Set(detectedAnomalies.flatMap((a) => a.chainesRaccourcies))
  );
  const chainesFaibles = Array.from(
    new Set(detectedAnomalies.flatMap((a) => a.chainesFaibles))
  );
  const exercicesMap = new Map(
    detectedAnomalies.flatMap((a) => a.exercices).map((ex) => [ex.nom, ex])
  );

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

      <Text style={styles.title}>Analyse posturale</Text>

      <View style={styles.viewToggle}>
        {VIEWS.map((v) => (
          <TouchableOpacity
            key={v.key}
            style={[styles.toggleButton, view === v.key && styles.toggleButtonActive]}
            onPress={() => {
              setView(v.key);
              setPendingPoint(null);
            }}
          >
            <Text
              style={[styles.toggleText, view === v.key && styles.toggleTextActive]}
            >
              {v.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        {currentView.photoUrl ? (
          <TouchableOpacity
            activeOpacity={1}
            onPress={handlePhotoPress}
            onLayout={(e) => setContainerSize(e.nativeEvent.layout)}
            style={styles.photoContainer}
          >
            <Image source={{ uri: currentView.photoUrl }} style={styles.photo} />
            {currentView.anomalies.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.marker,
                  { left: `${point.x}%`, top: `${point.y}%` },
                ]}
              >
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            ))}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={32} color={Colors.grayMedium} />
            <Text style={styles.placeholderText}>Aucune photo pour cette vue</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handlePickPhoto}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.secondaryButtonText}>
              {currentView.photoUrl ? "Changer la photo" : "Ajouter une photo"}
            </Text>
          )}
        </TouchableOpacity>

        {currentView.photoUrl && (
          <Text style={styles.hint}>
            Touchez la photo à l'endroit d'une anomalie pour la signaler.
          </Text>
        )}

        {pendingPoint && (
          <View style={styles.anomalyPicker}>
            <Text style={styles.fieldLabel}>Quelle anomalie ?</Text>
            <View style={styles.anomalyGrid}>
              {anomaliesForView(view).map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={styles.anomalyChip}
                  onPress={() => handlePickAnomaly(a.key)}
                >
                  <Text style={styles.anomalyChipText}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setPendingPoint(null)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {currentView.anomalies.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Anomalies signalées ({view})</Text>
          {currentView.anomalies.map((point, index) => (
            <View key={index} style={styles.anomalyRow}>
              <Text style={styles.anomalyRowText}>
                {index + 1}. {getAnomaly(point.key)?.label ?? point.key}
              </Text>
              <TouchableOpacity onPress={() => handleRemoveAnomaly(index)}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {detectedAnomalies.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Routine corrective générée</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Chaînes raccourcies</Text>
            <Text style={styles.chainsText}>{chainesRaccourcies.join(", ")}</Text>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Chaînes faibles</Text>
            <Text style={styles.chainsText}>{chainesFaibles.join(", ")}</Text>

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Exercices recommandés</Text>
            {Array.from(exercicesMap.values()).map((ex) => (
              <View key={ex.nom} style={styles.exerciseRow}>
                <Text style={styles.exerciseName}>{ex.nom}</Text>
                <Text style={styles.exerciseDetail}>
                  {ex.series} séries × {ex.repetitions} · RPE {ex.rpe} · récup {ex.recuperation}
                </Text>
              </View>
            ))}
          </View>
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

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 20,
  },

  viewToggle: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  toggleButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  toggleButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  toggleTextActive: {
    color: Colors.white,
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

  photoContainer: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.grayLight,
    marginBottom: 14,
  },

  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  placeholder: {
    width: "100%",
    aspectRatio: 0.75,
    borderRadius: 16,
    backgroundColor: Colors.grayLight,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },

  placeholderText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  marker: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    marginTop: -12,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },

  markerText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
  },

  secondaryButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 14,
  },

  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: "center",
  },

  anomalyPicker: {
    marginTop: 16,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },

  anomalyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  anomalyChip: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  anomalyChipText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },

  cancelText: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },

  anomalyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  anomalyRowText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
  },

  chainsText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },

  exerciseRow: {
    backgroundColor: Colors.grayLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  exerciseName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },

  exerciseDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
