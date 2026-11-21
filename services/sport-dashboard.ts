import { AthleteProfile } from "./athlete-profile";
import {
  acwrRiskLevel,
  average,
  buildDailyLoadSeries,
  computeAcuteChronicWorkloadRatio,
  todayKey,
} from "./load";
import { SessionRecord } from "./tracking";

// Familles de sports : chacune a ses propres indicateurs d'accueil. Un sport
// ajouté plus tard dans Firestore retombe sur « collectif » tant qu'il n'est
// pas classé ici.
export type SportFamily = "collectif" | "endurance" | "force";

const FAMILY: Record<string, SportFamily> = {
  rugby: "collectif",
  football: "collectif",
  basket: "collectif",
  handball: "collectif",
  volley: "collectif",
  tennis: "collectif",
  combat: "collectif",
  course: "endurance",
  athletisme: "endurance",
  natation: "endurance",
  cyclisme: "endurance",
  triathlon: "endurance",
  hyrox: "endurance",
  musculation: "force",
  crossfit: "force",
};

export function familyOf(sportId: string): SportFamily {
  return FAMILY[sportId] ?? "collectif";
}

export const FAMILY_LABEL: Record<SportFamily, string> = {
  collectif: "Suivi sport collectif",
  endurance: "Suivi endurance",
  force: "Suivi force et physique",
};

export type Tone = "good" | "warn" | "bad" | "neutral";
export type Indicator = { key: string; label: string; value: string; sub?: string; tone: Tone };

export type WellnessPoint = { date: string; score: number };

function shiftDay(key: string, delta: number): string {
  const d = new Date(`${key}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return todayKey(d);
}

function toNumber(value: string | undefined): number {
  const n = parseFloat((value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Tonnage approximatif : séries × répétitions × charge max de chaque exercice.
export function tonnage(sessions: SessionRecord[]): number {
  let total = 0;
  for (const s of sessions) {
    for (const log of s.exerciseLogs ?? []) {
      total += toNumber(log.seriesReelles) * toNumber(log.repetitionsReelles) * toNumber(log.chargeReelle);
    }
  }
  return Math.round(total);
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export type DashboardStats = {
  sessions7: SessionRecord[];
  sessionsPrev7: SessionRecord[];
  sessions28: SessionRecord[];
  load7: number;
  rpe7: number | null;
  minutes7: number;
  acwr: number | null;
  wellness7: number | null;
  wellnessPrev: number | null;
  weeksActive: number;
};

export function computeStats(sessions: SessionRecord[], wellness: WellnessPoint[], today = todayKey()): DashboardStats {
  const d6 = shiftDay(today, -6);
  const d7 = shiftDay(today, -7);
  const d13 = shiftDay(today, -13);
  const d27 = shiftDay(today, -27);
  const sessions7 = sessions.filter((s) => s.date >= d6 && s.date <= today);
  const sessionsPrev7 = sessions.filter((s) => s.date >= d13 && s.date <= d7);
  const sessions28 = sessions.filter((s) => s.date >= d27 && s.date <= today);

  let acwr: number | null = null;
  if (sessions28.length >= 3) {
    const { acwr: ratio } = computeAcuteChronicWorkloadRatio(buildDailyLoadSeries(sessions28, 28));
    acwr = ratio > 0 ? ratio : null;
  }

  const avg = (from: string, to: string) => {
    const list = wellness.filter((w) => w.date >= from && w.date <= to).map((w) => w.score);
    return list.length ? average(list) : null;
  };

  let weeksActive = 0;
  for (let w = 0; w < 4; w++) {
    const from = shiftDay(today, -(w * 7 + 6));
    const to = shiftDay(today, -(w * 7));
    if (sessions.some((s) => s.date >= from && s.date <= to)) weeksActive++;
  }

  return {
    sessions7,
    sessionsPrev7,
    sessions28,
    load7: sessions7.reduce((sum, s) => sum + s.load, 0),
    rpe7: sessions7.length ? average(sessions7.map((s) => s.rpe)) : null,
    minutes7: sessions7.reduce((sum, s) => sum + s.duration, 0),
    acwr,
    wellness7: avg(d6, today),
    wellnessPrev: avg(d13, d7),
    weeksActive,
  };
}

function wellnessIndicator(stats: DashboardStats): Indicator {
  const w = stats.wellness7;
  return {
    key: "fraicheur",
    label: "Fraîcheur",
    value: w === null ? "—" : `${w.toFixed(1)}/10`,
    sub: w === null ? "Fais un check-in" : "Bien-être moyen 7 j",
    tone: w === null ? "neutral" : w >= 7 ? "good" : w >= 5 ? "warn" : "bad",
  };
}

function intensityIndicator(stats: DashboardStats): Indicator {
  const r = stats.rpe7;
  return {
    key: "intensite",
    label: "Intensité",
    value: r === null ? "—" : `${r.toFixed(1)}/10`,
    sub: "RPE moyen 7 j",
    tone: r === null ? "neutral" : r >= 9 ? "bad" : r >= 8 ? "warn" : "neutral",
  };
}

function sessionsIndicator(stats: DashboardStats, planned: number | null): Indicator {
  const n = stats.sessions7.length;
  return {
    key: "seances",
    label: "Séances",
    value: planned ? `${n}/${planned}` : String(n),
    sub: planned ? "cette semaine vs objectif" : "sur 7 jours",
    tone: planned ? (n >= planned ? "good" : n === 0 ? "warn" : "neutral") : "neutral",
  };
}

export function buildIndicators(family: SportFamily, stats: DashboardStats, profile: AthleteProfile): Indicator[] {
  const planned = profile.seancesParSemaine;

  if (family === "endurance") {
    return [
      { key: "volume", label: "Volume 7 j", value: stats.minutes7 ? formatMinutes(stats.minutes7) : "—", sub: "temps d'entraînement", tone: "neutral" },
      sessionsIndicator(stats, planned),
      {
        key: "regularite",
        label: "Régularité",
        value: `${stats.weeksActive}/4`,
        sub: "semaines actives sur 4",
        tone: stats.weeksActive >= 3 ? "good" : stats.weeksActive >= 2 ? "warn" : "neutral",
      },
      intensityIndicator(stats),
    ];
  }

  if (family === "force") {
    const t7 = tonnage(stats.sessions7);
    const tPrev = tonnage(stats.sessionsPrev7);
    const delta = tPrev > 0 ? Math.round(((t7 - tPrev) / tPrev) * 100) : null;
    return [
      sessionsIndicator(stats, planned),
      {
        key: "tonnage",
        label: "Tonnage 7 j",
        value: t7 ? `${t7.toLocaleString("fr-FR")} kg` : "—",
        sub: "séries × reps × charge",
        tone: "neutral",
      },
      {
        key: "progression",
        label: "Progression",
        value: delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta} %`,
        sub: "tonnage vs semaine d'avant",
        tone: delta === null ? "neutral" : delta >= 0 ? "good" : "warn",
      },
      wellnessIndicator(stats),
    ];
  }

  // collectif
  const level = stats.acwr === null ? null : acwrRiskLevel(stats.acwr);
  return [
    { key: "charge", label: "Charge 7 j", value: stats.load7 ? `${Math.round(stats.load7)} u.a.` : "—", sub: "RPE × minutes", tone: "neutral" },
    {
      key: "equilibre",
      label: "Équilibre de charge",
      value: stats.acwr === null ? "—" : stats.acwr.toFixed(2),
      sub: level ?? "il faut ~3 séances",
      tone: level === null ? "neutral" : level === "optimale" ? "good" : level === "sous-charge" ? "warn" : "bad",
    },
    intensityIndicator(stats),
    wellnessIndicator(stats),
  ];
}

// ── Conseil de la semaine (règles simples, aucune IA) ──

export type AdviceVerdict = "reprise" | "alleger" | "maintenir" | "progresser";

export type Advice = {
  verdict: AdviceVerdict;
  title: string;
  reasons: string[];
  suggestion: string;
};

export function weeklyAdvice(stats: DashboardStats, profile: AthleteProfile): Advice {
  const planned = profile.seancesParSemaine;
  const n7 = stats.sessions7.length;
  const reasons: string[] = [];
  const add = (text: string | null) => text && reasons.push(text);

  const limitNote =
    profile.limitations && profile.limitations.length > 0
      ? `Limitation déclarée : ${profile.limitations}. Remplace tout exercice qui la sollicite.`
      : null;

  // 1. Pas de séance récente : on reprend progressivement.
  const d13 = shiftDay(todayKey(), -13);
  if (!stats.sessions28.some((s) => s.date >= d13)) {
    add("Aucune séance enregistrée depuis 2 semaines.");
    add(limitNote);
    return {
      verdict: "reprise",
      title: "Reprends en douceur",
      reasons,
      suggestion: "Commence par 2 séances de 30 à 40 min à intensité modérée (RPE 5-6), puis augmente la semaine suivante.",
    };
  }

  // 2. Signaux de fatigue : on allège.
  let tired = false;
  if (stats.acwr !== null && stats.acwr > 1.5) {
    tired = true;
    add(`Ta charge de la semaine est nettement au-dessus de ton habitude (ratio ${stats.acwr.toFixed(2)}).`);
  }
  if (stats.wellness7 !== null && stats.wellness7 < 5) {
    tired = true;
    add(`Ton bien-être moyen est bas (${stats.wellness7.toFixed(1)}/10).`);
  }
  if (stats.wellness7 !== null && stats.wellnessPrev !== null && stats.wellness7 - stats.wellnessPrev <= -1.5) {
    tired = true;
    add("Ton bien-être a nettement baissé par rapport à la semaine dernière.");
  }
  if (stats.rpe7 !== null && stats.rpe7 >= 9) {
    tired = true;
    add(`Tes séances sont très dures en ce moment (RPE moyen ${stats.rpe7.toFixed(1)}).`);
  }
  if (tired) {
    add(limitNote);
    return {
      verdict: "alleger",
      title: "Allège cette semaine",
      reasons,
      suggestion: "Réduis le volume de 20 à 30 % (une série de moins par exercice), garde de la marge à l'effort et soigne ton sommeil.",
    };
  }

  // 3. Tout va bien et la régularité est là : on progresse.
  const regular = planned ? n7 >= planned : n7 >= 2;
  const fresh = stats.wellness7 === null || stats.wellness7 >= 6.5;
  const loadOk = stats.acwr === null || (stats.acwr >= 0.8 && stats.acwr <= 1.3);
  if (regular && fresh && loadOk) {
    add(planned ? `Tu as fait ${n7} séance${n7 > 1 ? "s" : ""} sur ${planned} prévues.` : `${n7} séances sur les 7 derniers jours.`);
    if (stats.wellness7 !== null) add(`Bonne forme (${stats.wellness7.toFixed(1)}/10).`);
    if (stats.acwr !== null) add("Ta charge est équilibrée.");
    add(limitNote);
    return {
      verdict: "progresser",
      title: "Tu peux progresser",
      reasons,
      suggestion: "Ajoute environ 5 % de charge, ou une série sur tes deux exercices principaux. Garde le reste identique.",
    };
  }

  // 4. Sinon on consolide.
  if (planned && n7 < planned) {
    const left = planned - n7;
    add(`Il te reste ${left} séance${left > 1 ? "s" : ""} pour atteindre tes ${planned} de la semaine.`);
  }
  if (stats.acwr !== null && stats.acwr < 0.8) add("Ta charge est plus faible que d'habitude.");
  add(limitNote);
  return {
    verdict: "maintenir",
    title: "Garde le rythme",
    reasons,
    suggestion: "Garde les mêmes charges et vise la régularité : c'est elle qui fait progresser.",
  };
}
