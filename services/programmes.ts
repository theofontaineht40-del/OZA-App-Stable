import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export type ChargeType = "1rm" | "rpe" | "libre";

export type BlocExercice = {
  id: string;
  exerciceId: string;
  exerciceNom: string;
  exerciceIcon: string;
  series: string;
  repetitions: string;
  tempo: string;
  chargeType: ChargeType;
  chargeValeur: string;
  poidsIndicatif: string;
  reposSeries: string;
  reposRepetitions: string;
  commentaires: string;
};

export type Bloc = {
  id: string;
  nom: string;
  objectif: string;
  couleur: string;
  exercices: BlocExercice[];
};

export type Seance = {
  id: string;
  nom: string;
  blocs: Bloc[];
};

export type Programme = {
  id: string;
  coachId: string;
  sportifId: string | null;
  sportifName: string | null;
  nom: string;
  seances: Seance[];
  updatedAt: Date;
};

function newId(): string {
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function newBloc(): Bloc {
  return { id: newId(), nom: "Bloc 1", objectif: "", couleur: "#FF2D7A", exercices: [] };
}

export function newSeance(index: number): Seance {
  return { id: newId(), nom: `Séance ${index}`, blocs: [] };
}

export function newBlocExercice(exercice: {
  id: string;
  nom: string;
  icon: string;
}): BlocExercice {
  return {
    id: newId(),
    exerciceId: exercice.id,
    exerciceNom: exercice.nom,
    exerciceIcon: exercice.icon,
    series: "3",
    repetitions: "10",
    tempo: "2/0/1/2",
    chargeType: "rpe",
    chargeValeur: "7",
    poidsIndicatif: "",
    reposSeries: "2'",
    reposRepetitions: "0\"",
    commentaires: "",
  };
}

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function normalize(id: string, data: Omit<Programme, "id">): Programme {
  return {
    id,
    coachId: data.coachId,
    sportifId: data.sportifId ?? null,
    sportifName: data.sportifName ?? null,
    nom: data.nom,
    seances: data.seances,
    updatedAt: data.updatedAt,
  };
}

export async function getProgrammesForCoach(coachId: string): Promise<Programme[]> {
  const q = query(collection(db, "programmes"), where("coachId", "==", coachId));
  const snap = await getDocs(q);
  const programmes = snap.docs.map((d) => normalize(d.id, d.data() as Omit<Programme, "id">));
  return programmes.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
}

export async function getProgrammesForSportif(sportifId: string): Promise<Programme[]> {
  const q = query(collection(db, "programmes"), where("sportifId", "==", sportifId));
  const snap = await getDocs(q);
  const programmes = snap.docs.map((d) => normalize(d.id, d.data() as Omit<Programme, "id">));
  return programmes.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
}

// Variante utilisée côté coach (ex: écran de planification) : filtrer aussi sur
// coachId. Sans ça, la requête ne matche que sur sportifId, et si ce sportif a ne
// serait-ce qu'un seul programme créé par un AUTRE coach, les règles Firestore
// refusent la requête entière (elles exigent que resource.data.coachId corresponde
// pour CHAQUE document potentiellement renvoyé) — l'écran restait bloqué en
// chargement infini.
export async function getProgrammesForCoachAndSportif(
  coachId: string,
  sportifId: string
): Promise<Programme[]> {
  const q = query(
    collection(db, "programmes"),
    where("coachId", "==", coachId),
    where("sportifId", "==", sportifId)
  );
  const snap = await getDocs(q);
  const programmes = snap.docs.map((d) => normalize(d.id, d.data() as Omit<Programme, "id">));
  return programmes.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
}

export async function getProgramme(id: string): Promise<Programme | null> {
  const snap = await getDoc(doc(db, "programmes", id));
  if (!snap.exists()) return null;
  return normalize(snap.id, snap.data() as Omit<Programme, "id">);
}

export async function createProgramme(
  coachId: string,
  nom: string,
  sportifId: string | null = null,
  sportifName: string | null = null
): Promise<string> {
  const ref = doc(collection(db, "programmes"));
  const programme: Omit<Programme, "id"> = {
    coachId,
    sportifId,
    sportifName,
    nom,
    seances: [newSeance(1)],
    updatedAt: new Date(),
  };
  await setDoc(ref, programme);
  return ref.id;
}

export async function saveProgramme(
  id: string,
  data: Pick<Programme, "nom" | "seances">
): Promise<void> {
  await setDoc(
    doc(db, "programmes", id),
    { ...data, updatedAt: new Date() },
    { merge: true }
  );
}

export async function assignProgrammeToSportif(
  id: string,
  sportifId: string | null,
  sportifName: string | null
): Promise<void> {
  await setDoc(
    doc(db, "programmes", id),
    { sportifId, sportifName, updatedAt: new Date() },
    { merge: true }
  );
}

export async function deleteProgramme(id: string): Promise<void> {
  await deleteDoc(doc(db, "programmes", id));
}
