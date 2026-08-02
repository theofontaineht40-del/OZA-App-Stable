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
