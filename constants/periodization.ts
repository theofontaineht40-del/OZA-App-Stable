export type Niveau = "debutant" | "intermediaire" | "avance" | "elite";

export const NIVEAUX: { key: Niveau; label: string }[] = [
  { key: "debutant", label: "Débutant" },
  { key: "intermediaire", label: "Intermédiaire" },
  { key: "avance", label: "Avancé" },
  { key: "elite", label: "Élite" },
];
