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

// Sous-ensemble affiché dans Découvrir : uniquement les coachs sportifs
// (recherche/carte publique). Les métiers médicaux/paramédicaux (kiné,
// ostéo, médecin du sport...) restent disponibles comme intervenants
// spécialistes via le code coach dans "Mon équipe", pour le suivi
// rééducation/réathlétisation, mais ne sont pas mis en avant dans la
// marketplace publique.
export const DECOUVRIR_SPECIALITES: Specialite[] = [
  "Coach mobilité",
  "Coach yoga",
  "Coach Pilates",
  "Coach CrossFit",
  "Coach Boxe",
  "Coach Running",
  "Coach Natation",
];
