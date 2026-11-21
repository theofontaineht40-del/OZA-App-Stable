import { findRules, mostSpecific, resolveRange } from "../repository";
import { Level, Range, RuleUse, ScienceRule } from "../types";

// Paramètres d'effort d'une qualité physique (force maximale, masse, puissance…),
// lus UNIQUEMENT dans les règles validées. Le moteur n'a aucune valeur par défaut :
// un paramètre sans règle validée est signalé comme manquant (« gaps »), jamais
// remplacé par une valeur inventée.
//
// Les règles utilisent la convention d'id « B-<origine>-<qualité>-<paramètre> »,
// ex. « B-coach-masse-repetitions ».

export const EFFORT_PARAMS = ["series", "repetitions", "intensite", "repos", "tstt", "rpe"] as const;
export type EffortParam = (typeof EFFORT_PARAMS)[number];

export const EFFORT_LABELS: Record<EffortParam, string> = {
  series: "Séries par exercice",
  repetitions: "Répétitions par série",
  intensite: "Intensité (% 1RM)",
  repos: "Repos entre séries (s)",
  tstt: "Temps sous tension par série (s)",
  rpe: "RPE visé (0-10)",
};

export type EffortValue = {
  param: EffortParam;
  range: Range;
  // Valeur proposée : la valeur recommandée si la règle en donne une, sinon le
  // milieu de la fourchette, sinon la seule borne connue.
  target: number;
  unit: string;
  use: RuleUse;
};

export type EffortResult = {
  quality: string;
  level: Level | null;
  values: Partial<Record<EffortParam, EffortValue>>;
  // Paramètres pour lesquels aucune règle validée n'existe.
  gaps: EffortParam[];
  rulesUsed: RuleUse[];
};

export function targetOf(r: Range): number | null {
  if (r.recommended !== null && r.recommended !== undefined) return r.recommended;
  if (r.min !== null && r.max !== null) return Math.round(((r.min + r.max) / 2) * 10) / 10;
  if (r.min !== null) return r.min;
  if (r.max !== null) return r.max;
  return null;
}

const matches = (rule: ScienceRule, param: EffortParam) => rule.id.endsWith(`-${param}`);

export type EffortQuery = {
  quality: string;
  level?: Level | null;
  sportId?: string;
  positionId?: string | null;
};

// `usable` doit venir de usableRules() : le moteur ne lit jamais les brouillons.
export function effortParameters(usable: ScienceRule[], q: EffortQuery): EffortResult {
  const candidates = findRules(usable, {
    category: "B",
    sportId: q.sportId,
    positionId: q.positionId ?? null,
    target: { kind: "quality", id: q.quality },
  });
  const level = q.level ?? null;
  const values: EffortResult["values"] = {};
  const gaps: EffortParam[] = [];
  const rulesUsed: RuleUse[] = [];

  for (const param of EFFORT_PARAMS) {
    const rule = mostSpecific(candidates.filter((r) => matches(r, param)), q.positionId);
    const range = rule ? (level ? resolveRange(rule, level) : rule.value) : null;
    const target = range ? targetOf(range) : null;
    if (!rule || !range || target === null) {
      gaps.push(param);
      continue;
    }
    const use: RuleUse = { ruleId: rule.id, ruleVersion: rule.version, appliedTo: `${EFFORT_LABELS[param]} : ${q.quality}` };
    values[param] = { param, range, target, unit: rule.unit, use };
    rulesUsed.push(use);
  }
  return { quality: q.quality, level, values, gaps, rulesUsed };
}
