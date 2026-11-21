// Calculs de VMA : reprise des formules du tableur du coach
// (« distance et temps pour calcul en fonction de la VMA »).
//   vitesse (m/s)  = VMA (km/h) / 3,6 × % VMA
//   distance (m)   = vitesse × durée (s)
//   durée (s)      = distance / vitesse
// TypeScript pur : utilisable par le moteur, les tests et l'interface.

const KMH_TO_MS = 1 / 3.6;

export function speedAtPct(vmaKmh: number, pctVma: number): number {
  return vmaKmh * (pctVma / 100); // km/h
}

// Distance (m) parcourue pendant `seconds` à `pctVma` % de la VMA.
export function distanceForDuration(vmaKmh: number, pctVma: number, seconds: number): number {
  return speedAtPct(vmaKmh, pctVma) * KMH_TO_MS * seconds;
}

// Temps (s) pour parcourir `meters` à `pctVma` % de la VMA.
export function timeForDistance(vmaKmh: number, pctVma: number, meters: number): number {
  const v = speedAtPct(vmaKmh, pctVma) * KMH_TO_MS;
  return v > 0 ? meters / v : Infinity;
}

// Pourcentage de VMA correspondant à une distance couverte en un temps donné.
export function pctForTime(vmaKmh: number, meters: number, seconds: number): number {
  const v = vmaKmh * KMH_TO_MS;
  return v > 0 && seconds > 0 ? (meters / seconds / v) * 100 : 0;
}

// Temps au kilomètre (s) à `pctVma` % de la VMA.
export function secondsPerKm(vmaKmh: number, pctVma: number): number {
  return timeForDistance(vmaKmh, pctVma, 1000);
}

// « 1 min 15 », « 45 s », « 2 min 08 ».
export function formatMinSec(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r} s`;
  return r === 0 ? `${m} min` : `${m} min ${String(r).padStart(2, "0")}`;
}

export type IntermittentSpec = {
  fastSeconds: number;
  fastPct: number;
  slowSeconds: number;
  slowPct: number;
};

// Distances à parcourir pour un intermittent (ex. 30"/30") à partir de la VMA.
export function intermittentDistances(vmaKmh: number, spec: IntermittentSpec): { fastMeters: number; slowMeters: number } {
  return {
    fastMeters: distanceForDuration(vmaKmh, spec.fastPct, spec.fastSeconds),
    slowMeters: distanceForDuration(vmaKmh, spec.slowPct, spec.slowSeconds),
  };
}
