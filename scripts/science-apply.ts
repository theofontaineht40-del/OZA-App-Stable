// Applique la décision du coach : npm run science:apply -- --name "Prénom Nom" [--date AAAA-MM-JJ]
// Lit docs/regles-coach-a-valider.md : [x] → valide, [-] → refusée, [ ] → inchangée.
// Seules les règles dont la case a changé par rapport au fichier de données sont modifiées.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const name = opt("--name")?.trim();
const date = opt("--date") ?? new Date().toISOString().slice(0, 10);
if (!name) {
  console.error('Il faut ton nom : npm run science:apply -- --name "Prénom Nom"');
  process.exit(1);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("Date invalide (AAAA-MM-JJ).");
  process.exit(1);
}

const checklist = readFileSync(join(__dirname, "..", "docs", "regles-coach-a-valider.md"), "utf8");
const decisions = new Map<string, "valide" | "refuse" | "brouillon">();
for (const m of checklist.matchAll(/^- \[([ x-])\] `([A-J]-[a-z0-9-]+)`/gm)) {
  decisions.set(m[2], m[1] === "x" ? "valide" : m[1] === "-" ? "refuse" : "brouillon");
}

const dir = join(__dirname, "..", "science", "data", "rules");
let validated = 0;
let refused = 0;
let unchanged = 0;
const seen = new Set<string>();
for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const path = join(dir, f);
  const rules = JSON.parse(readFileSync(path, "utf8")) as any[];
  let touched = false;
  for (const r of rules) {
    const d = decisions.get(r.id);
    if (!d) continue;
    seen.add(r.id);
    if (d === r.status || d === "brouillon") {
      unchanged++;
      continue;
    }
    r.status = d;
    r.validatedBy = name;
    r.validatedAt = date;
    touched = true;
    if (d === "valide") validated++;
    else refused++;
  }
  if (touched) writeFileSync(path, JSON.stringify(rules, null, 2) + "\n");
}
const unknown = [...decisions.keys()].filter((id) => !seen.has(id));
console.log(`Validées : ${validated}, refusées : ${refused}, inchangées : ${unchanged}.`);
if (unknown.length) console.log(`Règles du fichier introuvables dans les données : ${unknown.join(", ")}`);
console.log(`Enregistré au nom de « ${name} », le ${date}. Lance maintenant : npm run science:check`);
