import { onAuthStateChanged } from "firebase/auth";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CalendarIllustration, CoachIllustration } from "../../components/empty-illustrations";
import GradientFill from "../../components/gradient-fill";
import MonthCalendar from "../../components/month-calendar";
import PhotoBackground from "../../components/photo-background";
import { Colors } from "../../constants/colors";
import { Type } from "../../constants/tokens";
import { auth, db } from "../../firebase";
import { todayKey } from "../../services/load";
import {
  getAllSlotsForSportif,
  getAvailableSlotsForCoach,
  releaseSlot,
  requestSlot,
  Slot,
  slotDurationMinutes,
} from "../../services/reservations";
import { getRelationsForSportif, Relation } from "../../services/relations";

type SlotWithCoach = Slot & { coachName: string };

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const label = new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function ReservationsScreen() {
  const [uid, setUid] = useState<string | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [name, setName] = useState<string>("");
  const [available, setAvailable] = useState<SlotWithCoach[]>([]);
  const [myBookings, setMyBookings] = useState<Slot[]>([]); // toutes, passées comprises
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const today = todayKey();
  const [view, setView] = useState(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() }));
  const [selected, setSelected] = useState<string | null>(null);
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
          getAllSlotsForSportif(user.uid),
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
      getAllSlotsForSportif(uid),
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

  const upcomingBookings = myBookings.filter((s) => s.date >= today);
  const pastBookings = myBookings.filter((s) => s.date < today).sort((x, y) => y.date.localeCompare(x.date));
  const marked = new Set<string>(
    tab === "upcoming"
      ? [...upcomingBookings.map((s) => s.date), ...available.map((s) => s.date)]
      : pastBookings.map((s) => s.date)
  );
  const byDay = <T extends { date: string }>(list: T[]) => (selected ? list.filter((s) => s.date === selected) : list);
  const shownBookings = byDay(tab === "upcoming" ? upcomingBookings : pastBookings);
  const shownAvailable = tab === "upcoming" ? byDay(available) : [];

  function changeMonth(delta: -1 | 1) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function renderCard(slot: Slot & { coachName?: string }, kind: "booking" | "available") {
    const duration = slotDurationMinutes(slot);
    const coach = slot.coachName ?? coachNameFor(slot.coachId);
    const isPast = slot.date < today;
    return (
      <View key={slot.id} style={styles.slotCard}>
        <View style={styles.timeCol}>
          <Text style={styles.timeText}>{slot.heureDebut}</Text>
          {duration !== null && <Text style={styles.durationText}>{duration} min</Text>}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.slotCoach} numberOfLines={1}>
            {coach || "Coach"}
          </Text>
          <Text style={styles.slotDate}>{dayLabel(slot.date)}</Text>
          {kind === "booking" && (
            <View style={[styles.statusPill, slot.status === "confirme" ? styles.pillOk : styles.pillWait]}>
              <Text style={[styles.statusText, slot.status === "confirme" ? styles.pillOkText : styles.pillWaitText]}>
                {slot.status === "confirme" ? "Confirmée" : "En attente de confirmation"}
              </Text>
            </View>
          )}
        </View>
        {kind === "booking" && !isPast && (
          <TouchableOpacity style={styles.outlineButton} onPress={() => handleCancel(slot.id)}>
            <Text style={styles.outlineButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}
        {kind === "available" && (
          <TouchableOpacity style={styles.bookButton} onPress={() => handleRequest(slot.id)} disabled={bookingId === slot.id}>
            <GradientFill />
            <Text style={styles.bookButtonText}>{bookingId === slot.id ? "..." : "Demander"}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <PhotoBackground variant="seances" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
          <Text style={styles.title}>Réservations</Text>

          <MonthCalendar
            year={view.year}
            month={view.month}
            selected={selected}
            marked={marked}
            today={today}
            onSelect={setSelected}
            onChangeMonth={changeMonth}
          />

          <View style={styles.tabs}>
            {(
              [
                ["upcoming", "À venir"],
                ["past", "Passées"],
              ] as const
            ).map(([key, label]) => (
              <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
                {tab === key && <GradientFill />}
                <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selected && <Text style={styles.filterHint}>{dayLabel(selected)} — touche le jour pour tout afficher</Text>}

          <Text style={styles.sectionTitle}>{tab === "upcoming" ? "Mes réservations" : "Réservations passées"}</Text>
          {shownBookings.length === 0 ? (
            <Text style={styles.emptySmall}>
              {tab === "upcoming" ? "Aucune réservation à venir." : "Aucune réservation passée."}
            </Text>
          ) : (
            shownBookings.map((slot) => renderCard(slot, "booking"))
          )}

          {tab === "upcoming" && (
            <>
              <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
              {shownAvailable.length === 0 ? (
                <View style={styles.emptyCard}>
                  <CalendarIllustration size={72} />
                  <Text style={styles.emptyTitle}>Aucun créneau disponible</Text>
                  <Text style={styles.emptyText}>
                    {selected ? "Rien d'ouvert ce jour-là." : "Vos coachs n'ont pas encore ouvert de créneaux."}
                  </Text>
                </View>
              ) : (
                shownAvailable.map((slot) => renderCard(slot, "available"))
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  content: { padding: 24, paddingTop: 70, paddingBottom: 60 },
  centeredEmpty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 8 },
  emptyButton: { marginTop: 12, backgroundColor: Colors.primary, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
  emptyButtonText: { color: Colors.white, fontWeight: "700", fontSize: 14 },

  title: { fontFamily: Type.heading, fontSize: 28, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12, marginTop: 8 },
  emptySmall: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  filterHint: { fontSize: 12.5, color: Colors.primary, fontWeight: "600", marginBottom: 8 },

  tabs: { flexDirection: "row", backgroundColor: Colors.surfaceAlt, borderRadius: 14, padding: 4, marginBottom: 14 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 11, overflow: "hidden" },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13.5, fontWeight: "700", color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },

  emptyCard: { backgroundColor: Colors.surface, borderRadius: 20, paddingVertical: 28, alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.border },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginTop: 4 },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },
  emptyTitleOnDark: { fontSize: 15, fontWeight: "700", color: Colors.text, marginTop: 4 },
  emptyTextOnDark: { fontSize: 13, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 20 },

  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#062D2B",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  timeCol: { alignItems: "center", minWidth: 56 },
  timeText: { fontFamily: Type.heading, fontSize: 22, color: Colors.primaryDark },
  durationText: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  slotCoach: { fontSize: 15, fontWeight: "700", color: Colors.text },
  slotDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusPill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
  pillOk: { backgroundColor: Colors.accentTint },
  pillWait: { backgroundColor: "#FBF3D0" },
  statusText: { fontSize: 11, fontWeight: "700" },
  pillOkText: { color: Colors.primary },
  pillWaitText: { color: "#8A6A00" },

  outlineButton: { borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  outlineButtonText: { fontSize: 12.5, fontWeight: "700", color: Colors.primaryDark },
  bookButton: { overflow: "hidden", backgroundColor: Colors.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  bookButtonText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
});
