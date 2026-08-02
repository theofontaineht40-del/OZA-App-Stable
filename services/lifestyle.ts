import { addDoc, collection, getDocs } from "firebase/firestore";

import { db } from "../firebase";
import { todayKey } from "./load";

export type LifestyleEntry = {
  id: string;
  date: string;
  sommeilHeures: number;
  qualiteSommeil: number;
  hydratationLitres: number;
  petitDejeuner: string;
  dejeuner: string;
  diner: string;
  collations: string;
  complements: string;
  stress: number;
  notes: string;
};

export async function addLifestyleEntry(
  sportifId: string,
  entry: Omit<LifestyleEntry, "id" | "date">
): Promise<void> {
  await addDoc(collection(db, "lifestyleAssessments", sportifId, "entries"), {
    ...entry,
    date: todayKey(),
    createdAt: new Date(),
  });
}

export async function getLifestyleEntries(sportifId: string): Promise<LifestyleEntry[]> {
  const snap = await getDocs(
    collection(db, "lifestyleAssessments", sportifId, "entries")
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<LifestyleEntry, "id">) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
