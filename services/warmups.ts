import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { BlocExercice } from "./programmes";

// Protocole d'échauffement : une suite d'exercices (avec leurs séries, reps,
// tempo, consignes…) que le coach réutilise en tête de n'importe quelle
// séance. Il se crée en enregistrant un bloc existant du constructeur de
// programme, et s'insère comme un bloc "Échauffement" — il est donc rendu
// partout (vue sportif, exécution, PDF) comme n'importe quel autre bloc.
export type WarmupProtocol = {
  id: string;
  coachId: string;
  nom: string;
  exercices: BlocExercice[];
};

export async function getWarmupProtocols(coachId: string): Promise<WarmupProtocol[]> {
  const snap = await getDocs(query(collection(db, "warmupProtocols"), where("coachId", "==", coachId)));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        coachId: data.coachId,
        nom: data.nom ?? "",
        exercices: (data.exercices ?? []) as BlocExercice[],
      };
    })
    .sort((a, b) => a.nom.localeCompare(b.nom));
}

export async function saveWarmupProtocol(
  coachId: string,
  nom: string,
  exercices: BlocExercice[]
): Promise<void> {
  await addDoc(collection(db, "warmupProtocols"), {
    coachId,
    nom: nom.trim(),
    exercices,
    createdAt: new Date(),
  });
}

export async function deleteWarmupProtocol(id: string): Promise<void> {
  await deleteDoc(doc(db, "warmupProtocols", id));
}
