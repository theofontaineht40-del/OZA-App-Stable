import { collection, doc, getDocs, setDoc } from "firebase/firestore";

import { db } from "../firebase";
import { segmentKey } from "../constants/athlete-segments";

export type Threshold = {
  low0: number; // valeur correspondant à un score de 0/10
  high10: number; // valeur correspondant à un score de 10/10
};

function docId(testKey: string, sexe: string, ageBracket: string): string {
  return `${testKey}__${segmentKey(sexe, ageBracket)}`;
}

// Charge tous les seuils d'un segment (sexe + tranche d'âge) donné.
export async function getThresholds(
  coachId: string,
  sexe: string,
  ageBracket: string
): Promise<Record<string, Threshold>> {
  const snap = await getDocs(collection(db, "referentials", coachId, "thresholds"));
  const suffix = `__${segmentKey(sexe, ageBracket)}`;
  const result: Record<string, Threshold> = {};

  snap.docs.forEach((d) => {
    if (!d.id.endsWith(suffix)) return;
    const testKey = d.id.slice(0, -suffix.length);
    const data = d.data();
    result[testKey] = { low0: data.low0, high10: data.high10 };
  });

  return result;
}

export async function setThreshold(
  coachId: string,
  testKey: string,
  sexe: string,
  ageBracket: string,
  threshold: Threshold
): Promise<void> {
  await setDoc(
    doc(db, "referentials", coachId, "thresholds", docId(testKey, sexe, ageBracket)),
    threshold
  );
}

// Interpolation linéaire : fonctionne dans les deux sens selon l'ordre des
// bornes fournies par le coach (ex : sprint où "plus bas = mieux" -> low0 > high10).
export function scoreFromValue(value: number, threshold: Threshold): number {
  const { low0, high10 } = threshold;
  if (low0 === high10) return 0;
  const raw = ((value - low0) / (high10 - low0)) * 10;
  return Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
}
