import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "../../constants/colors";
import { CalendarIllustration, CoachIllustration } from "../../components/empty-illustrations";
import PhotoBackground from "../../components/photo-background";
import { auth, db } from "../../firebase";
import {
  getAvailableSlotsForCoach,
  getSlotsForSportif,
  releaseSlot,
  requestSlot,
  Slot,
} from "../../services/reservations";
import { getRelationsForSportif, Relation } from "../../services/relations";

type SlotWithCoach = Slot & { coachName: string };

export default function ReservationsScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [name, setName] = useState<string>("");
  const [available, setAvailable] = useState<SlotWithCoach[]>([]);
  const [myBookings, setMyBookings] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUid(user.uid);

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const data = userSnap.data();
        setName(`${data?.firstName ?? ""} ${data?.lastName ?? ""}`.trim());

        const [bookings, relationData] = await Promise.all([
          getSlotsForSportif(user.uid),
          getRelationsForSportif(user.uid),
        ]);
        setMyBookings(bookings);
        setRelations(relationData);

        const slots = await fetchAvailable(relationData);
        setAvailable(slots);
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

  async function fetchAvailable(rels: Relation[]): Promise<SlotWithCoach[]> {
    const perCoach = await Promise.all(
      rels.map(async (r) => {
        const slots = await getAvailableSlotsForCoach(r.coachId);
        return slots.map((s) => ({ ...s, coachName: `${r.coachFirstName} ${r.coachLastName}` }));
      })
    );
    return perCoach.flat();
  }

  async function refreshAll() {
    if (!uid) return;
    const [slots, bookings] = await Promise.all([
      fetchAvailable(relations),
      getSlotsForSportif(uid),
    ]);
    setAvailable(slots);
    setMyBookings(bookings);
  }

  async function handleRequest(slotId: string) {
    if (!uid) return;
    setBookingId(slotId);
    try {
      await requestSlot(slotId, uid, name);
      await refreshAll();
    } finally {
      setBookingId(null);
    }
  }

  async function handleCancel(slotId: string) {
    if (!uid) return;
    await releaseSlot(slotId);
    await refreshAll();
  }

  function coachNameFor(coachId: string): string {
    const relation = relations.find((r) => r.coachId === coachId);
    return relation ? `${relation.coachFirstName} ${relation.coachLastName}` : "";
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  if (relations.length === 0) {
    return (
      <View style={styles.container}>
        <PhotoBackground variant="seances" />
        <View style={styles.centeredEmpty}>
          <CoachIllustration size={88} />
          <Text style={styles.emptyTitleOnDark}>Aucun coach associé</Text>
          <Text style={styles.emptyTextOnDark}>
            Renseignez le code de votre coach depuis "Mon équipe" pour réserver des séances.
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/sportif/equipe")}>
            <Text style={styles.emptyButtonText}>Ajouter mon coach</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <PhotoBackground variant="seances" />
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <Text style={styles.title}>Réservations</Text>

      <Text style={styles.sectionTitle}>Mes réservations</Text>
      {myBookings.length === 0 ? (
        <Text style={styles.emptySmall}>Aucune demande envoyée.</Text>
      ) : (
        myBookings.map((slot) => (
          <View key={slot.id} style={styles.bookingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.slotDate}>{slot.date}</Text>
              <Text style={styles.slotTime}>
                {slot.heureDebut} — {slot.heureFin}
              </Text>
              <Text style={styles.slotCoach}>{coachNameFor(slot.coachId)}</Text>
              <Text
                style={[
                  styles.statusBadge,
                  slot.status === "confirme" ? styles.statusConfirmed : styles.statusPending,
                ]}
              >
                {slot.status === "confirme" ? "Confirmée" : "En attente de confirmation"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleCancel(slot.id)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
      {available.length === 0 ? (
        <View style={styles.emptyCard}>
          <CalendarIllustration size={72} />
          <Text style={styles.emptyTitle}>Aucun créneau disponible</Text>
          <Text style={styles.emptyText}>
            Vos coachs n'ont pas encore ouvert de créneaux.
          </Text>
        </View>
      ) : (
        available.map((slot) => (
          <View key={slot.id} style={styles.slotRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.slotDate}>{slot.date}</Text>
              <Text style={styles.slotTime}>
                {slot.heureDebut} — {slot.heureFin}
              </Text>
              <Text style={styles.slotCoach}>{slot.coachName}</Text>
            </View>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => handleRequest(slot.id)}
              disabled={bookingId === slot.id}
            >
              <Text style={styles.bookButtonText}>
                {bookingId === slot.id ? "..." : "Demander"}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      </Animated.View>
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

  centeredEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 8,
  },

  emptyButton: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  emptyButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginBottom: 12,
    marginTop: 8,
  },

  emptySmall: {
    fontSize: 13,
    color: Colors.textOnDarkSecondary,
    marginBottom: 20,
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

  emptyTitleOnDark: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textOnDark,
    marginTop: 4,
  },

  emptyTextOnDark: {
    fontSize: 13,
    color: Colors.textOnDarkSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.accentTint,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  slotDate: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },

  slotTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  slotCoach: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },

  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },

  statusPending: {
    color: Colors.riskMedium,
  },

  statusConfirmed: {
    color: Colors.primary,
  },

  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },

  bookButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  bookButtonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
});
