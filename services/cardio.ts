import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase";

// ── Séance cardio : intervalles exprimés en % d'une référence ──

export type CardioModalite = "course" | "velo" | "rameur" | "ski" | "autre";

export const MODALITES: { key: CardioModalite; label: string }[] = [
  { key: "course", label: "Course" },
  { key: "velo", label: "Vélo" },
  { key: "rameur", label: "Rameur" },
  { key: "ski", label: "SkiErg" },
  { key: "autre", label: "Autre" },
];

// La référence sur laquelle les pourcentages s'appliquent.
export type CardioRef = "vma" | "pma" | "fc";

export const CARDIO_REFS: { key: CardioRef; label: string; unit: string; hint: string }[] = [
  { key: "vma", label: "% VMA", unit: "km/h", hint: "Vitesse maximale aérobie (course)" },
  { key: "pma", label: "% PMA", unit: "W", hint: "Puissance maximale aérobie (vélo, rameur)" },
  { key: "fc", label: "% FC max", unit: "bpm", hint: "Fréquence cardiaque maximale" },
];

// Un segment = "reps × (effort puis récupération)". Un échauffement ou un
// retour au calme est un segment à 1 répétition sans récupération.
export type CardioSegment = {
  nom: string;
  reps: number;
  effortSec: number;
  effortPct: number;
  recupSec: number;
  recupPct: number;
};

export type CardioSpec = {
  modalite: CardioModalite;
  ref: CardioRef;
  segments: CardioSegment[];
};

export type CardioReferences = {
  vma: number | null; // km/h
  pma: number | null; // W
  fcMax: number | null; // bpm
};

// ── Texte ──

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  const rest = s % 60;
  return rest === 0 ? `${min} min` : `${min} min ${rest} s`;
}

export function describeSegment(seg: CardioSegment): string {
  const effort = `${formatDuration(seg.effortSec)} à ${seg.effortPct} %`;
  const recup = seg.recupSec > 0 ? ` / ${formatDuration(seg.recupSec)} à ${seg.recupPct} %` : "";
  const body = seg.reps > 1 ? `${seg.reps} × (${effort}${recup})` : `${effort}${recup}`;
  return seg.nom.trim() ? `${seg.nom.trim()} : ${body}` : body;
}

export function totalDurationSec(spec: CardioSpec): number {
  return spec.segments.reduce((sum, s) => sum + s.reps * (s.effortSec + s.recupSec), 0);
}

export function describeSpec(spec: CardioSpec): string {
  const modalite = MODALITES.find((m) => m.key === spec.modalite)?.label ?? "";
  const ref = CARDIO_REFS.find((r) => r.key === spec.ref)?.label ?? "";
  return `${modalite} · ${ref} · ${formatDuration(totalDurationSec(spec))}`;
}

// Valeur cible concrète d'un pourcentage ("16,5 km/h"), ou null tant que la
// référence du sportif n'est pas renseignée.
export function targetFor(ref: CardioRef, pct: number, refs: CardioReferences): string | null {
  const base = ref === "vma" ? refs.vma : ref === "pma" ? refs.pma : refs.fcMax;
  if (!base || !(pct >= 0)) return null;
  const value = (base * pct) / 100;
  if (ref === "vma") return `${(Math.round(value * 10) / 10).toString().replace(".", ",")} km/h`;
  if (ref === "pma") return `${Math.round(value)} W`;
  return `${Math.round(value)} bpm`;
}

export function isValidSegment(seg: CardioSegment): boolean {
  return (
    seg.reps >= 1 &&
    seg.effortSec > 0 &&
    seg.effortPct >= 0 &&
    seg.recupSec >= 0 &&
    seg.recupPct >= 0
  );
}

// ── Références du sportif (VMA, PMA, FC max) ──

const EMPTY_REFS: CardioReferences = { vma: null, pma: null, fcMax: null };

export async function getCardioReferences(sportifId: string): Promise<CardioReferences> {
  const snap = await getDoc(doc(db, "cardioReferences", sportifId));
  if (!snap.exists()) return EMPTY_REFS;
  const d = snap.data();
  return { vma: d.vma ?? null, pma: d.pma ?? null, fcMax: d.fcMax ?? null };
}

export async function saveCardioReferences(
  coachId: string,
  sportifId: string,
  refs: CardioReferences
): Promise<void> {
  await setDoc(doc(db, "cardioReferences", sportifId), {
    coachId,
    sportifId,
    ...refs,
    updatedAt: new Date(),
  });
}
