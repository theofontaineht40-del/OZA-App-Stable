import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";

import { db, storage } from "../firebase";
import { PosturalView } from "../constants/postural-anomalies";

export type AnomalyPoint = {
  key: string;
  x: number; // pourcentage horizontal sur la photo
  y: number; // pourcentage vertical sur la photo
};

export type ViewData = {
  photoUrl: string | null;
  anomalies: AnomalyPoint[];
};

export type PosturalAssessment = {
  face: ViewData;
  profil: ViewData;
  dos: ViewData;
};

const EMPTY_VIEW: ViewData = { photoUrl: null, anomalies: [] };

export async function getPosturalAssessment(sportifId: string): Promise<PosturalAssessment> {
  const snap = await getDoc(doc(db, "posturalAssessments", sportifId));
  if (!snap.exists()) {
    return { face: EMPTY_VIEW, profil: EMPTY_VIEW, dos: EMPTY_VIEW };
  }
  const data = snap.data();
  return {
    face: data.face ?? EMPTY_VIEW,
    profil: data.profil ?? EMPTY_VIEW,
    dos: data.dos ?? EMPTY_VIEW,
  };
}

export async function uploadPosturalPhoto(
  sportifId: string,
  view: PosturalView,
  localUri: string
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();

  const fileRef = storageRef(storage, `postural/${sportifId}/${view}.jpg`);
  await uploadBytes(fileRef, blob);
  const url = await getDownloadURL(fileRef);

  await setDoc(
    doc(db, "posturalAssessments", sportifId),
    { [view]: { photoUrl: url, anomalies: [] }, updatedAt: new Date() },
    { merge: true }
  );

  return url;
}

export async function addAnomalyPoint(
  sportifId: string,
  view: PosturalView,
  point: AnomalyPoint,
  currentAnomalies: AnomalyPoint[]
): Promise<void> {
  await updateDoc(doc(db, "posturalAssessments", sportifId), {
    [`${view}.anomalies`]: [...currentAnomalies, point],
    updatedAt: new Date(),
  });
}

export async function removeAnomalyPoint(
  sportifId: string,
  view: PosturalView,
  index: number,
  currentAnomalies: AnomalyPoint[]
): Promise<void> {
  const next = currentAnomalies.filter((_, i) => i !== index);
  await updateDoc(doc(db, "posturalAssessments", sportifId), {
    [`${view}.anomalies`]: next,
    updatedAt: new Date(),
  });
}
