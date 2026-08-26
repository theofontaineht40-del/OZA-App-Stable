// Groupes musculaires "grossiers" de l'app (12). Résolus depuis les
// exercices (constants/exercise-muscles.ts) puis projetés sur les ~90 zones
// fines du tracé anatomique via MUSCLE_GROUP_ZONES (constants/muscle-paths.ts,
// rendu par components/muscle-map-detailed.tsx). En ajouter un impose de lui
// associer des zones dans MUSCLE_GROUP_ZONES.
export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "traps";

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Pectoraux",
  back: "Dos",
  shoulders: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Avant-bras",
  abs: "Abdominaux",
  quadriceps: "Quadriceps",
  hamstrings: "Ischio-jambiers",
  glutes: "Fessiers",
  calves: "Mollets",
  traps: "Trapèzes",
};
