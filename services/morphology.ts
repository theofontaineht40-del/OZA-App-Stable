import { addDoc, collection, getDocs } from "firebase/firestore";

import { db } from "../firebase";
import { todayKey } from "./load";

export type SkinfoldSites = {
  triceps: number;
  subscapulaire: number;
  supraIliaque: number;
  abdominal: number;
  cuisse: number;
};

export type Measurements = {
  tourTaille: number;
  tourHanches: number;
  tourBras: number;
  tourCuisse: number;
};

export type MorphologyEntry = {
  id: string;
  date: string;
  poids: number;
  taille: number;
  imc: number;
  masseGrasse: number;
  masseMusculaire: number;
  masseMaigre: number;
  plis: SkinfoldSites;
  mensurations: Measurements;
  notes: string;
};

export function computeImc(poids: number, tailleCm: number): number {
  if (!poids || !tailleCm) return 0;
  const tailleM = tailleCm / 100;
  return poids / (tailleM * tailleM);
}

export async function addMorphologyEntry(
  sportifId: string,
  entry: Omit<MorphologyEntry, "id" | "date" | "imc">
): Promise<void> {
  const imc = computeImc(entry.poids, entry.taille);
  await addDoc(collection(db, "morphology", sportifId, "entries"), {
    ...entry,
    imc,
    date: todayKey(),
    createdAt: new Date(),
  });
}

export async function getMorphologyEntries(sportifId: string): Promise<MorphologyEntry[]> {
  const snap = await getDocs(collection(db, "morphology", sportifId, "entries"));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<MorphologyEntry, "id">) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
