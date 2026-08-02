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
  discoverable: boolean;
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
    discoverable: data.discoverable ?? false,
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

export async function getDiscoverableCoaches(): Promise<CoachProfile[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "coach"),
    where("discoverable", "==", true)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalize(d.id, d.data()));
}
