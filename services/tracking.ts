import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import {
  computeSessionLoad,
  computeWellnessScore,
  todayKey,
  WellnessInput,
} from "./load";

export type WellnessEntry = WellnessInput & {
  sportifId: string;
  date: string;
  score: number;
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus

export function generateCoachCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export type CoachInfo = {
  uid: string;
  firstName: string;
  lastName: string;
};

// Recherche un coach par son code unique, sans effet de bord : le
// rattachement (principal ou spécialiste) est décidé par l'appelant,
// voir services/relations.ts.
export async function findCoachByCode(code: string): Promise<CoachInfo | null> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "coach"),
    where("coachCode", "==", code.trim().toUpperCase())
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const coachDoc = snap.docs[0];
  const coachData = coachDoc.data();

  return {
    uid: coachDoc.id,
    firstName: coachData.firstName,
    lastName: coachData.lastName,
  };
}

export type SportifSummary = {
  uid: string;
  firstName: string;
  lastName: string;
};

export async function getMySportifs(coachUid: string): Promise<SportifSummary[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "sportif"),
    where("coachId", "==", coachUid)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    uid: d.id,
    firstName: d.data().firstName,
    lastName: d.data().lastName,
  }));
}

export type ExerciseLog = {
  exerciceNom: string;
  seriesPrescrites: string;
  repetitionsPrescrites: string;
  seriesReelles: string;
  repetitionsReelles: string;
  chargeReelle: string;
  complete: boolean;
};

export type ProgrammeInfo = {
  programmeId: string;
  programmeNom: string;
  seanceNom: string;
  exerciseLogs: ExerciseLog[];
};

export type SessionRecord = {
  id: string;
  sportifId: string;
  coachId: string | null;
  date: string;
  rpe: number;
  duration: number;
  load: number;
  commentaire: string | null;
  loggedBy: "sportif" | "coach";
  programmeId: string | null;
  programmeNom: string | null;
  seanceNom: string | null;
  exerciseLogs: ExerciseLog[] | null;
};

function toSessionRecord(id: string, data: any): SessionRecord {
  return {
    id,
    sportifId: data.sportifId,
    coachId: data.coachId ?? null,
    date: data.date,
    rpe: data.rpe,
    duration: data.duration,
    load: data.load,
    commentaire: data.commentaire ?? null,
    loggedBy: data.loggedBy ?? "sportif",
    programmeId: data.programmeId ?? null,
    programmeNom: data.programmeNom ?? null,
    seanceNom: data.seanceNom ?? null,
    exerciseLogs: data.exerciseLogs ?? null,
  };
}

export async function addSession(params: {
  sportifUid: string;
  coachId: string | null;
  rpe: number;
  duration: number;
  commentaire?: string;
  loggedBy?: "sportif" | "coach";
  programmeInfo?: ProgrammeInfo;
}): Promise<SessionRecord> {
  const { sportifUid, coachId, rpe, duration, programmeInfo } = params;
  const commentaire = params.commentaire?.trim() || null;
  const loggedBy = params.loggedBy ?? "sportif";
  const load = computeSessionLoad(rpe, duration);
  const date = todayKey();

  const docRef = await addDoc(collection(db, "sessions"), {
    sportifId: sportifUid,
    coachId,
    date,
    rpe,
    duration,
    load,
    commentaire,
    loggedBy,
    programmeId: programmeInfo?.programmeId ?? null,
    programmeNom: programmeInfo?.programmeNom ?? null,
    seanceNom: programmeInfo?.seanceNom ?? null,
    exerciseLogs: programmeInfo?.exerciseLogs ?? null,
    createdAt: new Date(),
  });

  return {
    id: docRef.id,
    sportifId: sportifUid,
    coachId,
    date,
    rpe,
    duration,
    load,
    commentaire,
    loggedBy,
    programmeId: programmeInfo?.programmeId ?? null,
    programmeNom: programmeInfo?.programmeNom ?? null,
    seanceNom: programmeInfo?.seanceNom ?? null,
    exerciseLogs: programmeInfo?.exerciseLogs ?? null,
  };
}

export async function getSessionsForCoach(coachUid: string): Promise<SessionRecord[]> {
  const q = query(collection(db, "sessions"), where("coachId", "==", coachUid));
  const snap = await getDocs(q);
  const sessions = snap.docs.map((d) => toSessionRecord(d.id, d.data()));
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getSessionsForSportif(sportifUid: string): Promise<SessionRecord[]> {
  const q = query(collection(db, "sessions"), where("sportifId", "==", sportifUid));
  const snap = await getDocs(q);
  const sessions = snap.docs.map((d) => toSessionRecord(d.id, d.data()));
  return sessions.sort((a, b) => b.date.localeCompare(a.date));
}

export async function addWellnessEntry(
  sportifUid: string,
  input: WellnessInput,
  coachId: string | null = null
): Promise<number> {
  const score = computeWellnessScore(input);
  const date = todayKey();

  // Un seul enregistrement de bien-être par jour et par sportif (upsert).
  await setDoc(doc(db, "wellness", `${sportifUid}_${date}`), {
    sportifId: sportifUid,
    coachId,
    date,
    ...input,
    score,
    createdAt: new Date(),
  });

  return score;
}

export async function getLatestWellnessScore(sportifUid: string): Promise<number | null> {
  const snap = await getDoc(doc(db, "wellness", `${sportifUid}_${todayKey()}`));
  if (!snap.exists()) return null;
  return snap.data().score ?? null;
}

export async function getWellnessForSportif(
  sportifUid: string
): Promise<{ date: string; score: number }[]> {
  const q = query(collection(db, "wellness"), where("sportifId", "==", sportifUid));
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => ({ date: d.data().date, score: d.data().score }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// Le coach ne peut pas interroger `wellness` filtré par sportifId (règles
// Firestore : seul un filtre sur coachId est prouvable pour une liste). On
// récupère donc tout son propre périmètre puis on filtre côté client.
export async function getWellnessForCoach(coachUid: string): Promise<WellnessEntry[]> {
  const q = query(collection(db, "wellness"), where("coachId", "==", coachUid));
  const snap = await getDocs(q);

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        sportifId: data.sportifId,
        date: data.date,
        score: data.score,
        sommeil: data.sommeil,
        fatigue: data.fatigue,
        courbatures: data.courbatures,
        stress: data.stress,
        humeur: data.humeur,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
