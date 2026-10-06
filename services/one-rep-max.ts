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

// ── Estimation du 1RM ──

export type Formula = "epley" | "brzycki" | "lombardi" | "oconner";

export const FORMULAS: { key: Formula; label: string }[] = [
  { key: "epley", label: "Epley" },
  { key: "brzycki", label: "Brzycki" },
  { key: "lombardi", label: "Lombardi" },
  { key: "oconner", label: "O'Conner" },
];

// Au-delà de 10 répétitions l'estimation devient peu fiable, au-delà de 12
// elle n'est pas calculée (même règle que la plateforme ProSportConcept).
export const MAX_RELIABLE_REPS = 10;
export const MAX_COMPUTABLE_REPS = 12;

export function estimateOneRepMax(charge: number, reps: number, formula: Formula): number | null {
  if (!(charge > 0) || !(reps >= 1) || reps > MAX_COMPUTABLE_REPS) return null;
  if (reps === 1) return charge;
  switch (formula) {
    case "epley":
      return charge * (1 + reps / 30);
    case "brzycki":
      return (charge * 36) / (37 - reps);
    case "lombardi":
      return charge * Math.pow(reps, 0.1);
    case "oconner":
      return charge * (1 + 0.025 * reps);
  }
}

// "3-1-1-0", "2/0/2/0" ou "3110" : somme des phases (X = explosif = 0 s)
// = durée de tension d'une répétition, en secondes. null si illisible.
export function tempoSecondsPerRep(tempo: string): number | null {
  const parts = tempo
    .trim()
    .toUpperCase()
    .split(/[-/\s]+/)
    .filter(Boolean);
  const tokens = parts.length === 1 && parts[0].length === 4 ? parts[0].split("") : parts;
  if (tokens.length !== 4) return null;
  let total = 0;
  for (const t of tokens) {
    if (t === "X") continue;
    const n = Number(t);
    if (!Number.isFinite(n) || n < 0) return null;
    total += n;
  }
  return total;
}

// Un tempo lent réduit les répétitions possibles à charge égale : à même
// résultat, le 1RM réel est donc plus élevé. Correction indicative —
// +1,5 % par seconde de tension au-delà de 2 s par répétition, plafonnée à
// +12 %. Désactivée par défaut.
export const TEMPO_CORRECTION_PER_SECOND = 0.015;
export const TEMPO_CORRECTION_CAP = 0.12;

export function applyTempoCorrection(oneRm: number, tempo: string): number {
  const seconds = tempoSecondsPerRep(tempo);
  if (seconds === null || seconds <= 2) return oneRm;
  const bonus = Math.min((seconds - 2) * TEMPO_CORRECTION_PER_SECOND, TEMPO_CORRECTION_CAP);
  return oneRm * (1 + bonus);
}

export function roundKg(value: number): number {
  return Math.round(value * 2) / 2; // au demi-kilo
}

// ── Stockage ──

export type OneRepMaxRecord = {
  id: string;
  sportifId: string;
  coachId: string;
  exerciceId: string;
  exerciceNom: string;
  date: string; // YYYY-MM-DD
  charge: number;
  reps: number;
  formula: Formula;
  tempo: string | null;
  tempoCorrected: boolean;
  oneRm: number;
  commentaire: string | null;
  // Le 1RM "de référence" d'un exercice : un seul par (sportif, exercice).
  isReference: boolean;
};

function toRecord(id: string, d: Record<string, any>): OneRepMaxRecord {
  return {
    id,
    sportifId: d.sportifId,
    coachId: d.coachId,
    exerciceId: d.exerciceId,
    exerciceNom: d.exerciceNom,
    date: d.date,
    charge: d.charge,
    reps: d.reps,
    formula: d.formula,
    tempo: d.tempo ?? null,
    tempoCorrected: !!d.tempoCorrected,
    oneRm: d.oneRm,
    commentaire: d.commentaire ?? null,
    isReference: !!d.isReference,
  };
}

// Côté coach : le filtre coachId est exigé par les règles Firestore (un
// sportif a une autre requête, voir getOneRepMaxesForSportif).
export async function getOneRepMaxesForCoach(
  coachId: string,
  sportifId: string
): Promise<OneRepMaxRecord[]> {
  const q = query(
    collection(db, "oneRepMaxes"),
    where("coachId", "==", coachId),
    where("sportifId", "==", sportifId)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => toRecord(d.id, d.data()))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getOneRepMaxesForSportif(sportifId: string): Promise<OneRepMaxRecord[]> {
  const q = query(collection(db, "oneRepMaxes"), where("sportifId", "==", sportifId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toRecord(d.id, d.data()));
}

// exerciceId → 1RM de référence (kg).
export function referenceMap(records: OneRepMaxRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    if (r.isReference) map.set(r.exerciceId, r.oneRm);
  }
  return map;
}

export async function addOneRepMax(
  data: Omit<OneRepMaxRecord, "id" | "isReference">,
  makeReference: boolean,
  existing: OneRepMaxRecord[]
): Promise<void> {
  const ref = await addDoc(collection(db, "oneRepMaxes"), { ...data, isReference: false });
  if (makeReference) await setReference(ref.id, data.exerciceId, existing);
}

// Un seul 1RM de référence par exercice : on retire le drapeau aux autres.
export async function setReference(
  id: string,
  exerciceId: string,
  records: OneRepMaxRecord[]
): Promise<void> {
  for (const r of records) {
    if (r.exerciceId === exerciceId && r.isReference && r.id !== id) {
      await setDoc(doc(db, "oneRepMaxes", r.id), { isReference: false }, { merge: true });
    }
  }
  await setDoc(doc(db, "oneRepMaxes", id), { isReference: true }, { merge: true });
}

export async function deleteOneRepMax(id: string): Promise<void> {
  await deleteDoc(doc(db, "oneRepMaxes", id));
}
