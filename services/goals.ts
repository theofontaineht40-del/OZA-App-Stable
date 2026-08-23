import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase";

export type Goal = {
  description: string;
  unit: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  targetDate: string | null;
};

export async function getGoal(sportifUid: string): Promise<Goal | null> {
  const snap = await getDoc(doc(db, "goals", sportifUid));
  return snap.exists() ? (snap.data() as Goal) : null;
}

export async function setGoal(sportifUid: string, goal: Goal): Promise<void> {
  await setDoc(doc(db, "goals", sportifUid), goal);
}

export async function deleteGoal(sportifUid: string): Promise<void> {
  await deleteDoc(doc(db, "goals", sportifUid));
}

// Le sens du progrès (perte ou gain) se déduit de la position de la cible
// par rapport au départ, plutôt que d'être choisi explicitement par le
// sportif — "5kg à perdre" et "5kg à prendre" utilisent la même formule.
export function computeGoalProgress(goal: Goal): number {
  const { startValue, targetValue, currentValue } = goal;
  if (targetValue === startValue) return 1;
  const progress = (currentValue - startValue) / (targetValue - startValue);
  return Math.max(0, Math.min(1, progress));
}
