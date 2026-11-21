// Génère la liste de relecture des règles de coach : npm run science:checklist
// Le coach coche les cases dans docs/regles-coach-a-valider.md, puis
// `npm run science:apply -- --name "Prénom Nom"` applique sa décision.
//   [x] = je valide     [-] = je refuse     [ ] = pas encore relue (rien ne change)
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { RULES } from "../science/data";
import { CATEGORIES, Range, ScienceRule } from "../science/types";

const OUT = join(__dirname, "..", "docs", "regles-coach-a-valider.md");

const fmt = (r: Range | undefined): string => {
  if (!r) return "";
  const { min, recommended, max } = r;
  const rec = recommended !== null && recommended !== undefined ? ` (reco ${recommended})` : "";
  if (min !== null && max !== null) return min === max ? `${min}` + rec : `${min} à ${max}` + rec;
  if (min !== null) return `≥ ${min}` + rec;
  if (max !== null) return `≤ ${max}` + rec;
  if (recommended !== null && recommended !== undefined) return `${recommended}`;
  return "";
};

function line(r: ScienceRule): string {
  const parts: string[] = [];
  const base = fmt(r.value);
  if (base) parts.push(`${base} ${r.unit}`);
  for (const [lvl, v] of Object.entries(r.byLevel ?? {})) {
    const t = fmt(v);
    if (t) parts.push(`${lvl} : ${t}`);
  }
  const status = r.status === "valide" ? " ✅ déjà validée" : r.status === "refuse" ? " ⛔ refusée" : "";
  const box = r.status === "valide" ? "[x]" : r.status === "refuse" ? "[-]" : "[ ]";
  let s = `- ${box} \`${r.id}\` — **${r.parameter}** : ${parts.join(" ; ") || "(valeur non renseignée)"}${status}`;
  if (r.conditions) s += `\n  - Conditions : ${r.conditions}`;
  if (r.notes) s += `\n  - Note : ${r.notes}`;
  return s;
}

const coach = RULES.filter((r) => r.id.split("-")[1] === "coach");
const out: string[] = [];
out.push("# Règles de coach à valider");
out.push("");
out.push(`Généré automatiquement (${coach.length} règles issues des cours ProSportConcept). Ne modifie QUE les cases :`);
out.push("");
out.push("- `[x]` : je valide cette règle (elle devient utilisable par le moteur)");
out.push("- `[-]` : je refuse cette règle");
out.push("- `[ ]` : pas encore relue, rien ne change");
out.push("");
out.push('Quand tu as fini, dis « applique la validation » : le script enregistre ton nom et la date du jour sur chaque règle cochée. Rien n\'est validé avant ça.');
out.push("");
for (const c of CATEGORIES) {
  const rs = coach.filter((r) => r.category === c.key);
  if (!rs.length) continue;
  out.push(`## ${c.key} — ${c.label} (${rs.length})`);
  out.push("");
  for (const r of rs) out.push(line(r));
  out.push("");
}
writeFileSync(OUT, out.join("\n"));
console.log(`${coach.length} règles écrites dans docs/regles-coach-a-valider.md`);
