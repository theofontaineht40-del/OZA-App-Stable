import { Level, Range, RuleTarget, ScienceRule, ScienceSource } from "./types";
import { validateRule } from "./validate";

// Accès du moteur au référentiel. Une règle n'est visible que si elle est au
// statut « valide » ET passe tous les contrôles (sources vérifiées incluses).

export function usableRules(rules: ScienceRule[], sources: ScienceSource[]): ScienceRule[] {
  const map = new Map(sources.map((s) => [s.id, s]));
  return rules.filter((r) => r.status === "valide" && validateRule(r, map).errors.length === 0);
}

export type RuleQuery = {
  category?: ScienceRule["category"];
  sportId?: string;
  positionId?: string | null;
  target?: Partial<RuleTarget>;
};

export function findRules(rules: ScienceRule[], q: RuleQuery): ScienceRule[] {
  return rules.filter((r) => {
    if (q.category && r.category !== q.category) return false;
    if (q.sportId && r.sportIds !== "*" && !r.sportIds.includes(q.sportId)) return false;
    // Une règle limitée à des postes ne s'applique qu'à ces postes.
    if (r.positionIds && r.positionIds.length > 0 && (!q.positionId || !r.positionIds.includes(q.positionId))) return false;
    if (q.target?.kind && r.target.kind !== q.target.kind) return false;
    if (q.target?.id && r.target.id !== q.target.id) return false;
    return true;
  });
}

// Valeur applicable au niveau demandé : la valeur propre au niveau si elle
// existe, sinon la valeur générale.
export function resolveRange(rule: ScienceRule, level: Level): Range {
  return rule.byLevel?.[level] ?? rule.value;
}

// Parmi plusieurs règles candidates, la plus spécifique gagne : poste > sport > général.
export function mostSpecific(rules: ScienceRule[], positionId: string | null | undefined): ScienceRule | null {
  const score = (r: ScienceRule) => (r.positionIds?.length && positionId && r.positionIds.includes(positionId) ? 2 : r.sportIds === "*" ? 0 : 1);
  return [...rules].sort((a, b) => score(b) - score(a))[0] ?? null;
}
