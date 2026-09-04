import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";

import { Specialite } from "../constants/specialites";
import { db, storage } from "../firebase";

export type CoachProfile = {
  uid: string;
  firstName: string;
  lastName: string;
  coachCode: string;
  bio: string;
  photoUrl: string | null;
  specialites: Specialite[];
  tarifHoraire: number | null;
  ville: string;
  entreprise: string;
  discoverable: boolean;
  // Logo de la salle/structure du coach — optionnel, distinct de la photo de
  // profil personnelle. Utilisé sur les PDF de programme générés (voir
  // services/programme-pdf.ts) quand il est renseigné, sinon le PDF garde
  // sa décoration par défaut.
  structureLogoUrl: string | null;
};

function normalize(uid: string, data: any): CoachProfile {
  return {
    uid,
    firstName: data.firstName ?? "",
    lastName: data.lastName ?? "",
    coachCode: data.coachCode ?? "",
    bio: data.bio ?? "",
    photoUrl: data.photoUrl ?? null,
    specialites: data.specialites ?? [],
    tarifHoraire: data.tarifHoraire ?? null,
    ville: data.ville ?? "",
    entreprise: data.entreprise ?? "",
    discoverable: data.discoverable ?? false,
    structureLogoUrl: data.structureLogoUrl ?? null,
  };
}

export async function getCoachProfile(coachId: string): Promise<CoachProfile | null> {
  const snap = await getDoc(doc(db, "users", coachId));
  if (!snap.exists()) return null;
  return normalize(snap.id, snap.data());
}

export async function updateCoachPublicProfile(
  coachId: string,
  data: {
    bio: string;
    specialites: Specialite[];
    tarifHoraire: number | null;
    ville: string;
    entreprise: string;
    discoverable: boolean;
  }
): Promise<void> {
  await setDoc(doc(db, "users", coachId), data, { merge: true });
}

export async function uploadCoachPhoto(coachId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const fileRef = storageRef(storage, `coach-profiles/${coachId}.jpg`);
  await uploadBytes(fileRef, blob);
  const url = await getDownloadURL(fileRef);
  await setDoc(doc(db, "users", coachId), { photoUrl: url }, { merge: true });
  return url;
}

export async function uploadCoachStructureLogo(coachId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const fileRef = storageRef(storage, `coach-structure-logos/${coachId}.jpg`);
  await uploadBytes(fileRef, blob);
  const url = await getDownloadURL(fileRef);
  await setDoc(doc(db, "users", coachId), { structureLogoUrl: url }, { merge: true });
  return url;
}

export async function removeCoachStructureLogo(coachId: string): Promise<void> {
  await setDoc(doc(db, "users", coachId), { structureLogoUrl: null }, { merge: true });
}

export async function getDiscoverableCoaches(): Promise<CoachProfile[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "coach"),
    where("discoverable", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalize(d.id, d.data()));
}
