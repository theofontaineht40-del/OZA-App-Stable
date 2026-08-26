import { EXERCISE_LIBRARY } from "./exercise-library";
import { MuscleGroup } from "./muscle-groups";

// Table de secours pour des noms d'exercice qui ne viendraient pas de
// constants/exercise-library.ts (ex. séances de test, futurs imports).
// Chaque exercice → un ou plusieurs groupes musculaires, sans notion de
// niveau/priorité : soit le muscle est concerné, soit il ne l'est pas.
export const EXERCISE_MUSCLE_MAP: Record<string, MuscleGroup[]> = {
  Squat: ["quadriceps", "glutes", "hamstrings"],
  "Leg Extension": ["quadriceps"],
  "Leg Curl": ["hamstrings"],
  "Hip Thrust": ["glutes"],
  "Standing Calf Raise": ["calves"],
  "Bench Press": ["chest", "triceps", "shoulders"],
  "Shoulder Press": ["shoulders", "triceps"],
  "Lat Pulldown": ["back", "biceps"],
  "Biceps Curl": ["biceps", "forearms"],
  "Triceps Pushdown": ["triceps"],
};

const EXERCISE_MUSCLE_MAP_LOWER: Record<string, MuscleGroup[]> = Object.fromEntries(
  Object.entries(EXERCISE_MUSCLE_MAP).map(([name, groups]) => [name.toLowerCase(), groups])
);

// Traduction des labels français de constants/exercise-library.ts vers les
// clés MuscleGroup. "Full body" n'est volontairement pas mappé (ne
// correspond à aucun groupe précis).
const FRENCH_LABEL_TO_GROUP: Record<string, MuscleGroup> = {
  Pectoraux: "chest",
  Dos: "back",
  Épaules: "shoulders",
  Biceps: "biceps",
  Triceps: "triceps",
  Abdominaux: "abs",
  Quadriceps: "quadriceps",
  "Ischio-jambiers": "hamstrings",
  Fessiers: "glutes",
  Mollets: "calves",
};

const EXERCISE_LIBRARY_GROUPS_BY_ID = new Map(EXERCISE_LIBRARY.map((ex) => [ex.id, ex.groupesMusculaires]));
const EXERCISE_LIBRARY_GROUPS_BY_NAME = new Map(
  EXERCISE_LIBRARY.map((ex) => [ex.nom.toLowerCase(), ex.groupesMusculaires])
);

export type NamedExercise = { name: string; id?: string };

// EXERCICE → MUSCLE(S). Priorité 1 : identifiant dans la bibliothèque
// d'exercices (constants/exercise-library.ts — le lien fiable, un exercice
// peut être renommé sans casser le mapping) ; priorité 2 : nom dans cette
// même bibliothèque (au cas où l'id ne serait pas fourni) ; priorité 3 :
// EXERCISE_MUSCLE_MAP ci-dessus (séances de test / exercices hors catalogue).
export function resolveExerciseMuscles({ name, id }: NamedExercise): MuscleGroup[] {
  const byId = id ? EXERCISE_LIBRARY_GROUPS_BY_ID.get(id) : undefined;
  const byName = byId ?? EXERCISE_LIBRARY_GROUPS_BY_NAME.get(name.trim().toLowerCase());
  if (byName) {
    return byName.map((label) => FRENCH_LABEL_TO_GROUP[label]).filter((g): g is MuscleGroup => !!g);
  }

  return EXERCISE_MUSCLE_MAP_LOWER[name.trim().toLowerCase()] ?? [];
}

// exercises → exerciseMuscles → fusion → dédoublonnage. Pas de comptage, pas
// de score : chaque muscle rencontré au moins une fois est "actif".
export function getUniqueMuscles(exercises: NamedExercise[]): MuscleGroup[] {
  const active = new Set<MuscleGroup>();
  for (const exercise of exercises) {
    for (const group of resolveExerciseMuscles(exercise)) {
      active.add(group);
    }
  }
  return Array.from(active);
}
