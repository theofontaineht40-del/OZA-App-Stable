// Contrôle du référentiel scientifique : npm run science:check
// Sort avec un code d'erreur si une règle ou une source est incohérente.
import { RULES, SOURCES } from "../science/data";
import { CATEGORIES } from "../science/types";
import { usableRules } from "../science/repository";
import { validateAll } from "../science/validate";

const res = validateAll(RULES, SOURCES);
console.log(`Sources : ${SOURCES.length} (${SOURCES.filter((s) => s.verified).length} vérifiées)`);
console.log(`Règles  : ${RULES.length} (valides ${res.counts.valide}, brouillons ${res.counts.brouillon}, refusées ${res.counts.refuse})`);
console.log(`Utilisables par le moteur : ${usableRules(RULES, SOURCES).length}`);
for (const c of CATEGORIES) {
  const n = RULES.filter((r) => r.category === c.key).length;
  const v = usableRules(RULES, SOURCES).filter((r) => r.category === c.key).length;
  console.log(`  ${c.key}  ${c.label.padEnd(42)} ${String(n).padStart(3)} règles, ${v} utilisables`);
}
for (const w of res.warnings) console.log(`⚠ ${w}`);
for (const e of res.errors) console.log(`✗ ${e}`);
if (res.errors.length > 0) {
  console.log(`\n${res.errors.length} erreur(s).`);
  process.exit(1);
}
console.log("\nRéférentiel cohérent.");
