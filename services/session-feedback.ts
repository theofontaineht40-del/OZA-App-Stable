import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";

import { db } from "../firebase";
import { addDays } from "./schedule";
import { SessionRecord } from "./tracking";

// Retour du coach sur une séance réalisée. Un seul par séance : son id est
// celui de la séance, donc réécrire le retour le met à jour.
export type SessionFeedback = {
  id: string; // = id de la séance
  sportifId: string;
  coachId: string;
  coachName: string;
  sessionDate: string;
  sessionLabel: string;
  text: string;
  createdAt: number; // ms
  seenAt: number | null; // ms, posé quand le sportif l'a lu
};

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return typeof value === "number" ? value : 0;
}

function toFeedback(id: string, d: Record<string, any>): SessionFeedback {
  return {
    id,
    sportifId: d.sportifId,
    coachId: d.coachId,
    coachName: d.coachName ?? "",
    sessionDate: d.sessionDate ?? "",
    sessionLabel: d.sessionLabel ?? "",
    text: d.text ?? "",
    createdAt: toMillis(d.createdAt),
    seenAt: d.seenAt ? toMillis(d.seenAt) : null,
  };
}

// Les règles n'autorisent que des lectures filtrées (jamais "tout lire").
export async function getFeedbackForCoach(coachId: string): Promise<SessionFeedback[]> {
  const snap = await getDocs(query(collection(db, "sessionFeedback"), where("coachId", "==", coachId)));
  return snap.docs.map((d) => toFeedback(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getFeedbackForSportif(sportifId: string): Promise<SessionFeedback[]> {
  const snap = await getDocs(query(collection(db, "sessionFeedback"), where("sportifId", "==", sportifId)));
  return snap.docs.map((d) => toFeedback(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
}

export function sessionLabel(session: Pick<SessionRecord, "programmeNom" | "seanceNom">): string {
  return session.seanceNom ?? session.programmeNom ?? "Séance libre";
}

export async function saveSessionFeedback(
  session: SessionRecord,
  coachId: string,
  coachName: string,
  text: string
): Promise<void> {
  await setDoc(doc(db, "sessionFeedback", session.id), {
    sportifId: session.sportifId,
    coachId,
    coachName,
    sessionDate: session.date,
    sessionLabel: sessionLabel(session),
    text: text.trim(),
    createdAt: new Date(),
    seenAt: null,
  });
}

export async function deleteSessionFeedback(feedbackId: string): Promise<void> {
  await deleteDoc(doc(db, "sessionFeedback", feedbackId));
}

export async function markFeedbackSeen(feedbackId: string): Promise<void> {
  await setDoc(doc(db, "sessionFeedback", feedbackId), { seenAt: new Date() }, { merge: true });
}

// Séances récentes faites par le sportif lui-même, sans retour du coach.
// Les séances saisies par le coach (loggedBy "coach") n'en ont pas besoin.
export function pendingFeedbackSessions(
  sessions: SessionRecord[],
  feedbacks: SessionFeedback[],
  today: string,
  windowDays = 10
): SessionRecord[] {
  const answered = new Set(feedbacks.map((f) => f.id));
  const since = addDays(today, -windowDays);
  return sessions
    .filter((s) => s.loggedBy === "sportif" && s.date >= since && !answered.has(s.id))
    .sort((a, b) => b.date.localeCompare(a.date));
}
