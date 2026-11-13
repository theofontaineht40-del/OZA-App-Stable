// Plan de course sur mesure (5 km → marathon), exprimé en % de VMA.
//
// Le plan remonte depuis la date de course :
//  1. Développement (~45 % des semaines hors affûtage) : endurance
//     fondamentale, VMA courte, seuil court ; la sortie longue s'allonge.
//  2. Spécifique : VMA longue ou seuil, et travail à l'allure de course.
//  3. Affûtage (1 à 3 semaines selon la distance) : volume réduit d'environ
//     40 %, intensité conservée, puis la course.
// Une semaine sur 4 est allégée (-25 %) pendant les phases 1 et 2. Avec une
// blessure dans les 12 derniers mois, la sortie longue progresse plus
// lentement. Les débutants n'ont qu'une séance de qualité par semaine.
//
// Chaque séance devient une séance cardio du planning du sportif
// (ScheduledSession kind "cardio") : il la voit avec ses cibles en km/h.

import { CardioSegment, CardioSpec } from "./cardio";

export type RaceDistance = "5k" | "10k" | "semi" | "marathon";
export type RaceNiveau = "debutant" | "intermediaire" | "confirme";

export const RACE_DISTANCES: { key: RaceDistance; label: string; km: number; defaultWeeks: number }[] = [
  { key: "5k", label: "5 km", km: 5, defaultWeeks: 8 },
  { key: "10k", label: "10 km", km: 10, defaultWeeks: 10 },
  { key: "semi", label: "Semi-marathon", km: 21.1, defaultWeeks: 12 },
  { key: "marathon", label: "Marathon", km: 42.195, defaultWeeks: 16 },
];

export const RACE_NIVEAUX: { key: RaceNiveau; label: string }[] = [
  { key: "debutant", label: "Débutant" },
  { key: "intermediaire", label: "Intermédiaire" },
  { key: "confirme", label: "Confirmé" },
];

export type RacePlanParams = {
  distance: RaceDistance;
  niveau: RaceNiveau;
  raceDate: string; // YYYY-MM-DD
  semaines: number; // 6 à 24 (raccourci si la course est plus proche)
  jours: number[]; // 0 = lundi … 6 = dimanche ; la sortie longue va sur le dernier
  vma: number | null; // km/h, pour estimer le temps de course
  blessure: boolean;
  today: string; // YYYY-MM-DD
};

export type RacePhase = "developpement" | "specifique" | "affutage" | "course";

export const PHASE_LABEL: Record<RacePhase, string> = {
  developpement: "Développement",
  specifique: "Spécifique",
  affutage: "Affûtage",
  course: "Semaine de course",
};

export type RaceSession = {
  date: string;
  semaine: number; // 0-based
  titre: string;
  spec: CardioSpec;
  kind: "ef" | "qualite" | "longue" | "course";
};

export type RacePlanWeek = { index: number; monday: string; phase: RacePhase; allegee: boolean; minutes: number };

export type RacePlan = {
  semaines: RacePlanWeek[];
  sessions: RaceSession[];
  notes: string[];
  tempsEstime: string | null;
  // La course est trop proche pour la durée choisie : le plan a été raccourci.
  raccourci: boolean;
};

// Allure de course en % de VMA selon la distance (repères classiques).
const RACE_PCT: Record<RaceDistance, number> = { "5k": 95, "10k": 90, semi: 85, marathon: 78 };

// Sortie longue : de / à (minutes), avant ajustement par niveau.
const LONG_RUN: Record<RaceDistance, [number, number]> = {
  "5k": [40, 65],
  "10k": [45, 80],
  semi: [55, 110],
  marathon: [70, 150],
};

const TAPER_WEEKS: Record<RaceDistance, number> = { "5k": 1, "10k": 1, semi: 2, marathon: 3 };

const NIVEAU_FACTOR: Record<RaceNiveau, number> = { debutant: 0.8, intermediaire: 1, confirme: 1.12 };

// ── Dates (même convention que services/schedule.ts : midi local) ──

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12);
}
function format(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function addDays(iso: string, days: number): string {
  const d = parse(iso);
  d.setDate(d.getDate() + days);
  return format(d);
}
function mondayOf(iso: string): string {
  const d = parse(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return format(d);
}

// ── Segments ──

const min = (m: number) => Math.round(m * 60);

function seg(nom: string, reps: number, effortSec: number, effortPct: number, recupSec = 0, recupPct = 0): CardioSegment {
  return { nom, reps, effortSec, effortPct, recupSec, recupPct };
}

const WARMUP = seg("Échauffement", 1, min(15), 65);
const COOLDOWN = seg("Retour au calme", 1, min(10), 60);

function spec(segments: CardioSegment[]): CardioSpec {
  return { modalite: "course", ref: "vma", segments };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function round5(n: number): number {
  return Math.max(5, Math.round(n / 5) * 5);
}

export function formatRaceTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);
  if (h > 0) return `${h} h ${String(m).padStart(2, "0")}`;
  return `${m} min ${String(s).padStart(2, "0")}`;
}

// ── Séances de qualité ──

type Quality = "vma_courte" | "vma_longue" | "seuil" | "specifique";

function quality(q: Quality, t: number, distance: RaceDistance, niveau: RaceNiveau, light: number): { titre: string; segments: CardioSegment[] } {
  const deb = niveau === "debutant";
  const conf = niveau === "confirme";
  switch (q) {
    case "vma_courte": {
      const reps = Math.round(lerp(deb ? 6 : 8, deb ? 12 : conf ? 20 : 16, t) * light);
      return {
        titre: `${reps} × 30/30 VMA`,
        segments: [WARMUP, seg("30/30", Math.max(4, reps), 30, deb ? 100 : 105, 30, 50), COOLDOWN],
      };
    }
    case "vma_longue": {
      const effort = t < 0.5 ? 2 : 3;
      const reps = Math.round(lerp(deb ? 4 : 5, deb ? 5 : conf ? 7 : 6, t) * light);
      return {
        titre: `${reps} × ${effort} min VMA longue`,
        segments: [WARMUP, seg("VMA longue", Math.max(3, reps), min(effort), 97, min(effort / 2 + 0.5), 50), COOLDOWN],
      };
    }
    case "seuil": {
      const blocks = t < 0.5 ? 3 : 2;
      const each = round5(lerp(deb ? 6 : 8, deb ? 10 : conf ? 20 : 15, t) * light);
      return {
        titre: `Seuil ${blocks} × ${each} min`,
        segments: [WARMUP, seg("Seuil", blocks, min(each), deb ? 82 : 86, min(2), 60), COOLDOWN],
      };
    }
    case "specifique": {
      const pct = RACE_PCT[distance];
      const [reps, from, to]: [number, number, number] =
        distance === "5k" ? [5, 3, 4] : distance === "10k" ? [3, 6, 10] : distance === "semi" ? [2, 10, 20] : [2, 20, 35];
      const each = Math.max(2, Math.round(lerp(from, to, t) * light * (deb ? 0.8 : 1)));
      const r = distance === "5k" ? reps + (t > 0.5 ? 1 : 0) : reps;
      return {
        titre: `Allure course ${r} × ${each} min`,
        segments: [WARMUP, seg("Allure course", r, min(each), pct, min(2), 60), COOLDOWN],
      };
    }
  }
}

// ── Génération ──

export function generateRacePlan(p: RacePlanParams): RacePlan {
  const notes: string[] = [];
  const dist = RACE_DISTANCES.find((d) => d.key === p.distance)!;
  const raceMonday = mondayOf(p.raceDate);
  const thisMonday = mondayOf(p.today);
  const weeksAvailable = Math.floor((parse(raceMonday).getTime() - parse(thisMonday).getTime()) / (7 * 86_400_000)) + 1;
  const wanted = Math.min(24, Math.max(6, p.semaines));
  const W = Math.max(1, Math.min(wanted, weeksAvailable));
  const raccourci = W < wanted;
  const firstMonday = addDays(raceMonday, -7 * (W - 1));
  const jours = [...p.jours].sort((a, b) => a - b);
  const deb = p.niveau === "debutant";

  const taper = Math.min(TAPER_WEEKS[p.distance], Math.max(0, W - 2));
  const build = W - taper; // la dernière semaine (course) fait partie de l'affûtage si taper ≥ 1
  const dev = Math.max(1, Math.ceil((build - (taper === 0 ? 1 : 0)) * 0.45));

  const [l0, l1] = LONG_RUN[p.distance];
  const factor = NIVEAU_FACTOR[p.niveau];
  const longFrom = l0 * factor;
  // Le plafond de sortie longue ne dépasse jamais le repère de la distance
  // (ex. 2 h 30 pour un marathon), même pour un confirmé.
  const longTo = l1 * Math.min(1, factor) * (p.blessure ? 0.9 : 1);
  const efBase = deb ? 35 : p.niveau === "confirme" ? 50 : 45;
  const racePct = RACE_PCT[p.distance];

  const semaines: RacePlanWeek[] = [];
  const sessions: RaceSession[] = [];
  let lastLong = longFrom;

  for (let w = 0; w < W; w++) {
    const monday = addDays(firstMonday, w * 7);
    const isRaceWeek = w === W - 1;
    const phase: RacePhase = isRaceWeek ? "course" : w >= build ? "affutage" : w < dev ? "developpement" : "specifique";
    const allegee = phase !== "affutage" && phase !== "course" && w % 4 === 3 && w < build - 1;
    const light = phase === "affutage" ? 0.6 : phase === "course" ? 0.5 : allegee ? 0.75 : 1;

    // Progression de la sortie longue, plafonnée à +10 % par semaine
    // (+5 % après une blessure).
    const t = build > 1 ? w / (build - 1) : 1;
    const maxStep = p.blessure ? 1.05 : 1.1;
    let longMin = Math.min(lerp(longFrom, longTo, t), lastLong * maxStep);
    if (phase === "developpement" || phase === "specifique") lastLong = Math.max(lastLong, longMin);
    longMin = round5(longMin * light);

    // Rôle de chaque jour de la semaine.
    const n = jours.length;
    const roles: ("ef" | "q1" | "q2" | "long")[] =
      n === 2 ? ["q1", "long"]
      : n === 3 ? ["q1", "ef", "long"]
      : n === 4 ? ["q1", "ef", "q2", "long"]
      : n === 5 ? ["ef", "q1", "ef", "q2", "long"]
      : ["ef", "q1", "ef", "q2", "ef", "long"];

    const phaseT =
      phase === "developpement" ? (dev > 1 ? w / (dev - 1) : 1)
      : phase === "specifique" ? (build - dev > 1 ? (w - dev) / (build - dev - 1) : 1)
      : 1;

    const q1: Quality =
      phase === "developpement" ? "vma_courte"
      : phase === "specifique" ? (deb ? "specifique" : p.distance === "5k" || p.distance === "10k" ? "vma_longue" : "seuil")
      : "specifique";
    const q2: Quality | null =
      deb ? null
      : phase === "developpement" ? "seuil"
      : phase === "specifique" ? "specifique"
      : "vma_courte";

    let weekMinutes = 0;
    jours.forEach((d, i) => {
      const date = addDays(monday, d);
      // Semaine de course : rien après la course, ni la veille (repos), et
      // pas de sortie longue.
      if (isRaceWeek && date >= p.raceDate) return;
      if (isRaceWeek && date === addDays(p.raceDate, -1)) return;
      // Pas de séance dans le passé (semaine en cours déjà entamée).
      if (date < p.today) return;
      let role = roles[i];
      // Semaine de course : un seul rappel d'allure, le reste en footing.
      if (isRaceWeek && (role === "long" || role === "q2")) role = "ef";
      if (role === "q2" && !q2) role = "ef";

      let titre: string;
      let segments: CardioSegment[];
      let kind: RaceSession["kind"];
      if (role === "long") {
        kind = "longue";
        // En spécifique semi/marathon : fin de sortie longue à l'allure course.
        const finish = phase === "specifique" && (p.distance === "semi" || p.distance === "marathon") && !allegee && phaseT > 0.3;
        const finishMin = finish ? round5(longMin * 0.25) : 0;
        segments = finish
          ? [seg("Endurance fondamentale", 1, min(longMin - finishMin), 67), seg("Fin à l'allure course", 1, min(finishMin), racePct)]
          : [seg("Endurance fondamentale", 1, min(longMin), 67)];
        titre = finish ? `Sortie longue ${longMin} min dont ${finishMin} min allure course` : `Sortie longue ${longMin} min`;
      } else if (role === "ef") {
        kind = "ef";
        const efMin = round5(lerp(efBase, efBase + 10, phaseT) * light);
        segments = [seg("Endurance fondamentale", 1, min(efMin), 67)];
        titre = `Footing ${efMin} min`;
      } else {
        kind = "qualite";
        const q = role === "q1" ? q1 : q2!;
        const built = quality(q, phaseT, p.distance, p.niveau, isRaceWeek ? 0.5 : light);
        titre = built.titre;
        segments = built.segments;
      }
      if (allegee) titre += " (semaine allégée)";
      const s = spec(segments);
      weekMinutes += s.segments.reduce((sum, x) => sum + x.reps * (x.effortSec + x.recupSec), 0) / 60;
      sessions.push({ date, semaine: w, titre: `S${w + 1} · ${titre}`, spec: s, kind });
    });

    // La course elle-même.
    if (isRaceWeek) {
      const raceSec = p.vma ? Math.round((dist.km / ((p.vma * racePct) / 100)) * 3600) : min(dist.km * 6);
      const raceSpec = spec([seg("Échauffement", 1, min(p.distance === "marathon" ? 10 : 15), 65), seg(`Course ${dist.label}`, 1, raceSec, racePct)]);
      sessions.push({ date: p.raceDate, semaine: w, titre: `🏁 Course · ${dist.label}`, spec: raceSpec, kind: "course" });
      weekMinutes += raceSec / 60;
    }

    semaines.push({ index: w, monday, phase, allegee, minutes: Math.round(weekMinutes) });
  }

  // Notes pour le coach.
  if (raccourci) {
    notes.push(`La course est dans ${W} semaine${W > 1 ? "s" : ""} : le plan a été raccourci (${wanted} demandées).`);
  }
  if (W < 6) notes.push("Moins de 6 semaines : préparation express, viser surtout la régularité et l'allure.");
  notes.push(
    `${PHASE_LABEL.developpement} → ${PHASE_LABEL.specifique} → ${PHASE_LABEL.affutage} : la sortie longue passe de ${round5(longFrom)} à ${round5(
      Math.max(...sessions.filter((s) => s.kind === "longue").map((s) => s.spec.segments.reduce((a, x) => a + x.effortSec, 0) / 60), longFrom)
    )} min.`
  );
  if (deb) notes.push("Débutant : une seule séance de qualité par semaine, le reste en endurance fondamentale.");
  if (p.blessure) notes.push("Blessure récente : progression du volume limitée à +5 % par semaine et sortie longue plafonnée.");
  notes.push("Une semaine sur 4 est allégée (-25 %) pour assimiler la charge.");
  notes.push(`Allure course : ${racePct} % de VMA. Footings et sortie longue à environ 67 % de VMA (aisance respiratoire).`);
  if (!p.vma) notes.push("Renseigne la VMA du sportif (Références cardio) pour qu'il voie ses allures en km/h et une estimation de temps.");

  const tempsEstime = p.vma ? formatRaceTime((dist.km / ((p.vma * racePct) / 100)) * 3600) : null;

  return { semaines, sessions: sessions.sort((a, b) => a.date.localeCompare(b.date)), notes, tempsEstime, raccourci };
}
