import { OZA_NIVEAUX } from "../constants/oza-sports";
import { ObjectifKey } from "../constants/onboarding";
import { AthleteProfile } from "./athlete-profile";
import { OzaProgram } from "./oza-programs";

// Mots qui rattachent l'objectif du questionnaire au texte libre d'un programme.
const OBJECTIF_WORDS: Record<ObjectifKey, string[]> = {
  performance: ["performance", "compétition", "match", "saison"],
  force: ["force", "puissance"],
  masse: ["masse", "hypertroph", "muscle"],
  perte_poids: ["perte", "poids", "sèche", "composition"],
  endurance: ["endurance", "aérob", "cardio", "répétition"],
  vitesse: ["vitesse", "explosi", "sprint", "accélér", "saut"],
  prevention: ["prévention", "blessure", "renfo", "mobilité"],
  forme: ["forme", "reprise", "remise"],
};

export type ProgramMatch = { program: OzaProgram; score: number; reasons: string[] };

// Règles simples et lisibles (pas d'IA) : chaque critère du profil ajoute ou
// retire des points, et les raisons sont montrées à l'utilisateur.
export function scoreProgram(program: OzaProgram, profile: AthleteProfile): ProgramMatch {
  let score = 0;
  const reasons: string[] = [];

  if (profile.positionId) {
    if (program.positionId === profile.positionId) {
      score += 3;
      reasons.push("Pour ton poste");
    } else if (!program.positionId) {
      score += 1;
    } else {
      score -= 2;
    }
  }

  if (profile.niveau) {
    const order = OZA_NIVEAUX.map((n) => n.key as string);
    const gap = Math.abs(order.indexOf(program.niveau) - order.indexOf(profile.niveau));
    if (gap === 0) {
      score += 4;
      reasons.push("Ton niveau");
    } else if (gap === 1) {
      score += 1;
    } else {
      score -= 3;
    }
  }

  if (profile.seancesParSemaine && program.seancesParSemaine > 0) {
    if (program.seancesParSemaine <= profile.seancesParSemaine) {
      score += 2;
      reasons.push(`${program.seancesParSemaine} séance${program.seancesParSemaine > 1 ? "s" : ""} par semaine`);
    } else {
      score -= 2;
    }
  }

  if (profile.objectif) {
    const text = `${program.objectif} ${program.nom} ${program.qualites.map((q) => q.nom).join(" ")}`.toLowerCase();
    if (OBJECTIF_WORDS[profile.objectif].some((w) => text.includes(w))) {
      score += 2;
      reasons.push("Ton objectif");
    }
  }

  return { program, score, reasons };
}

export function recommendPrograms(programs: OzaProgram[], profile: AthleteProfile, max = 3): ProgramMatch[] {
  return programs
    .map((p) => scoreProgram(p, profile))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}
