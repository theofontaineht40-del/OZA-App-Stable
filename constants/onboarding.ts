// Questionnaire d'accueil : listes de réponses proposées au sportif.
// Le sport, le poste et le niveau viennent du catalogue OZA Programs
// (constants/oza-sports.ts) afin qu'un même identifiant serve partout.

export type ObjectifKey =
  | "performance"
  | "force"
  | "masse"
  | "perte_poids"
  | "endurance"
  | "vitesse"
  | "prevention"
  | "forme";

export const PROFIL_OBJECTIFS: { key: ObjectifKey; label: string; hint: string }[] = [
  { key: "performance", label: "Progresser dans mon sport", hint: "Être plus performant en match ou en compétition" },
  { key: "force", label: "Devenir plus fort", hint: "Gagner en force et en puissance" },
  { key: "masse", label: "Prendre du muscle", hint: "Développer ma masse musculaire" },
  { key: "perte_poids", label: "Perdre du poids", hint: "Me sécher et améliorer ma composition corporelle" },
  { key: "endurance", label: "Gagner en endurance", hint: "Tenir plus longtemps, mieux récupérer" },
  { key: "vitesse", label: "Gagner en vitesse et explosivité", hint: "Sprinter, sauter, accélérer" },
  { key: "prevention", label: "Prévenir les blessures", hint: "Me renforcer et rester disponible" },
  { key: "forme", label: "Me remettre en forme", hint: "Reprendre en douceur, retrouver du tonus" },
];

export type MaterielKey =
  | "salle"
  | "barre_rack"
  | "halteres"
  | "elastiques"
  | "poids_du_corps"
  | "terrain"
  | "cardio";

export const PROFIL_MATERIEL: { key: MaterielKey; label: string; hint: string }[] = [
  { key: "salle", label: "Salle de sport complète", hint: "Machines, poulies, barres, haltères" },
  { key: "barre_rack", label: "Barre et rack", hint: "À la maison ou en box" },
  { key: "halteres", label: "Haltères / kettlebells", hint: "" },
  { key: "elastiques", label: "Élastiques", hint: "" },
  { key: "poids_du_corps", label: "Rien, poids du corps", hint: "" },
  { key: "terrain", label: "Terrain ou piste", hint: "Pour les sprints et le travail de vitesse" },
  { key: "cardio", label: "Vélo, rameur ou tapis", hint: "" },
];

export const PROFIL_SEANCES_PAR_SEMAINE = [1, 2, 3, 4, 5, 6] as const;
export const PROFIL_DUREES_MIN = [30, 45, 60, 90] as const;

export function objectifLabel(key: string | null | undefined): string {
  return PROFIL_OBJECTIFS.find((o) => o.key === key)?.label ?? "";
}

export function materielLabel(key: string): string {
  return PROFIL_MATERIEL.find((m) => m.key === key)?.label ?? key;
}
