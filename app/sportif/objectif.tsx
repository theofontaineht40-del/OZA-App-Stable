import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
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

import DateField from "../../components/date-field";
import PhotoBackground from "../../components/photo-background";
import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import { deleteGoal, getGoal, Goal, setGoal } from "../../services/goals";
import { showAlert } from "../../utils/alert";

export default function ObjectifScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [existingGoal, setExistingGoal] = useState<Goal | null>(null);
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("kg");
  const [startValue, setStartValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      const goal = await getGoal(user.uid);
      if (goal) {
        setExistingGoal(goal);
        setDescription(goal.description);
        setUnit(goal.unit);
        setStartValue(String(goal.startValue));
        setCurrentValue(String(goal.currentValue));
        setTargetValue(String(goal.targetValue));
        setTargetDate(goal.targetDate ?? "");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function handleSave() {
    if (!uid) return;
    if (!description.trim()) {
      showAlert("Description manquante", "Décrivez votre objectif en quelques mots.");
      return;
    }
    const start = parseFloat(startValue);
    const current = parseFloat(currentValue);
    const target = parseFloat(targetValue);
    if (isNaN(start) || isNaN(current) || isNaN(target)) {
      showAlert("Valeurs invalides", "Renseignez les valeurs de départ, actuelle et cible.");
      return;
    }

    setSaving(true);
    try {
      await setGoal(uid, {
        description: description.trim(),
        unit: unit.trim() || "kg",
        startValue: start,
        currentValue: current,
        targetValue: target,
        targetDate: targetDate || null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!uid) return;
    setSaving(true);
    try {
      await deleteGoal(uid);
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
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mon objectif</Text>
        <Text style={styles.subtitle}>Un but concret à suivre dans le temps.</Text>

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          placeholder="Ex : Perdre 5kg avant l'été"
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.row}>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Départ</Text>
            <TextInput
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              keyboardType="decimal-pad"
              value={startValue}
              onChangeText={setStartValue}
            />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Actuelle</Text>
            <TextInput
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              keyboardType="decimal-pad"
              value={currentValue}
              onChangeText={setCurrentValue}
            />
          </View>
          <View style={styles.rowField}>
            <Text style={styles.fieldLabel}>Cible</Text>
            <TextInput
              placeholderTextColor={Colors.textSecondary}
              style={styles.input}
              keyboardType="decimal-pad"
              value={targetValue}
              onChangeText={setTargetValue}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Unité</Text>
        <TextInput
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          placeholder="kg"
          value={unit}
          onChangeText={setUnit}
        />

        <Text style={styles.fieldLabel}>Date cible (optionnel)</Text>
        <DateField value={targetDate} onChange={setTargetDate} placeholder="Choisir une date" />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Enregistrer</Text>
          )}
        </TouchableOpacity>

        {existingGoal && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={saving}>
            <Text style={styles.deleteButtonText}>Supprimer l'objectif</Text>
          </TouchableOpacity>
        )}
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
    padding: 32,
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
    fontSize: 26,
    fontWeight: "700",
    color: Colors.textOnDark,
  },

  subtitle: {
    fontSize: 15,
    color: Colors.textOnDarkSecondary,
    marginTop: 4,
    marginBottom: 24,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textOnDark,
    marginBottom: 8,
  },

  input: {
    color: Colors.text,
    height: 52,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  rowField: {
    flex: 1,
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  primaryButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
  },

  deleteButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },

  deleteButtonText: {
    color: Colors.riskHigh,
    fontWeight: "600",
    fontSize: 14,
  },
});
