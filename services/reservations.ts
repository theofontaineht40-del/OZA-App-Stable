import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase";
import { todayKey } from "./load";

export type SlotStatus = "disponible" | "en_attente" | "confirme";

export type Slot = {
  id: string;
  coachId: string;
  date: string; // "YYYY-MM-DD"
  heureDebut: string; // "HH:MM"
  heureFin: string;
  status: SlotStatus;
  sportifId: string | null;
  sportifName: string | null;
};

function timeToMinutes(time: string): number | null {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function countGeneratedSlots(
  heureDebut: string,
  heureFin: string,
  dureeMinutes: number
): number {
  const start = timeToMinutes(heureDebut);
  const end = timeToMinutes(heureFin);
  if (start === null || end === null || end <= start || dureeMinutes <= 0) return 0;
  return Math.floor((end - start) / dureeMinutes);
}

// Découpe la plage horaire en créneaux de `dureeMinutes` et les crée tous en un seul batch.
export async function addSlots(
  coachId: string,
  date: string,
  heureDebut: string,
  heureFin: string,
  dureeMinutes: number
): Promise<number> {
  const start = timeToMinutes(heureDebut);
  const end = timeToMinutes(heureFin);
  if (start === null || end === null || end <= start || dureeMinutes <= 0) return 0;

  const batch = writeBatch(db);
  let count = 0;
  for (let t = start; t + dureeMinutes <= end; t += dureeMinutes) {
    const ref = doc(collection(db, "slots"));
    batch.set(ref, {
      coachId,
      date,
      heureDebut: minutesToTime(t),
      heureFin: minutesToTime(t + dureeMinutes),
      status: "disponible",
      sportifId: null,
      sportifName: null,
      createdAt: new Date(),
    });
    count++;
  }

  if (count > 0) await batch.commit();
  return count;
}

function sortSlots(slots: Slot[]): Slot[] {
  return slots.sort((a, b) =>
    a.date === b.date ? a.heureDebut.localeCompare(b.heureDebut) : a.date.localeCompare(b.date)
  );
}

export async function getSlotsForCoach(coachId: string): Promise<Slot[]> {
  const q = query(collection(db, "slots"), where("coachId", "==", coachId));
  const snap = await getDocs(q);
  const slots = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Slot, "id">) }));
  return sortSlots(slots).filter((s) => s.date >= todayKey());
}

export async function getSlotsForSportif(sportifId: string): Promise<Slot[]> {
  const q = query(collection(db, "slots"), where("sportifId", "==", sportifId));
  const snap = await getDocs(q);
  const slots = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Slot, "id">) }));
  return sortSlots(slots).filter((s) => s.date >= todayKey());
}

export async function getAvailableSlotsForCoach(coachId: string): Promise<Slot[]> {
  const slots = await getSlotsForCoach(coachId);
  return slots.filter((s) => s.status === "disponible");
}

// Le sportif demande un créneau : il passe en attente de confirmation du coach.
export async function requestSlot(
  slotId: string,
  sportifId: string,
  sportifName: string
): Promise<void> {
  await updateDoc(doc(db, "slots", slotId), {
    status: "en_attente",
    sportifId,
    sportifName,
  });
}

export async function confirmSlot(slotId: string): Promise<void> {
  await updateDoc(doc(db, "slots", slotId), {
    status: "confirme",
  });
}

// Refus par le coach ou annulation par le sportif : le créneau redevient disponible.
export async function releaseSlot(slotId: string): Promise<void> {
  await updateDoc(doc(db, "slots", slotId), {
    status: "disponible",
    sportifId: null,
    sportifName: null,
  });
}

export async function deleteSlot(slotId: string): Promise<void> {
  await deleteDoc(doc(db, "slots", slotId));
}
