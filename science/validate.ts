import { CATEGORIES, Range, ScienceRule, ScienceSource } from "./types";

// Contrôles de cohérence du référentiel. Une règle « valide » est une règle que
// le coach a relue ET dont chaque source a été vérifiée à la main : sans ça, le
// moteur ne la voit pas.

export type Issues = { errors: string[]; warnings: string[] };

const DOI = /^10\.\d{4,9}\/\S+$/;
const PMID = /^\d{4,9}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY_KEYS = CATEGORIES.map((c) => c.key as string);
const SYNTHESIS = ["meta-analyse", "revue-systematique", "consensus"];

export function validateSource(s: ScienceSource): Issues {
  const errors: string[] = [];
  const warnings: string[] = [];
  const at = `source ${s.id || "(sans id)"}`;
  if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) errors.push(`${at} : id manquant ou invalide (minuscules, chiffres, tirets)`);
  if (!s.authors?.trim()) errors.push(`${at} : auteurs manquants`);
  if (!s.title?.trim()) errors.push(`${at} : titre manquant`);
  if (!s.journal?.trim()) errors.push(`${at} : revue manquante`);
  if (!Number.isInteger(s.year) || s.year < 1950 || s.year > new Date().getFullYear() + 1) errors.push(`${at} : année invalide`);
  if (!s.doi && !s.pmid) errors.push(`${at} : il faut un DOI ou un PMID`);
  if (s.doi && !DOI.test(s.doi)) errors.push(`${at} : DOI mal formé (${s.doi})`);
  if (s.pmid && !PMID.test(s.pmid)) errors.push(`${at} : PMID mal formé (${s.pmid})`);
  if (!s.population?.trim()) errors.push(`${at} : population étudiée manquante`);
  if (s.verified && !(s.verifiedAt && DATE.test(s.verifiedAt))) errors.push(`${at} : vérifiée sans date de vérification (AAAA-MM-JJ)`);
  if (!s.verified) warnings.push(`${at} : non vérifiée, les règles qui la citent ne peuvent pas être validées`);
  return { errors, warnings };
}

function rangeErrors(r: Range | undefined, where: string): string[] {
  if (!r) return [];
  const errs: string[] = [];
  const vals = [r.min, r.recommended, r.max];
  for (const v of vals) if (v !== null && (typeof v !== "number" || !Number.isFinite(v))) errs.push(`${where} : valeur non numérique`);
  const present = vals.filter((v): v is number => typeof v === "number");
  for (let i = 1; i < present.length; i++) if (present[i] < present[i - 1]) errs.push(`${where} : min ≤ recommandé ≤ max non respecté`);
  return errs;
}

function hasValue(r: Range | undefined): boolean {
  return !!r && (r.min !== null || r.recommended !== null || r.max !== null);
}

export function validateRule(rule: ScienceRule, sources: Map<string, ScienceSource>): Issues {
  const errors: string[] = [];
  const warnings: string[] = [];
  const at = `règle ${rule.id || "(sans id)"}`;

  if (!rule.id || !/^[A-J]-[a-z0-9-]+$/.test(rule.id)) errors.push(`${at} : id invalide (format « A-quadriceps-volume-hebdo »)`);
  if (!CATEGORY_KEYS.includes(rule.category)) errors.push(`${at} : catégorie inconnue`);
  else if (rule.id && rule.id[0] !== rule.category) errors.push(`${at} : l'id doit commencer par la catégorie ${rule.category}`);
  if (!rule.parameter?.trim()) errors.push(`${at} : paramètre manquant`);
  if (!rule.unit?.trim()) errors.push(`${at} : unité manquante`);
  if (!rule.limits?.trim()) errors.push(`${at} : limites scientifiques manquantes`);
  if (!rule.conditions?.trim()) errors.push(`${at} : conditions d'application manquantes`);
  if (!(rule.sportIds === "*" || (Array.isArray(rule.sportIds) && rule.sportIds.length > 0))) errors.push(`${at} : sports concernés manquants (liste ou "*")`);
  if (!rule.target?.id) errors.push(`${at} : cible manquante`);

  errors.push(...rangeErrors(rule.value, `${at} valeur`));
  for (const [lvl, r] of Object.entries(rule.byLevel ?? {})) errors.push(...rangeErrors(r, `${at} niveau ${lvl}`));
  if (!hasValue(rule.value) && !Object.values(rule.byLevel ?? {}).some(hasValue)) errors.push(`${at} : aucune valeur renseignée`);

  const cited = rule.sourceIds.map((id) => sources.get(id));
  rule.sourceIds.forEach((id, i) => {
    if (!cited[i]) errors.push(`${at} : source inconnue « ${id} »`);
  });

  if (rule.status === "valide") {
    if (!rule.validatedBy?.trim()) errors.push(`${at} : validée sans nom du validateur`);
    if (!(rule.validatedAt && DATE.test(rule.validatedAt))) errors.push(`${at} : validée sans date (AAAA-MM-JJ)`);
    if (rule.evidence !== "opinion" && rule.sourceIds.length === 0) errors.push(`${at} : validée sans aucune source`);
    for (const s of cited) if (s && !s.verified) errors.push(`${at} : cite la source « ${s.id} » non vérifiée`);
    if (rule.evidence === "fort" && !cited.some((s) => s && SYNTHESIS.includes(s.studyType))) {
      warnings.push(`${at} : preuve « forte » sans méta-analyse, revue systématique ni consensus`);
    }
  }
  if (rule.status !== "brouillon" && rule.status !== "valide" && rule.status !== "refuse") errors.push(`${at} : statut inconnu`);
  return { errors, warnings };
}

export function validateAll(rules: ScienceRule[], sources: ScienceSource[]): Issues & { counts: Record<string, number> } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const map = new Map<string, ScienceSource>();
  for (const s of sources) {
    if (map.has(s.id)) errors.push(`source ${s.id} : id en double`);
    map.set(s.id, s);
    const r = validateSource(s);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  const seen = new Set<string>();
  const counts: Record<string, number> = { brouillon: 0, valide: 0, refuse: 0 };
  for (const rule of rules) {
    if (seen.has(rule.id)) errors.push(`règle ${rule.id} : id en double`);
    seen.add(rule.id);
    counts[rule.status] = (counts[rule.status] ?? 0) + 1;
    const r = validateRule(rule, map);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  return { errors, warnings, counts };
}
