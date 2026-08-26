// Calculs agrégés pour le dashboard coach (app/coach/index.tsx). Tout ce qui
// est exposé ici est réellement calculé à partir des données existantes
// (séances, créneaux, bien-être) — rien n'est une valeur d'exemple. Quand
// une métrique demandée par le design (adhérence, charge externe, ACWR
// interne/externe séparés) n'a pas de source de données dans l'app, elle
// n'est volontairement pas ici : l'UI l'affiche comme "à venir" plutôt que
// d'inventer un chiffre.
import { SessionRecord, WellnessEntry } from "./tracking";
import {
  AcwrLevel,
  acwrRiskLevel,
  average,
  buildDailyLoadSeries,
  computeAcuteChronicWorkloadRatio,
  computeMonotony,
  computeStrain,
  computeWellnessScore,
  sumLoads,
  todayKey,
  WellnessStatus,
  wellnessStatus,
} from "./load";

// Évolution en % entre deux totaux consécutifs (ex. cette semaine vs la
// précédente). `null` quand la période précédente est à 0 : un pourcentage
// n'aurait pas de sens ("+∞%"), mieux vaut l'afficher comme "—" côté UI.
export function weekOverWeekDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// Fenêtre [J-13, J-7] et [J-6, J] à partir d'une série de charges quotidiennes
// continue (voir buildDailyLoadSeries) — sert à comparer "cette semaine" à
// "la semaine précédente" pour n'importe quelle métrique dérivée des séances.
export function splitLastTwoWeeks<T extends { date: string }>(
  series: T[]
): { thisWeek: T[]; lastWeek: T[] } {
  const thisWeek = series.slice(-7);
  const lastWeek = series.slice(-14, -7);
  return { thisWeek, lastWeek };
}

function countInRange(items: { date: string }[], dates: Set<string>): number {
  return items.filter((i) => dates.has(i.date)).length;
}

export type CoachKpis = {
  sportifsCount: number;
  sessionsThisWeek: number;
  sessionsDelta: number | null;
  load7d: number;
  loadDelta: number | null;
  wellnessAvg: number | null;
  wellnessDelta: number | null;
};

// KPIs de tête de dashboard. `sessions`/`wellness` = données complètes du
// coach (toutes séances/tous check-ins de tous ses sportifs).
export function computeCoachKpis(
  sportifsCount: number,
  sessions: SessionRecord[],
  wellness: WellnessEntry[]
): CoachKpis {
  const dailyLoads = buildDailyLoadSeries(sessions, 28);
  const { thisWeek, lastWeek } = splitLastTwoWeeks(dailyLoads);
  const load7d = sumLoads(thisWeek);
  const loadPrev7d = sumLoads(lastWeek);

  const thisWeekDates = new Set(thisWeek.map((d) => d.date));
  const lastWeekDates = new Set(lastWeek.map((d) => d.date));
  const sessionsThisWeek = countInRange(sessions, thisWeekDates);
  const sessionsLastWeek = countInRange(sessions, lastWeekDates);

  // Une entrée de bien-être par sportif et par jour : la moyenne de la
  // semaine est donc la moyenne simple des scores tombant dans la fenêtre.
  const wellnessThisWeek = wellness.filter((w) => thisWeekDates.has(w.date)).map((w) => w.score);
  const wellnessLastWeek = wellness.filter((w) => lastWeekDates.has(w.date)).map((w) => w.score);
  const wellnessAvg = wellnessThisWeek.length > 0 ? average(wellnessThisWeek) : null;
  const wellnessAvgPrev = wellnessLastWeek.length > 0 ? average(wellnessLastWeek) : null;

  return {
    sportifsCount,
    sessionsThisWeek,
    sessionsDelta: weekOverWeekDelta(sessionsThisWeek, sessionsLastWeek),
    load7d,
    loadDelta: weekOverWeekDelta(load7d, loadPrev7d),
    wellnessAvg,
    wellnessDelta:
      wellnessAvg !== null && wellnessAvgPrev !== null ? wellnessAvg - wellnessAvgPrev : null,
  };
}

export type SportifStatus = "ok" | "vigilance" | "attention";

// Statut global = le plus sévère entre le risque de charge (ACWR) et l'état
// de forme (bien-être vs moyenne personnelle) — mêmes seuils que le reste de
// l'app (services/load.ts), pas de nouveau barème inventé pour le dashboard.
export function combineStatus(acwr: AcwrLevel, wellness: WellnessStatus | null): SportifStatus {
  if (acwr === "danger" || wellness === "red") return "attention";
  if (acwr === "risque" || wellness === "orange") return "vigilance";
  return "ok";
}

export type SportifRow = {
  uid: string;
  firstName: string;
  lastName: string;
  wellnessScore: number | null;
  load7d: number;
  loadDeltaPercent: number | null;
  status: SportifStatus;
  lastSessionDate: string | null;
};

// Une ligne par sportif pour le tableau "Mes sportifs" — construite à partir
// des mêmes séries que le reste du dashboard, filtrées par sportifId.
export function buildSportifRow(
  sportif: { uid: string; firstName: string; lastName: string },
  sessions: SessionRecord[],
  wellness: WellnessEntry[]
): SportifRow {
  const sportifSessions = sessions.filter((s) => s.sportifId === sportif.uid);
  const dailyLoads = buildDailyLoadSeries(sportifSessions, 28);
  const { thisWeek, lastWeek } = splitLastTwoWeeks(dailyLoads);
  const load7d = sumLoads(thisWeek);
  const loadPrev7d = sumLoads(lastWeek);
  const { acwr } = computeAcuteChronicWorkloadRatio(dailyLoads);
  // Voir computeTrainingLoadStats : sans charge antérieure aux 7 derniers
  // jours, la "chronique" n'a pas de sens et l'ACWR ne doit pas déclencher
  // de statut d'alerte à lui seul.
  const hasEnoughHistory = sumLoads(dailyLoads.slice(0, 21)) > 0;
  const effectiveAcwrLevel = hasEnoughHistory ? acwrRiskLevel(acwr) : "optimale";

  const sportifWellness = wellness
    .filter((w) => w.sportifId === sportif.uid)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latest = sportifWellness[0] ?? null;
  const personalAvg =
    sportifWellness.length > 1 ? average(sportifWellness.slice(1, 15).map((w) => w.score)) : null;

  const lastSessionDate =
    sportifSessions.length > 0
      ? sportifSessions.reduce((max, s) => (s.date > max ? s.date : max), sportifSessions[0].date)
      : null;

  return {
    uid: sportif.uid,
    firstName: sportif.firstName,
    lastName: sportif.lastName,
    wellnessScore: latest?.score ?? null,
    load7d,
    loadDeltaPercent: weekOverWeekDelta(load7d, loadPrev7d),
    status: combineStatus(effectiveAcwrLevel, latest ? wellnessStatus(latest.score, personalAvg) : null),
    lastSessionDate,
  };
}

export type CoachAnalysis = {
  attentionCount: number;
  vigilanceCount: number;
  okCount: number;
  attentionSportifs: string[];
  vigilanceSportifs: string[];
};

// "OZA Analyse" : pas un moteur de recommandation IA, mais une lecture
// automatique et honnête des signaux déjà calculés (ACWR + bien-être) sur
// l'ensemble des sportifs — d'où "situations nécessitant une adaptation"
// plutôt que "alertes".
export function computeCoachAnalysis(rows: SportifRow[]): CoachAnalysis {
  const attention = rows.filter((r) => r.status === "attention");
  const vigilance = rows.filter((r) => r.status === "vigilance");
  const ok = rows.filter((r) => r.status === "ok");
  return {
    attentionCount: attention.length,
    vigilanceCount: vigilance.length,
    okCount: ok.length,
    attentionSportifs: attention.map((r) => `${r.firstName} ${r.lastName}`),
    vigilanceSportifs: vigilance.map((r) => `${r.firstName} ${r.lastName}`),
  };
}

export type TrainingLoadStats = {
  series7d: { date: string; load: number }[];
  series28d: { date: string; load: number }[];
  load7d: number;
  loadDeltaPercent: number | null;
  monotony: number;
  strain: number;
  recoveryDays: number;
  acute: number;
  chronic: number;
  acwr: number;
  acwrLevel: AcwrLevel;
  // Un ACWR n'est fiable que si la charge "chronique" reflète un vrai passé
  // d'entraînement, pas juste la même semaine que la charge "aiguë" — sinon
  // chronic ≈ acute/4 mécaniquement et le ratio explose sans rien dire d'un
  // vrai pic de charge. On exige au moins un peu de charge enregistrée
  // AVANT les 7 derniers jours (jours -8 à -28 de la fenêtre).
  hasEnoughHistory: boolean;
};

export function computeTrainingLoadStats(sessions: SessionRecord[]): TrainingLoadStats {
  const dailyLoads = buildDailyLoadSeries(sessions, 28);
  const { thisWeek, lastWeek } = splitLastTwoWeeks(dailyLoads);
  const load7d = sumLoads(thisWeek);
  const loadPrev7d = sumLoads(lastWeek);
  const { acute, chronic, acwr } = computeAcuteChronicWorkloadRatio(dailyLoads);
  const priorWeeksLoad = sumLoads(dailyLoads.slice(0, 21));

  return {
    series7d: thisWeek,
    series28d: dailyLoads,
    load7d,
    loadDeltaPercent: weekOverWeekDelta(load7d, loadPrev7d),
    monotony: computeMonotony(thisWeek),
    strain: computeStrain(thisWeek),
    recoveryDays: thisWeek.filter((d) => d.load === 0).length,
    hasEnoughHistory: priorWeeksLoad > 0,
    acute,
    chronic,
    acwr,
    acwrLevel: acwrRiskLevel(acwr),
  };
}

export type WellnessBreakdownItem = {
  label: string;
  value: number | null;
  deltaFromLastWeek: number | null;
};

export type WellnessBreakdown = {
  average: number | null;
  items: WellnessBreakdownItem[];
  trendLabel: string;
  series7d: { date: string; value: number }[];
};

// "État des sportifs" + "Évolution du Hooper" : moyenne, par item et par
// jour, de toutes les entrées de bien-être de tous les sportifs du coach.
export function computeWellnessBreakdown(wellness: WellnessEntry[]): WellnessBreakdown {
  const today = todayKey();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const thisWeekSet = new Set(dates);
  const lastWeekDates: string[] = [];
  for (let i = 13; i >= 7; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    lastWeekDates.push(d.toISOString().slice(0, 10));
  }
  const lastWeekSet = new Set(lastWeekDates);

  const thisWeekEntries = wellness.filter((w) => thisWeekSet.has(w.date));
  const lastWeekEntries = wellness.filter((w) => lastWeekSet.has(w.date));

  function itemStats(key: "sommeil" | "fatigue" | "courbatures" | "stress", label: string): WellnessBreakdownItem {
    const current = thisWeekEntries.map((w) => w[key]).filter((v): v is number => v != null);
    const previous = lastWeekEntries.map((w) => w[key]).filter((v): v is number => v != null);
    const value = current.length > 0 ? average(current) : null;
    const prevValue = previous.length > 0 ? average(previous) : null;
    return {
      label,
      value,
      deltaFromLastWeek: value !== null && prevValue !== null ? value - prevValue : null,
    };
  }

  const items = [
    itemStats("sommeil", "Sommeil"),
    itemStats("fatigue", "Fatigue"),
    itemStats("courbatures", "Courbatures"),
    itemStats("stress", "Stress"),
  ];

  const scoresThisWeek = thisWeekEntries.map((w) => w.score);
  const scoresLastWeek = lastWeekEntries.map((w) => w.score);
  const avgThisWeek = scoresThisWeek.length > 0 ? average(scoresThisWeek) : null;
  const avgLastWeek = scoresLastWeek.length > 0 ? average(scoresLastWeek) : null;

  let trendLabel = "Pas assez de données cette semaine pour dégager une tendance.";
  if (avgThisWeek !== null && avgLastWeek !== null) {
    const delta = avgThisWeek - avgLastWeek;
    if (Math.abs(delta) < 0.15) trendLabel = "Tendance générale : stable par rapport à la semaine dernière.";
    else if (delta > 0) trendLabel = "Tendance générale : légère hausse du bien-être.";
    else trendLabel = "Tendance générale : légère baisse du bien-être.";
  }

  const series7d = dates.map((date) => {
    const scores = wellness.filter((w) => w.date === date).map((w) => w.score);
    return { date, value: scores.length > 0 ? average(scores) : 0 };
  });

  return { average: avgThisWeek, items, trendLabel, series7d };
}
