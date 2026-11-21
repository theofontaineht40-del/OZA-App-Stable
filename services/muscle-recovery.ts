import type { MuscleGroup } from "../constants/muscle-groups";

// Carte de récupération par muscle : pour chaque groupe musculaire, depuis
// combien de jours il a été travaillé, d'après les exercices des séances
// enregistrées. C'est un REPÈRE INDICATIF fondé sur les jours écoulés, pas une
// règle scientifique validée : les seuils sont volontairement simples et
// affichés tels quels au sportif.
//
// Le calcul ne connaît pas la liste des exercices (la bibliothèque dépend de
// React Native) : l'appelant fournit `resolve` (nom d'exercice → groupes).

export type RecoveryState = "sollicite" | "recuperation" | "frais" | "oublie";

// Seuils en jours depuis la dernière séance qui a travaillé le muscle.
export const RECOVERY_THRESHOLDS = {
  sollicite: 1, // 0 à 1 jour : encore sollicité
  recuperation: 2, // 2 jours : en cours de récupération
  oublie: 14, // plus de 14 jours : pas travaillé récemment
} as const;

export const RECOVERY_LABELS: Record<RecoveryState, string> = {
  sollicite: "Sollicité",
  recuperation: "En récupération",
  frais: "Frais",
  oublie: "Pas travaillé récemment",
};

export type MuscleRecovery = {
  group: MuscleGroup;
  lastDate: string | null;
  daysSince: number | null;
  state: RecoveryState;
  // Nombre de séances des 14 derniers jours qui ont travaillé ce muscle.
  sessions14: number;
};

type LogLike = { exerciceNom: string; seriesReelles: string; complete: boolean };
type SessionLike = { date: string; exerciseLogs: LogLike[] | null };

const toNumber = (v: string | undefined) => {
  const n = parseFloat((v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

function dayIndex(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.floor(Date.UTC(y, (m || 1) - 1, d || 1) / 86400000);
}

export function daysBetween(from: string, to: string): number {
  return dayIndex(to) - dayIndex(from);
}

export function stateFor(daysSince: number | null): RecoveryState {
  if (daysSince === null || daysSince > RECOVERY_THRESHOLDS.oublie) return "oublie";
  if (daysSince <= RECOVERY_THRESHOLDS.sollicite) return "sollicite";
  if (daysSince <= RECOVERY_THRESHOLDS.recuperation) return "recuperation";
  return "frais";
}

// Un exercice compte s'il a été réellement fait (au moins une série saisie, ou
// marqué terminé). Un exercice seulement prévu ne fatigue personne.
const wasDone = (log: LogLike) => log.complete || toNumber(log.seriesReelles) > 0;

export function computeMuscleRecovery(
  sessions: SessionLike[],
  resolve: (exerciseName: string) => MuscleGroup[],
  today: string,
): MuscleRecovery[] {
  const last = new Map<MuscleGroup, string>();
  const days14 = new Map<MuscleGroup, Set<string>>();

  for (const s of sessions) {
    if (!s.date || s.date > today) continue;
    const touched = new Set<MuscleGroup>();
    for (const log of s.exerciseLogs ?? []) {
      if (!wasDone(log)) continue;
      for (const g of resolve(log.exerciceNom)) touched.add(g);
    }
    for (const g of touched) {
      if (!last.has(g) || s.date > last.get(g)!) last.set(g, s.date);
      if (daysBetween(s.date, today) <= 13) {
        if (!days14.has(g)) days14.set(g, new Set());
        days14.get(g)!.add(s.date);
      }
    }
  }

  return [...last.entries()]
    .map(([group, lastDate]) => {
      const daysSince = daysBetween(lastDate, today);
      return { group, lastDate, daysSince, state: stateFor(daysSince), sessions14: days14.get(group)?.size ?? 0 };
    })
    .sort((a, b) => (a.daysSince ?? 99) - (b.daysSince ?? 99));
}

export function daysLabel(daysSince: number | null): string {
  if (daysSince === null) return "jamais";
  if (daysSince <= 0) return "aujourd'hui";
  if (daysSince === 1) return "hier";
  return `il y a ${daysSince} j`;
}
