// Génère docs/programmes-oza-a-relire.md : un récapitulatif lisible des
// programmes de démarrage OZA Programs (pour la relecture avant publication).
// Usage : npx tsx scripts/export-starter-programs.ts
import { writeFileSync } from "node:fs";
import { DEFAULT_OZA_SPORTS } from "../constants/oza-sports";
import { RUGBY_STARTER_PROGRAMS } from "../constants/oza-starter-programs";
import { POSTE_STARTER_PROGRAMS } from "../constants/oza-starter-programs-postes";
import { SPECIALITE_STARTER_PROGRAMS } from "../constants/oza-starter-programs-specialites";
import { SPORT_STARTER_PROGRAMS } from "../constants/oza-starter-programs-sports";

const all = [...RUGBY_STARTER_PROGRAMS, ...SPORT_STARTER_PROGRAMS, ...POSTE_STARTER_PROGRAMS, ...SPECIALITE_STARTER_PROGRAMS];
const NIVEAU: Record<string, string> = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };
const out: string[] = [
  "# Programmes OZA à relire",
  "",
  `${all.length} programmes de démarrage, importés en **brouillon**. Pour chacun : le contenu de la semaine 2 (semaine type), puis le thème des autres semaines. Les charges sont en RPE.`,
  "",
];

for (const sport of DEFAULT_OZA_SPORTS) {
  const list = all.filter((p) => p.sportId === sport.id);
  if (list.length === 0) continue;
  out.push(`## ${sport.nom} (${list.length})`, "");
  for (const p of list) {
    const pos = sport.positions.find((x) => x.id === p.positionId);
    out.push(`### ${p.nom} — ${NIVEAU[p.niveau]}${pos ? ` · ${pos.nom}` : " · tous profils"}`, "");
    out.push(`- **Objectif** : ${p.objectif}`);
    out.push(`- **Public** : ${p.publicCible}`);
    out.push(`- **Matériel** : ${p.materiel.join(", ")}`);
    out.push(`- **Qualités** : ${p.qualites.map((q) => `${q.nom} ${q.pct} %`).join(", ")}`);
    out.push(`- **Semaines** : ${p.semaines.map((w) => `S${w.numero} ${w.theme}`).join(" → ")}`);
    const week = p.semaines[1];
    if (week.consignes) out.push(`- **Consigne S2** : ${week.consignes}`);
    out.push("");
    for (const s of week.seances) {
      out.push(`**${s.nom}**`, "");
      for (const b of s.blocs) {
        const ex = b.exercices
          .map((e) => `${e.exerciceNom} ${e.series}×${e.repetitions}${e.chargeValeur ? ` RPE ${e.chargeValeur}` : ""}${e.reposSeries ? ` (repos ${e.reposSeries})` : ""}`)
          .join(" ; ");
        out.push(`- ${b.nom}${b.mode === "circuit" ? " (circuit)" : ""} : ${ex}`);
      }
      out.push("");
    }
  }
}
writeFileSync("docs/programmes-oza-a-relire.md", out.join("\n"));
console.log("OK", all.length, "programmes,", out.length, "lignes");
