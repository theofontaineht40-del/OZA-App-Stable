import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import DateField from "../../components/date-field";
import { CalendarIllustration } from "../../components/empty-illustrations";
import { Colors } from "../../constants/colors";
import { auth } from "../../firebase";
import {
  addSlots,
  confirmSlot,
  countGeneratedSlots,
  deleteSlot,
  getSlotsForCoach,
  releaseSlot,
  Slot,
} from "../../services/reservations";

const DUREES = [30, 45, 60, 90];

export default function ReservationsScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [heureDebut, setHeureDebut] = useState("");
  const [heureFin, setHeureFin] = useState("");
  const [duree, setDuree] = useState(60);
  const [saving, setSaving] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  const slotsToCreate = countGeneratedSlots(heureDebut, heureFin, duree);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);
      try {
        const data = await getSlotsForCoach(user.uid);
        setSlots(data);
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
    const data = await getSlotsForCoach(uid);
    setSlots(data);
  }

  async function handleAddSlot() {
    if (!uid || !date || !heureDebut || !heureFin || slotsToCreate === 0) return;
    setSaving(true);
    try {
      await addSlots(uid, date, heureDebut, heureFin, duree);
      await refresh();
      setShowForm(false);
      setDate("");
      setHeureDebut("");
      setHeureFin("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slotId: string) {
    await deleteSlot(slotId);
    await refresh();
  }

  async function handleConfirm(slotId: string) {
    await confirmSlot(slotId);
    await refresh();
  }

  async function handleRefuse(slotId: string) {
    await releaseSlot(slotId);
    await refresh();
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  const grouped = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    (acc[slot.date] ??= []).push(slot);
    return acc;
  }, {});

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Réservations</Text>
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
          <Text style={styles.fieldLabel}>Date</Text>
          <DateField value={date} onChange={setDate} placeholder="Choisir une date" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Heure début</Text>
              <TextInput
  placeholderTextColor={Colors.textSecondary}
                style={styles.input}
                placeholder="09:00"
                value={heureDebut}
                onChangeText={setHeureDebut}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Heure fin</Text>
              <TextInput
  placeholderTextColor={Colors.textSecondary}
                style={styles.input}
                placeholder="12:00"
                value={heureFin}
                onChangeText={setHeureFin}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Durée par créneau</Text>
          <View style={styles.dureeRow}>
            {DUREES.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dureeChip, duree === d && styles.dureeChipActive]}
                onPress={() => setDuree(d)}
              >
                <Text style={[styles.dureeChipText, duree === d && styles.dureeChipTextActive]}>
                  {d} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.previewText}>
            {slotsToCreate > 0
              ? `${slotsToCreate} créneau${slotsToCreate > 1 ? "x" : ""} de ${duree} min seront créés`
              : "Renseignez une plage horaire valide"}
          </Text>

          <TouchableOpacity
            style={[styles.primaryButton, slotsToCreate === 0 && styles.primaryButtonDisabled]}
            onPress={handleAddSlot}
            disabled={saving || slotsToCreate === 0}
          >
            {saving ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {slotsToCreate > 1 ? `Générer ${slotsToCreate} créneaux` : "Ajouter le créneau"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {Object.keys(grouped).length === 0 ? (
        <View style={styles.emptyCard}>
          <CalendarIllustration size={80} />
          <Text style={styles.emptyTitle}>Aucun créneau à venir</Text>
          <Text style={styles.emptyText}>
            Ajoutez des créneaux pour que vos sportifs puissent en faire la demande.
          </Text>
        </View>
      ) : (
        Object.entries(grouped).map(([d, daySlots]) => (
          <View key={d} style={{ marginBottom: 20 }}>
            <Text style={styles.dateHeader}>{d}</Text>
            {daySlots.map((slot) => (
              <View key={slot.id} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.slotTime}>
                      {slot.heureDebut} — {slot.heureFin}
                    </Text>
                    {slot.status === "disponible" && (
                      <Text style={styles.slotAvailable}>Disponible</Text>
                    )}
                    {slot.status === "en_attente" && (
                      <Text style={styles.slotPending}>
                        Demande de {slot.sportifName}
                      </Text>
                    )}
                    {slot.status === "confirme" && (
                      <Text style={styles.slotBooked}>Confirmé — {slot.sportifName}</Text>
                    )}
                  </View>
                  {slot.status === "disponible" && (
                    <TouchableOpacity onPress={() => handleDelete(slot.id)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>

                {slot.status === "en_attente" && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.refuseButton}
                      onPress={() => handleRefuse(slot.id)}
                    >
                      <Text style={styles.refuseButtonText}>Refuser</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => handleConfirm(slot.id)}
                    >
                      <Text style={styles.confirmButtonText}>Confirmer</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        ))
      )}
      </Animated.View>
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

  row: {
    flexDirection: "row",
    gap: 12,
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

  dureeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  dureeChip: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  dureeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  dureeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  dureeChipTextActive: {
    color: Colors.white,
  },

  previewText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 14,
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

  dateHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: 10,
  },

  slotCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  slotTime: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },

  slotAvailable: {
    fontSize: 12,
    color: Colors.riskLow,
    marginTop: 2,
  },

  slotPending: {
    fontSize: 12,
    color: Colors.riskMedium,
    fontWeight: "600",
    marginTop: 2,
  },

  slotBooked: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  refuseButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.grayMedium,
    justifyContent: "center",
    alignItems: "center",
  },

  refuseButtonText: {
    color: Colors.textSecondary,
    fontWeight: "700",
    fontSize: 13,
  },

  confirmButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  confirmButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
});
