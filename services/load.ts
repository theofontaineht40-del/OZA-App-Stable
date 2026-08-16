export type DailyLoad = {
  date: string; // "YYYY-MM-DD"
  load: number;
};

export type WellnessInput = {
  sommeil: number;
  fatigue: number;
  courbatures: number;
  stress: number;
  humeur: number;
};

export type RiskLevel = "low" | "medium" | "high";

export type AcwrLevel = "sous-charge" | "optimale" | "risque" | "danger";

export function todayKey(reference: Date = new Date()): string {
  return reference.toISOString().slice(0, 10);
}

export function computeSessionLoad(rpe: number, durationMinutes: number): number {
  return rpe * durationMinutes;
}

// Convention: 5 = excellent état, 1 = très mauvais, pour les 5 items.
// Le score global est donc toujours "plus haut = mieux".
export function computeWellnessScore(input: WellnessInput): number {
  const { sommeil, fatigue, courbatures, stress, humeur } = input;
  return (sommeil + fatigue + courbatures + stress + humeur) / 5;
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = average(values);
  const variance = average(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance);
}

export function sumLoads(loads: DailyLoad[]): number {
  return loads.reduce((sum, d) => sum + d.load, 0);
}

// Construit une série continue de charges quotidiennes (jours sans séance = 0),
// nécessaire pour des calculs ACWR / monotony fiables.
export function buildDailyLoadSeries(
  sessions: { date: string; load: number }[],
  days: number,
  referenceDate: Date = new Date()
): DailyLoad[] {
  const loadByDate = new Map<string, number>();
  for (const session of sessions) {
    loadByDate.set(session.date, (loadByDate.get(session.date) ?? 0) + session.load);
  }

  const series: DailyLoad[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    series.push({ date: key, load: loadByDate.get(key) ?? 0 });
  }
  return series;
}

export function computeAcuteChronicWorkloadRatio(last28Days: DailyLoad[]) {
  const last7 = last28Days.slice(-7);
  const acute = average(last7.map((d) => d.load));
  const chronic = average(last28Days.map((d) => d.load));
  const acwr = chronic > 0 ? acute / chronic : 0;
  return { acute, chronic, acwr };
}

export function computeMonotony(last7Days: DailyLoad[]): number {
  const values = last7Days.map((d) => d.load);
  const mean = average(values);
  const sd = standardDeviation(values);
  return sd > 0 ? mean / sd : 0;
}

export function computeStrain(last7Days: DailyLoad[]): number {
  const weeklyTotal = sumLoads(last7Days);
  const monotony = computeMonotony(last7Days);
  return weeklyTotal * monotony;
}

export function acwrRiskLevel(acwr: number): AcwrLevel {
  if (acwr < 0.8) return "sous-charge";
  if (acwr <= 1.3) return "optimale";
  if (acwr <= 1.5) return "risque";
  return "danger";
}

export function monotonyRiskLevel(monotony: number): RiskLevel {
  if (monotony === 0) return "low";
  if (monotony < 1.5) return "low";
  if (monotony <= 2) return "medium";
  return "high";
}

// ── Interprétation du bien-être (Hooper) ──
// Échelle 1-5 par item, "plus haut = mieux" (cf. computeWellnessScore).

export type WellnessStatus = "green" | "orange" | "red";

// Le statut se base en priorité sur l'écart à la moyenne personnelle du
// sportif (un score de 3,1 n'est pas alarmant dans l'absolu, mais l'est si
// ce sportif tourne habituellement à 4,2) plutôt que sur un seuil universel.
// Sans historique suffisant (< 5 entrées), on retombe sur des seuils absolus
// raisonnables pour ne pas laisser le statut indéfini.
export function wellnessStatus(current: number, personalAverage: number | null): WellnessStatus {
  if (personalAverage !== null) {
    const delta = current - personalAverage;
    if (delta <= -1.0) return "red";
    if (delta <= -0.4) return "orange";
    return "green";
  }
  if (current >= 3.5) return "green";
  if (current >= 2.5) return "orange";
  return "red";
}

export type WellnessTrendStats = {
  average: number;
  min: number;
  max: number;
  trendPercent: number; // évolution seconde moitié vs première moitié de la fenêtre
};

export function computeWellnessTrendStats(scores: number[]): WellnessTrendStats {
  if (scores.length === 0) {
    return { average: 0, min: 0, max: 0, trendPercent: 0 };
  }
  const avg = average(scores);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  if (scores.length < 4) {
    return { average: avg, min, max, trendPercent: 0 };
  }
  const mid = Math.floor(scores.length / 2);
  const firstHalfAvg = average(scores.slice(0, mid));
  const secondHalfAvg = average(scores.slice(mid));
  const trendPercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  return { average: avg, min, max, trendPercent };
}

// Détecte une tendance directionnelle soutenue en fin de série (plateaux
// tolérés) : ex. [4,4,3,3,2,2,2] → { direction: "down", days: 7 }. Ne
// remonte une tendance que sur au moins 3 jours pour éviter le bruit.
export function detectConsecutiveTrend(
  scoresChronological: number[],
  minDays = 3
): { direction: "up" | "down"; days: number } | null {
  const n = scoresChronological.length;
  if (n < minDays) return null;

  let downDays = 1;
  for (let i = n - 1; i > 0; i--) {
    if (scoresChronological[i] <= scoresChronological[i - 1]) downDays++;
    else break;
  }
  if (downDays >= minDays) return { direction: "down", days: downDays };

  let upDays = 1;
  for (let i = n - 1; i > 0; i--) {
    if (scoresChronological[i] >= scoresChronological[i - 1]) upDays++;
    else break;
  }
  if (upDays >= minDays) return { direction: "up", days: upDays };

  return null;
}
