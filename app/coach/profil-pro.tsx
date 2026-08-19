import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "../../constants/colors";
import ImageCropModal from "../../components/image-crop-modal";
import PhotoBackground from "../../components/photo-background";
import { Specialite, SPECIALITES } from "../../constants/specialites";
import { auth } from "../../firebase";
import {
  CoachProfile,
  getCoachProfile,
  updateCoachPublicProfile,
  uploadCoachPhoto,
} from "../../services/discovery";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function ProfilProScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropUri, setCropUri] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [tarifHoraire, setTarifHoraire] = useState("");
  const [ville, setVille] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [discoverable, setDiscoverable] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      try {
        const profile = await getCoachProfile(user.uid);
        if (profile) {
          setPhotoUrl(profile.photoUrl);
          setBio(profile.bio);
          setSpecialites(profile.specialites);
          setTarifHoraire(profile.tarifHoraire ? String(profile.tarifHoraire) : "");
          setVille(profile.ville);
          setEntreprise(profile.entreprise);
          setDiscoverable(profile.discoverable);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function handlePickPhoto() {
    if (!uid) return;
    // allowsEditing + aspect carré : sur iOS/Android ça ouvre l'outil de
    // recadrage natif de l'OS avant l'upload, pour un vrai cadrage choisi par
    // l'utilisateur plutôt qu'un crop automatique subi (non supporté sur web,
    // où le cadre carré ci-dessous fait déjà un bien meilleur travail par
    // défaut que l'ancien cadre très large en 140×pleine-largeur).
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    setCropUri(result.assets[0].uri);
  }

  async function handleCropConfirm(croppedUri: string) {
    setCropUri(null);
    if (!uid) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadCoachPhoto(uid, croppedUri);
      setPhotoUrl(url);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!uid) return;
    setSaving(true);
    try {
      await updateCoachPublicProfile(uid, {
        bio: bio.trim(),
        specialites,
        tarifHoraire: tarifHoraire ? parseInt(tarifHoraire, 10) : null,
        ville: ville.trim(),
        entreprise: entreprise.trim(),
        discoverable,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={{ flex: 1 }}>
    <PhotoBackground variant="profil" />
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.textOnDark} />
        <Text style={styles.backText}>Profil</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Profil professionnel</Text>
      <Text style={styles.subtitle}>
        Ces informations sont visibles par les sportifs dans Découvrir si vous activez la
        visibilité.
      </Text>

      <View style={styles.photoPickerRow}>
        <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto} disabled={uploadingPhoto}>
          {uploadingPhoto ? (
            <ActivityIndicator color={Colors.primary} />
          ) : photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="camera-outline" size={22} color={Colors.textSecondary} />
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto}>
          <Text style={styles.photoPickerText}>
            {photoUrl ? "Changer la photo" : "Ajouter une photo"}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.fieldLabel}>Présentation</Text>
      <TextInput
  placeholderTextColor={Colors.textSecondary}
        style={[styles.input, styles.bioInput]}
        placeholder="Présentez votre approche, votre expérience..."
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Text style={styles.fieldLabel}>Ville</Text>
      <TextInput
  placeholderTextColor={Colors.textSecondary} style={styles.input} placeholder="Paris" value={ville} onChangeText={setVille} />

      <Text style={styles.fieldLabel}>Entreprise / studio (optionnel)</Text>
      <TextInput
  placeholderTextColor={Colors.textSecondary} style={styles.input} placeholder="Ex: OZA Coaching" value={entreprise} onChangeText={setEntreprise} />

      <Text style={styles.fieldLabel}>Tarif indicatif (€ / heure)</Text>
      <TextInput
  placeholderTextColor={Colors.textSecondary}
        style={styles.input}
        placeholder="60"
        keyboardType="numeric"
        value={tarifHoraire}
        onChangeText={setTarifHoraire}
      />

      <Text style={styles.fieldLabel}>Spécialités proposées</Text>
      <View style={styles.chipsWrap}>
        {SPECIALITES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, specialites.includes(s) && styles.chipActive]}
            onPress={() => setSpecialites((prev) => toggle(prev, s))}
          >
            <Text style={[styles.chipText, specialites.includes(s) && styles.chipTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchTitle}>Visible dans Découvrir</Text>
          <Text style={styles.switchSubtitle}>
            Les sportifs pourront vous trouver et réserver une séance.
          </Text>
        </View>
        <Switch
          value={discoverable}
          onValueChange={setDiscoverable}
          trackColor={{ true: Colors.primary }}
        />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.primaryButtonText}>Enregistrer</Text>
        )}
      </TouchableOpacity>

      <ImageCropModal
        visible={!!cropUri}
        imageUri={cropUri}
        onCancel={() => setCropUri(null)}
        onConfirm={handleCropConfirm}
      />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
    color: Colors.textOnDark,
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textOnDark,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.textOnDarkSecondary,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },

  // Un cadre carré (et pas un large bandeau pleine-largeur comme avant) fait
  // que le recadrage "cover" tombe sur un carré centré cohérent avec un
  // portrait, au lieu de trancher le haut et le bas d'une photo verticale.
  photoPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },

  photoPicker: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: Colors.surfaceAlt,
  },

  photoPickerText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },

  photoPreview: {
    width: "100%",
    height: "100%",
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textOnDark,
    marginBottom: 8,
  },

  input: {
    color: Colors.text,
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 18,
  },

  bioInput: {
    color: Colors.text,
    height: 90,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  chip: {
    backgroundColor: Colors.surface,
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

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  switchTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },

  switchSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
