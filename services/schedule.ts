import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

// Planning par jour : le coach pose des séances (d'un programme du sportif,
// ou "libres") sur des dates précises. Le statut (faite / en retard / ...)
// n'est jamais stocké : il est déduit des séances réellement enregistrées
// (voir computeScheduleStatuses), donc il reste juste quel que soit le chemin
// par lequel la séance a été saisie (sportif, ou coach en direct).
export type ScheduledSession = {
  id: string;
  coachId: string;
  sportifId: string;
  date: string; // YYYY-MM-DD
  kind: "programme" | "libre";
  titre: string;
  programmeId: string | null;
  programmeNom: string | null;
  seanceId: string | null;
  seanceNom: string | null;
};

export type ScheduleStatus = "done" | "late" | "today" | "upcoming";

// ── Dates (calendrier local, midi pour éviter tout décalage d'heure d'été) ──

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12);
}

function format(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + days);
  return format(d);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((parse(toIso).getTime() - parse(fromIso).getTime()) / 86_400_000);
}

export function mondayOf(iso: string): string {
  const d = parse(iso);
  const fromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - fromMonday);
  return format(d);
}

export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// Numéro de semaine ISO 8601.
export function isoWeekNumber(iso: string): number {
  const d = parse(iso);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day + 3); // jeudi de la semaine
  const firstThursday = new Date(d.getFullYear(), 0, 4, 12);
  const firstDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDay + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
}

// ── Statut déduit des séances réalisées ──

export type DoneSession = {
  date: string;
  programmeId: string | null;
  seanceId?: string | null;
  seanceNom: string | null;
};

// Tolérance : une séance faite jusqu'à 3 jours AVANT sa date prévue compte
// encore pour elle (le sportif a avancé sa séance).
const EARLY_TOLERANCE_DAYS = 3;

function compatible(item: ScheduledSession, s: DoneSession): boolean {
  if (item.kind === "libre") return s.date === item.date;
  if (!item.programmeId || s.programmeId !== item.programmeId) return false;
  if (s.seanceId) return s.seanceId === item.seanceId;
  // Séances enregistrées avant l'ajout de seanceId : repli sur le nom.
  return s.seanceNom === item.seanceNom;
}

// Chaque séance réalisée valide AU PLUS une séance prévue : celle dont la
// date est la plus proche de la sienne (à égalité, la plus ancienne). Une
// séance prévue jamais réalisée est "en retard" une fois sa date dépassée.
export function computeScheduleStatuses(
  items: ScheduledSession[],
  sessions: DoneSession[],
  today: string
): Map<string, ScheduleStatus> {
  const done = new Set<string>();
  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));

  for (const s of sortedSessions) {
    let best: ScheduledSession | null = null;
    let bestGap = Infinity;
    for (const item of sortedItems) {
      if (done.has(item.id) || !compatible(item, s)) continue;
      if (daysBetween(s.date, item.date) > EARLY_TOLERANCE_DAYS) continue; // prévue bien plus tard
      const gap = Math.abs(daysBetween(item.date, s.date));
      if (gap < bestGap) {
        best = item;
        bestGap = gap;
      }
    }
    if (best) done.add(best.id);
  }

  const result = new Map<string, ScheduleStatus>();
  for (const item of items) {
    if (done.has(item.id)) result.set(item.id, "done");
    else if (item.date < today) result.set(item.id, "late");
    else if (item.date === today) result.set(item.id, "today");
    else result.set(item.id, "upcoming");
  }
  return result;
}

export type ScheduleSummary = { done: number; toDo: number; late: number };

// "toDo" = pas encore faites et pas en retard (aujourd'hui + à venir).
export function summarize(
  items: ScheduledSession[],
  statuses: Map<string, ScheduleStatus>
): ScheduleSummary {
  const summary: ScheduleSummary = { done: 0, toDo: 0, late: 0 };
  for (const item of items) {
    const st = statuses.get(item.id);
    if (st === "done") summary.done++;
    else if (st === "late") summary.late++;
    else summary.toDo++;
  }
  return summary;
}

// ── Stockage ──

function toItem(id: string, d: Record<string, any>): ScheduledSession {
  return {
    id,
    coachId: d.coachId,
    sportifId: d.sportifId,
    date: d.date,
    kind: d.kind === "libre" ? "libre" : "programme",
    titre: d.titre ?? "",
    programmeId: d.programmeId ?? null,
    programmeNom: d.programmeNom ?? null,
    seanceId: d.seanceId ?? null,
    seanceNom: d.seanceNom ?? null,
  };
}

// Tout le planning d'un coach (tous sportifs) : sert aux indicateurs du
// dashboard. Le filtre coachId est exigé par les règles Firestore.
export async function getScheduledForCoach(coachId: string): Promise<ScheduledSession[]> {
  const snap = await getDocs(query(collection(db, "scheduledSessions"), where("coachId", "==", coachId)));
  return snap.docs.map((d) => toItem(d.id, d.data())).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getScheduledForSportif(sportifId: string): Promise<ScheduledSession[]> {
  const snap = await getDocs(
    query(collection(db, "scheduledSessions"), where("sportifId", "==", sportifId))
  );
  return snap.docs.map((d) => toItem(d.id, d.data())).sort((a, b) => a.date.localeCompare(b.date));
}

export async function addScheduledSession(
  data: Omit<ScheduledSession, "id">
): Promise<void> {
  await addDoc(collection(db, "scheduledSessions"), { ...data, createdAt: new Date() });
}

export async function deleteScheduledSession(id: string): Promise<void> {
  await deleteDoc(doc(db, "scheduledSessions", id));
}

// Recopie les séances d'une semaine (lundi → dimanche) sur la semaine
// suivante, aux mêmes jours.
export async function copyWeekToNext(items: ScheduledSession[], monday: string): Promise<number> {
  const week = new Set(weekDates(monday));
  const toCopy = items.filter((i) => week.has(i.date));
  for (const i of toCopy) {
    const { id: _id, ...rest } = i;
    await addScheduledSession({ ...rest, date: addDays(i.date, 7) });
  }
  return toCopy.length;
}
