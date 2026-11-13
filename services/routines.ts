import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase";
import { BlocExercice } from "./programmes";

// Routine attitrée d'un sportif : un protocole (mobilité, prévention,
// correction posturale…) sans jour fixe, que le sportif fait à la fréquence
// choisie par son coach, et éventuellement en tête de chacune de ses séances.
//
// Une COPIE des exercices est stockée dans routines/{sportifId} : le sportif
// ne peut pas lire les protocoles d'échauffement du coach (warmupProtocols),
// et modifier le protocole source ne change pas une routine déjà attribuée.
export type RoutineFrequence = "aucune" | "1-2" | "2-3" | "3-4" | "4-5" | "quotidien";

export const ROUTINE_FREQUENCES: { key: RoutineFrequence; label: string }[] = [
  { key: "aucune", label: "Seulement avant les séances" },
  { key: "1-2", label: "1 à 2 fois / sem." },
  { key: "2-3", label: "2 à 3 fois / sem." },
  { key: "3-4", label: "3 à 4 fois / sem." },
  { key: "4-5", label: "4 à 5 fois / sem." },
  { key: "quotidien", label: "Tous les jours" },
];

export type Routine = {
  sportifId: string;
  coachId: string;
  nom: string;
  exercices: BlocExercice[];
  frequence: RoutineFrequence;
  avantSeance: boolean;
};

export function routineFrequenceLabel(r: Pick<Routine, "frequence" | "avantSeance">): string {
  const parts: string[] = [];
  if (r.avantSeance) parts.push("avant chaque séance");
  if (r.frequence !== "aucune") {
    parts.push(
      r.frequence === "quotidien"
        ? "tous les jours"
        : `${r.frequence.replace("-", " à ")} fois par semaine${r.avantSeance ? " en dehors des séances" : ""}`
    );
  }
  return parts.length ? parts.join(" + ") : "à faire quand tu veux";
}

export async function getRoutine(sportifId: string): Promise<Routine | null> {
  const snap = await getDoc(doc(db, "routines", sportifId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    sportifId,
    coachId: d.coachId,
    nom: d.nom ?? "Routine",
    exercices: (d.exercices ?? []) as BlocExercice[],
    frequence: (ROUTINE_FREQUENCES.some((f) => f.key === d.frequence) ? d.frequence : "aucune") as RoutineFrequence,
    avantSeance: d.avantSeance === true,
  };
}

export async function setRoutine(routine: Routine): Promise<void> {
  await setDoc(doc(db, "routines", routine.sportifId), { ...routine, updatedAt: new Date() });
}

export async function removeRoutine(sportifId: string): Promise<void> {
  await deleteDoc(doc(db, "routines", sportifId));
}
