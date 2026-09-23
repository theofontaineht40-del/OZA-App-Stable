import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";

import {
  EXERCISE_LIBRARY,
  ExerciseTemplate,
  GroupeMusculaire,
  Materiel,
  QualitePhysique,
  Sport,
} from "../constants/exercise-library";
import { db, storage } from "../firebase";

export async function uploadExercisePhoto(
  coachId: string,
  exerciseTempId: string,
  localUri: string
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const fileRef = storageRef(storage, `exercises/${coachId}/${exerciseTempId}.jpg`);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
}

export async function uploadExerciseVideo(
  coachId: string,
  exerciseTempId: string,
  localUri: string
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const fileRef = storageRef(storage, `exercises/${coachId}/${exerciseTempId}.mp4`);
  await uploadBytes(fileRef, blob);
  return getDownloadURL(fileRef);
}

export async function getCustomExercises(coachId: string): Promise<ExerciseTemplate[]> {
  const q = query(collection(db, "exercises"), where("coachId", "==", coachId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, custom: true, ...(d.data() as Omit<ExerciseTemplate, "id">) }));
}

export async function getExerciseLibrary(coachId: string): Promise<ExerciseTemplate[]> {
  // La lecture de /exercises exige d'être le coach lui-même OU un sportif
  // lié à lui (voir firestore.rules) — un appelant qui ne remplit aucune de
  // ces conditions se prend un refus. Sans ce garde-fou, cet échec faisait
  // rejeter TOUTE la bibliothèque, y compris les exercices standards
  // (EXERCISE_LIBRARY, statique, sans lecture réseau) qui n'ont rien à voir
  // avec les exercices custom du coach.
  let custom: ExerciseTemplate[] = [];
  try {
    custom = await getCustomExercises(coachId);
  } catch {
    // Ignoré : mieux vaut la bibliothèque standard sans les customs que
    // rien du tout.
  }
  return [...EXERCISE_LIBRARY, ...custom];
}

export async function addCustomExercise(
  coachId: string,
  data: {
    nom: string;
    groupesMusculaires: GroupeMusculaire[];
    materiel: Materiel[];
    sports: Sport[];
    qualitesPhysiques: QualitePhysique[];
    photoUrl?: string | null;
    videoUrl?: string | null;
  }
): Promise<string> {
  const ref = await addDoc(collection(db, "exercises"), {
    coachId,
    icon: "barbell-outline",
    photoUrl: data.photoUrl ?? null,
    videoUrl: data.videoUrl ?? null,
    ...data,
  });
  return ref.id;
}
