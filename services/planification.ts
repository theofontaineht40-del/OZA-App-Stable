import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase";

export type PlanBlock = {
  id: string;
  label: string;
  startWeek: number;
  endWeek: number;
  programmeId: string | null;
};

export type Planification = {
  objectif: string;
  niveau: string;
  startDate: string | null;
  competitionDate: string | null;
  weeksTotal: number;
  seancesParSemaine: number;
  blocks: PlanBlock[];
};

const EMPTY: Planification = {
  objectif: "",
  niveau: "",
  startDate: null,
  competitionDate: null,
  weeksTotal: 8,
  seancesParSemaine: 3,
  blocks: [],
};

export async function getPlanification(sportifId: string): Promise<Planification> {
  const snap = await getDoc(doc(db, "planifications", sportifId));
  if (!snap.exists()) return EMPTY;
  const data = snap.data();
  return {
    objectif: data.objectif ?? "",
    niveau: data.niveau ?? "",
    startDate: data.startDate ?? null,
    competitionDate: data.competitionDate ?? null,
    weeksTotal: data.weeksTotal ?? 8,
    seancesParSemaine: data.seancesParSemaine ?? 3,
    blocks: (data.blocks ?? []).map((b: PlanBlock) => ({
      ...b,
      programmeId: b.programmeId ?? null,
    })),
  };
}

export async function savePlanification(
  sportifId: string,
  planification: Planification
): Promise<void> {
  await setDoc(doc(db, "planifications", sportifId), {
    ...planification,
    updatedAt: new Date(),
  });
}

export function newBlockId(): string {
  return `block_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export function dateForWeek(startDate: string, week: number): Date {
  const base = new Date(`${startDate}T00:00:00`);
  base.setDate(base.getDate() + (week - 1) * 7);
  return base;
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function blockDateRange(startDate: string, startWeek: number, endWeek: number): string {
  const start = dateForWeek(startDate, startWeek);
  const end = dateForWeek(startDate, endWeek + 1);
  end.setDate(end.getDate() - 1);
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}
