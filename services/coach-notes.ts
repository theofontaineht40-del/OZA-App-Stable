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

// Carnet du coach : notes privées par sportif (observation, point à
// surveiller, idée pour la prochaine séance). Jamais exposées au sportif —
// voir /coachNotes dans firestore.rules, lisible uniquement par son auteur.
export type CoachNote = {
  id: string;
  coachId: string;
  sportifId: string;
  text: string;
  createdAt: Date;
};

function toDate(value: unknown): Date {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return value instanceof Date ? value : new Date(0);
}

export async function getCoachNotes(coachId: string, sportifId: string): Promise<CoachNote[]> {
  // Deux filtres d'égalité seulement : pas d'index composite requis, le tri
  // par date se fait côté client.
  const q = query(
    collection(db, "coachNotes"),
    where("coachId", "==", coachId),
    where("sportifId", "==", sportifId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        coachId: data.coachId,
        sportifId: data.sportifId,
        text: data.text ?? "",
        createdAt: toDate(data.createdAt),
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function addCoachNote(
  coachId: string,
  sportifId: string,
  text: string
): Promise<void> {
  await addDoc(collection(db, "coachNotes"), {
    coachId,
    sportifId,
    text: text.trim(),
    createdAt: new Date(),
  });
}

export async function deleteCoachNote(id: string): Promise<void> {
  await deleteDoc(doc(db, "coachNotes", id));
}
