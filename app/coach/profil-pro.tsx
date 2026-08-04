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

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [specialites, setSpecialites] = useState<Specialite[]>([]);
  const [tarifHoraire, setTarifHoraire] = useState("");
  const [ville, setVille] = useState("");
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
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadCoachPhoto(uid, result.assets[0].uri);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={20} color={Colors.text} />
        <Text style={styles.backText}>Profil</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Profil professionnel</Text>
      <Text style={styles.subtitle}>
        Ces informations sont visibles par les sportifs dans Découvrir si vous activez la
        visibilité.
      </Text>

      <TouchableOpacity style={styles.photoPicker} onPress={handlePickPhoto} disabled={uploadingPhoto}>
        {uploadingPhoto ? (
          <ActivityIndicator color={Colors.primary} />
        ) : photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photoPreview} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={24} color={Colors.textSecondary} />
            <Text style={styles.photoPickerText}>Ajouter une photo</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Présentation</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder="Présentez votre approche, votre expérience..."
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Text style={styles.fieldLabel}>Ville</Text>
      <TextInput style={styles.input} placeholder="Paris" value={ville} onChangeText={setVille} />

      <Text style={styles.fieldLabel}>Tarif indicatif (€ / heure)</Text>
      <TextInput
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
    marginBottom: 20,
    lineHeight: 18,
  },

  photoPicker: {
    height: 140,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
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

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 18,
  },

  bioInput: {
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

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.white,
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
