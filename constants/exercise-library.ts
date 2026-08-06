import { Ionicons } from "@expo/vector-icons";

import { MovementPattern } from "../components/exercise-illustrations";

export type GroupeMusculaire =
  | "Quadriceps"
  | "Ischio-jambiers"
  | "Fessiers"
  | "Mollets"
  | "Pectoraux"
  | "Dos"
  | "Épaules"
  | "Biceps"
  | "Triceps"
  | "Abdominaux"
  | "Full body";

export type Materiel =
  | "Poids du corps"
  | "Haltères"
  | "Barre"
  | "Kettlebell"
  | "Élastique"
  | "Machine"
  | "Banc"
  | "Corde";

export type Sport =
  | "Général"
  | "Football"
  | "Basketball"
  | "Rugby"
  | "Athlétisme"
  | "Tennis"
  | "Musculation";

export type QualitePhysique =
  | "Force"
  | "Puissance"
  | "Vitesse"
  | "Endurance"
  | "Hypertrophie"
  | "Mobilité"
  | "Gainage"
  | "Coordination";

export const GROUPES_MUSCULAIRES: GroupeMusculaire[] = [
  "Quadriceps",
  "Ischio-jambiers",
  "Fessiers",
  "Mollets",
  "Pectoraux",
  "Dos",
  "Épaules",
  "Biceps",
  "Triceps",
  "Abdominaux",
  "Full body",
];

export const MATERIELS: Materiel[] = [
  "Poids du corps",
  "Haltères",
  "Barre",
  "Kettlebell",
  "Élastique",
  "Machine",
  "Banc",
  "Corde",
];

export const SPORTS: Sport[] = [
  "Général",
  "Football",
  "Basketball",
  "Rugby",
  "Athlétisme",
  "Tennis",
  "Musculation",
];

export const QUALITES_PHYSIQUES: QualitePhysique[] = [
  "Force",
  "Puissance",
  "Vitesse",
  "Endurance",
  "Hypertrophie",
  "Mobilité",
  "Gainage",
  "Coordination",
];

export type ExerciseTemplate = {
  id: string;
  nom: string;
  groupesMusculaires: GroupeMusculaire[];
  materiel: Materiel[];
  sports: Sport[];
  qualitesPhysiques: QualitePhysique[];
  icon: keyof typeof Ionicons.glyphMap;
  pattern?: MovementPattern;
  photoUrl?: string | null;
  custom?: boolean;
};

// Photos réelles issues de free-exercise-db (yuhonas/free-exercise-db), une
// base d'exercices du domaine public (licence Unlicense) — pas de risque de
// droit d'auteur, contrairement à des images glanées sur des sites fitness.
const PHOTO_BASE = "https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises";

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  { id: "squat-arriere", nom: "Squat arrière", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Barre"], sports: ["Musculation", "Général"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "squat", photoUrl: `${PHOTO_BASE}/Barbell_Squat/0.jpg` },
  { id: "squat-avant", nom: "Squat avant", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "squat", photoUrl: `${PHOTO_BASE}/Front_Barbell_Squat/0.jpg` },
  { id: "squat-saute", nom: "Squat sauté", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Poids du corps"], sports: ["Général", "Basketball"], qualitesPhysiques: ["Puissance"], icon: "flash-outline", pattern: "jump", photoUrl: `${PHOTO_BASE}/Freehand_Jump_Squat/0.jpg` },
  { id: "solueve-terre", nom: "Soulevé de terre", groupesMusculaires: ["Dos", "Ischio-jambiers", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${PHOTO_BASE}/Barbell_Deadlift/0.jpg` },
  { id: "souleve-terre-roumain", nom: "Soulevé de terre roumain", groupesMusculaires: ["Ischio-jambiers", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${PHOTO_BASE}/Romanian_Deadlift/0.jpg` },
  { id: "good-morning", nom: "Good morning", groupesMusculaires: ["Ischio-jambiers", "Dos"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${PHOTO_BASE}/Good_Morning/0.jpg` },
  { id: "fentes", nom: "Fentes", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Haltères"], sports: ["Général"], qualitesPhysiques: ["Force", "Coordination"], icon: "walk-outline", pattern: "lunge", photoUrl: `${PHOTO_BASE}/Dumbbell_Lunges/0.jpg` },
  { id: "hip-thrust", nom: "Hip thrust", groupesMusculaires: ["Fessiers"], materiel: ["Barre", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${PHOTO_BASE}/Barbell_Hip_Thrust/0.jpg` },
  { id: "presse-cuisses", nom: "Presse à cuisses", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "settings-outline", pattern: "squat", photoUrl: `${PHOTO_BASE}/Leg_Press/0.jpg` },
  { id: "developpe-couche", nom: "Développé couché", groupesMusculaires: ["Pectoraux", "Triceps"], materiel: ["Barre", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "push_horizontal", photoUrl: `${PHOTO_BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg` },
  { id: "developpe-militaire", nom: "Développé militaire", groupesMusculaires: ["Épaules", "Triceps"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "push_vertical", photoUrl: `${PHOTO_BASE}/Standing_Military_Press/0.jpg` },
  { id: "elevations-laterales", nom: "Élévations latérales", groupesMusculaires: ["Épaules"], materiel: ["Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${PHOTO_BASE}/Side_Lateral_Raise/0.jpg` },
  { id: "tractions", nom: "Tractions", groupesMusculaires: ["Dos", "Biceps"], materiel: ["Poids du corps"], sports: ["Musculation", "Général"], qualitesPhysiques: ["Force"], icon: "body-outline", pattern: "pull_vertical", photoUrl: `${PHOTO_BASE}/Pullups/0.jpg` },
  { id: "rowing-barre", nom: "Rowing barre", groupesMusculaires: ["Dos"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "pull_horizontal", photoUrl: `${PHOTO_BASE}/Bent_Over_Barbell_Row/0.jpg` },
  { id: "rowing-haltere", nom: "Rowing haltère", groupesMusculaires: ["Dos"], materiel: ["Haltères", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "pull_horizontal", photoUrl: `${PHOTO_BASE}/Bent_Over_Two-Dumbbell_Row/0.jpg` },
  { id: "pompes", nom: "Pompes", groupesMusculaires: ["Pectoraux", "Triceps"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Force", "Endurance"], icon: "body-outline", pattern: "push_horizontal", photoUrl: `${PHOTO_BASE}/Pushups/0.jpg` },
  { id: "curl-biceps", nom: "Curl biceps", groupesMusculaires: ["Biceps"], materiel: ["Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${PHOTO_BASE}/Dumbbell_Bicep_Curl/0.jpg` },
  { id: "extension-triceps", nom: "Extension triceps", groupesMusculaires: ["Triceps"], materiel: ["Haltères", "Élastique"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${PHOTO_BASE}/Standing_Dumbbell_Triceps_Extension/0.jpg` },
  { id: "gainage-planche", nom: "Gainage (planche)", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core", photoUrl: `${PHOTO_BASE}/Plank/0.jpg` },
  { id: "hollow-body", nom: "Hollow body hold", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core" },
  { id: "russian-twist", nom: "Russian twist", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage", "Coordination"], icon: "body-outline", pattern: "core_rotation", photoUrl: `${PHOTO_BASE}/Russian_Twist/0.jpg` },
  { id: "mountain-climbers", nom: "Mountain climbers", groupesMusculaires: ["Abdominaux", "Full body"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Coordination"], icon: "walk-outline", pattern: "core_rotation", photoUrl: `${PHOTO_BASE}/Mountain_Climbers/0.jpg` },
  { id: "burpees", nom: "Burpees", groupesMusculaires: ["Full body"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Puissance"], icon: "flash-outline", pattern: "jump" },
  { id: "corde-a-sauter", nom: "Corde à sauter", groupesMusculaires: ["Mollets", "Full body"], materiel: ["Corde"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Coordination"], icon: "sync-outline", pattern: "locomotion", photoUrl: `${PHOTO_BASE}/Rope_Jumping/0.jpg` },
  { id: "sprint", nom: "Sprint", groupesMusculaires: ["Full body"], materiel: ["Poids du corps"], sports: ["Athlétisme", "Football", "Rugby"], qualitesPhysiques: ["Vitesse"], icon: "walk-outline", pattern: "locomotion", photoUrl: `${PHOTO_BASE}/Wind_Sprints/0.jpg` },
  { id: "box-jump", nom: "Box jump", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Poids du corps"], sports: ["Athlétisme", "Basketball"], qualitesPhysiques: ["Puissance"], icon: "flash-outline", pattern: "jump", photoUrl: `${PHOTO_BASE}/Front_Box_Jump/0.jpg` },
  { id: "kettlebell-swing", nom: "Kettlebell swing", groupesMusculaires: ["Fessiers", "Dos"], materiel: ["Kettlebell"], sports: ["Général"], qualitesPhysiques: ["Puissance", "Endurance"], icon: "fitness-outline", pattern: "hinge", photoUrl: `${PHOTO_BASE}/One-Arm_Kettlebell_Swings/0.jpg` },
  { id: "farmer-walk", nom: "Farmer's walk", groupesMusculaires: ["Full body"], materiel: ["Haltères", "Kettlebell"], sports: ["Général"], qualitesPhysiques: ["Force", "Gainage"], icon: "walk-outline", pattern: "locomotion", photoUrl: `${PHOTO_BASE}/Farmers_Walk/0.jpg` },
  { id: "battle-ropes", nom: "Battle ropes", groupesMusculaires: ["Épaules", "Full body"], materiel: ["Corde"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Puissance"], icon: "pulse-outline", pattern: "isolation" },
  { id: "gainage-lateral", nom: "Gainage latéral", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core", photoUrl: `${PHOTO_BASE}/Side_Bridge/0.jpg` },
  { id: "mollets-debout", nom: "Mollets debout", groupesMusculaires: ["Mollets"], materiel: ["Machine", "Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${PHOTO_BASE}/Standing_Calf_Raises/0.jpg` },
];

export const BLOC_COLORS = [
  "#FF2D7A",
  "#FF9F0A",
  "#34C759",
  "#0A84FF",
  "#AF52DE",
  "#5E5CE6",
  "#111111",
  "#8E8E93",
];

// Une couleur distincte par groupe musculaire pour repérer un exercice au premier
// coup d'œil dans la bibliothèque, sans dépendre d'une photo.
export const MUSCLE_GROUP_COLORS: Record<GroupeMusculaire, string> = {
  "Quadriceps": "#FF2D7A",
  "Ischio-jambiers": "#FF6B35",
  "Fessiers": "#FF9F0A",
  "Mollets": "#C9A227",
  "Pectoraux": "#34C759",
  "Dos": "#0A84FF",
  "Épaules": "#5E5CE6",
  "Biceps": "#AF52DE",
  "Triceps": "#FF375F",
  "Abdominaux": "#30B0C7",
  "Full body": "#111111",
};

export function getExerciseColor(exercise: Pick<ExerciseTemplate, "groupesMusculaires">): string {
  const groupe = exercise.groupesMusculaires[0];
  return groupe ? MUSCLE_GROUP_COLORS[groupe] : "#8E8E93";
}
