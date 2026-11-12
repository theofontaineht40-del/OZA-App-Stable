import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

// Objectifs fixés par le COACH pour un sportif (ex. "Prendre 5 kg", "Squat à
// 1,5 × poids du corps"), distincts de l'objectif chiffré que le sportif se
// donne lui-même (services/goals.ts). Le coach les marque atteints et peut
// les commenter ; le sportif les voit en lecture seule.
export type CoachObjective = {
  id: string;
  coachId: string;
  sportifId: string;
  titre: string;
  atteint: boolean;
  atteintLe: string | null; // YYYY-MM-DD
  commentaire: string | null;
  createdAt: Date;
};

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return value instanceof Date ? value : new Date(0);
}

function toObjective(id: string, d: Record<string, any>): CoachObjective {
  return {
    id,
    coachId: d.coachId,
    sportifId: d.sportifId,
    titre: d.titre ?? "",
    atteint: !!d.atteint,
    atteintLe: d.atteintLe ?? null,
    commentaire: d.commentaire ?? null,
    createdAt: toDate(d.createdAt),
  };
}

// En cours d'abord, puis atteints ; du plus récent au plus ancien.
function sortObjectives(list: CoachObjective[]): CoachObjective[] {
  return list.sort(
    (a, b) =>
      Number(a.atteint) - Number(b.atteint) || b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function getObjectivesForCoach(
  coachId: string,
  sportifId: string
): Promise<CoachObjective[]> {
  const q = query(
    collection(db, "coachObjectives"),
    where("coachId", "==", coachId),
    where("sportifId", "==", sportifId)
  );
  const snap = await getDocs(q);
  return sortObjectives(snap.docs.map((d) => toObjective(d.id, d.data())));
}

export async function getObjectivesForSportif(sportifId: string): Promise<CoachObjective[]> {
  const q = query(collection(db, "coachObjectives"), where("sportifId", "==", sportifId));
  const snap = await getDocs(q);
  return sortObjectives(snap.docs.map((d) => toObjective(d.id, d.data())));
}

export async function addObjective(
  coachId: string,
  sportifId: string,
  titre: string
): Promise<void> {
  await addDoc(collection(db, "coachObjectives"), {
    coachId,
    sportifId,
    titre: titre.trim(),
    atteint: false,
    atteintLe: null,
    commentaire: null,
    createdAt: new Date(),
  });
}

export async function setObjectiveAchieved(id: string, atteint: boolean): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await setDoc(
    doc(db, "coachObjectives", id),
    { atteint, atteintLe: atteint ? today : null },
    { merge: true }
  );
}

export async function setObjectiveComment(id: string, commentaire: string): Promise<void> {
  await setDoc(
    doc(db, "coachObjectives", id),
    { commentaire: commentaire.trim() || null },
    { merge: true }
  );
}

export async function deleteObjective(id: string): Promise<void> {
  await deleteDoc(doc(db, "coachObjectives", id));
}
