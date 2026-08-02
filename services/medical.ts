import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import { todayKey } from "./load";

export type MedicalProfile = {
  antecedents: string;
  pathologies: string;
  sexe: string;
  ageBracket: string;
};

export async function getMedicalProfile(sportifId: string): Promise<MedicalProfile> {
  const snap = await getDoc(doc(db, "medicalProfiles", sportifId));
  if (!snap.exists()) return { antecedents: "", pathologies: "", sexe: "", ageBracket: "" };
  const data = snap.data();
  return {
    antecedents: data.antecedents ?? "",
    pathologies: data.pathologies ?? "",
    sexe: data.sexe ?? "",
    ageBracket: data.ageBracket ?? "",
  };
}

export async function updateMedicalProfile(
  sportifId: string,
  profile: MedicalProfile
): Promise<void> {
  await setDoc(
    doc(db, "medicalProfiles", sportifId),
    { ...profile, updatedAt: new Date() },
    { merge: true }
  );
}

export type Injury = {
  id: string;
  zone: string;
  type: string;
  gravite: number;
  statut: "active" | "guerie";
  notes: string;
  date: string;
};

export async function addInjury(
  sportifId: string,
  injury: Omit<Injury, "id" | "date">
): Promise<void> {
  await addDoc(collection(db, "medicalProfiles", sportifId, "injuries"), {
    ...injury,
    date: todayKey(),
    createdAt: new Date(),
  });
}

export async function getInjuries(sportifId: string): Promise<Injury[]> {
  const snap = await getDocs(
    collection(db, "medicalProfiles", sportifId, "injuries")
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Injury, "id">) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export type PainPoint = {
  id: string;
  zone: string;
  view: "face" | "dos";
  intensity: number;
  notes: string;
  date: string;
};

export async function addPainPoint(
  sportifId: string,
  point: Omit<PainPoint, "id" | "date">
): Promise<void> {
  await addDoc(collection(db, "medicalProfiles", sportifId, "painPoints"), {
    ...point,
    date: todayKey(),
    createdAt: new Date(),
  });
}

export async function getPainPoints(sportifId: string): Promise<PainPoint[]> {
  const snap = await getDocs(
    collection(db, "medicalProfiles", sportifId, "painPoints")
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PainPoint, "id">) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Ne garde que le dernier point renseigné par zone, pour l'affichage de la cartographie actuelle.
export function latestIntensityByZone(points: PainPoint[]): Record<string, number> {
  const latest: Record<string, PainPoint> = {};
  for (const point of points) {
    const current = latest[point.zone];
    if (!current || point.date > current.date) {
      latest[point.zone] = point;
    }
  }

  const result: Record<string, number> = {};
  for (const zone in latest) {
    result[zone] = latest[zone].intensity;
  }
  return result;
}
