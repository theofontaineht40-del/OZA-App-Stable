// Métiers pouvant intervenir en tant que spécialiste auprès d'un sportif.
// Pour ajouter un nouveau métier, il suffit d'ajouter une entrée ici.
export const SPECIALITES = [
  "Préparateur physique",
  "Nutritionniste",
  "Kinésithérapeute",
  "Ostéopathe",
  "Préparateur mental",
  "Coach mobilité",
  "Coach yoga",
  "Coach Pilates",
  "Coach CrossFit",
  "Coach Boxe",
  "Coach Running",
  "Coach Natation",
  "Analyste vidéo",
  "Médecin du sport",
] as const;

export type Specialite = (typeof SPECIALITES)[number];
