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
  computeHooperValues,
  computeSessionLoad,
  computeWellnessScore,
  todayKey,
  WellnessInput,
} from "./load";

export type WellnessEntry = WellnessInput & {
  sportifId: string;
  date: string;
  score: number;
  hooperSommeil: number;
  hooperStress: number;
  hooperFatigue: number;
  hooperCourbatures: number;
  hooperIndex: number;
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
  // Profil créé par le coach lui-même (services/relations.ts::createManagedSportif),
  // sans compte ni accès à l'app — pour les clients qui ne l'utiliseront jamais
  // eux-mêmes (ex. public senior). Le coach saisit tout à sa place.
  managed?: boolean;
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
    managed: d.data().managed ?? false,
  }));
}

export type SetLog = {
  repetitions: string;
  charge: string;
};

export type ExerciseLog = {
  exerciceNom: string;
  seriesPrescrites: string;
  repetitionsPrescrites: string;
  // seriesReelles/repetitionsReelles/chargeReelle restent le résumé agrégé
  // (nombre de séries réellement faites, charge max de la séance...) —
  // c'est ce que lisent detectPersonalRecords et tous les graphiques de
  // progression existants, donc on continue de les remplir même quand
  // `sets` est renseigné, pour ne rien casser sur les séances déjà
  // enregistrées avant l'ajout de la saisie série par série.
  seriesReelles: string;
  repetitionsReelles: string;
  chargeReelle: string;
  // Détail série par série (Hevy-like) — absent sur les séances enregistrées
  // avant cet ajout, donc toujours optionnel.
  sets?: SetLog[];
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

export type PersonalRecord = {
  exerciceNom: string;
  value: number;
  previousBest: number;
};

// Un "record battu" suppose une charge précédente à dépasser : la première
// fois qu'un exercice est loggé, ce n'est pas encore un record (rien à
// comparer), donc on ignore les exercices sans historique antérieur.
export function detectPersonalRecords(
  pastSessions: SessionRecord[],
  newExerciseLogs: ExerciseLog[]
): PersonalRecord[] {
  const previousMax: Record<string, number> = {};
  for (const session of pastSessions) {
    for (const log of session.exerciseLogs ?? []) {
      const value = parseFloat(log.chargeReelle);
      if (isNaN(value)) continue;
      if (!(log.exerciceNom in previousMax) || value > previousMax[log.exerciceNom]) {
        previousMax[log.exerciceNom] = value;
      }
    }
  }

  const records: PersonalRecord[] = [];
  for (const log of newExerciseLogs) {
    const value = parseFloat(log.chargeReelle);
    if (isNaN(value)) continue;
    const previousBest = previousMax[log.exerciceNom];
    if (previousBest !== undefined && value > previousBest) {
      records.push({ exerciceNom: log.exerciceNom, value, previousBest });
    }
  }
  return records;
}

// La localisation des courbatures/gênes est purement informative : elle
// n'entre ni dans le hooper_index ni dans l'ACWR (voir app/sportif/checkin.tsx).
// Stockée telle quelle (pas de note d'intensité par zone) pour permettre côté
// coach deux traitements distincts : zones musculaires récurrentes → ajuster
// le volume de la séance suivante ; toute zone articulaire cochée → alerte
// prioritaire (technique / décharge / avis professionnel de santé).
export type SorenessInput = {
  typeGene: ("musculaire" | "articulaire")[];
  zonesMusculaires: string[];
  zonesArticulaires: string[];
};

const EMPTY_SORENESS: SorenessInput = { typeGene: [], zonesMusculaires: [], zonesArticulaires: [] };

export async function addWellnessEntry(
  sportifUid: string,
  input: WellnessInput,
  coachId: string | null = null,
  soreness: SorenessInput = EMPTY_SORENESS,
  // Toujours aujourd'hui pour le check-in normal (app/sportif/checkin.tsx) —
  // un coach qui importe un historique réel (ex. depuis un tableur déjà
  // rempli) peut passer une date passée explicite pour la reconstituer telle
  // quelle, plutôt que tout dater du jour de l'import.
  date: string = todayKey()
): Promise<number> {
  const score = computeWellnessScore(input);
  const hooper = computeHooperValues(input);

  // Un seul enregistrement de bien-être par jour et par sportif (upsert).
  // Les champs sommeil/stress/fatigue/courbatures restent au format affiché
  // (10 = bon état) pour rester compatibles avec les colonnes déjà utilisées
  // pour le suivi de charge ; les valeurs Hooper (sens inverse) et l'index
  // total sont stockés à côté, jamais à la place.
  await setDoc(doc(db, "wellness", `${sportifUid}_${date}`), {
    sportifId: sportifUid,
    coachId,
    date,
    ...input,
    score,
    hooperSommeil: hooper.sommeil,
    hooperStress: hooper.stress,
    hooperFatigue: hooper.fatigue,
    hooperCourbatures: hooper.courbatures,
    hooperIndex: hooper.hooperIndex,
    typeGene: soreness.typeGene,
    zonesMusculaires: soreness.zonesMusculaires,
    zonesArticulaires: soreness.zonesArticulaires,
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
        hooperSommeil: data.hooperSommeil,
        hooperStress: data.hooperStress,
        hooperFatigue: data.hooperFatigue,
        hooperCourbatures: data.hooperCourbatures,
        hooperIndex: data.hooperIndex,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
