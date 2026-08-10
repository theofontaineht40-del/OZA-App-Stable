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
  videoUrl?: string | null;
  custom?: boolean;
};

// Images générées avec l'accord du coach (ChatGPT), hébergées dans ce dépôt
// et servies via jsDelivr — gratuit, pas de compte de stockage payant requis.
const IMAGE_BASE = "https://cdn.jsdelivr.net/gh/theofontaineht40-del/OZA-App-Stable@main/assets/exercise-library";

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  { id: "squat-arriere", nom: "Squat arrière", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Barre"], sports: ["Musculation", "Général"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "squat", photoUrl: `${IMAGE_BASE}/squat-arriere.png` },
  { id: "squat-avant", nom: "Squat avant", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "squat", photoUrl: `${IMAGE_BASE}/squat-avant.png` },
  { id: "squat-saute", nom: "Squat sauté", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Poids du corps"], sports: ["Général", "Basketball"], qualitesPhysiques: ["Puissance"], icon: "flash-outline", pattern: "jump" },
  { id: "solueve-terre", nom: "Soulevé de terre", groupesMusculaires: ["Dos", "Ischio-jambiers", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/solueve-terre.png` },
  { id: "souleve-terre-roumain", nom: "Soulevé de terre roumain", groupesMusculaires: ["Ischio-jambiers", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/souleve-terre-roumain.png` },
  { id: "good-morning", nom: "Good morning", groupesMusculaires: ["Ischio-jambiers", "Dos"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/good-morning.png` },
  { id: "fentes", nom: "Fentes", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Haltères"], sports: ["Général"], qualitesPhysiques: ["Force", "Coordination"], icon: "walk-outline", pattern: "lunge", photoUrl: `${IMAGE_BASE}/fentes.png` },
  { id: "hip-thrust", nom: "Hip thrust", groupesMusculaires: ["Fessiers"], materiel: ["Barre", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/hip-thrust.png` },
  { id: "presse-cuisses", nom: "Presse à cuisses", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "settings-outline", pattern: "squat" },
  { id: "developpe-couche", nom: "Développé couché", groupesMusculaires: ["Pectoraux", "Triceps"], materiel: ["Barre", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "push_horizontal", photoUrl: `${IMAGE_BASE}/developpe-couche.png` },
  { id: "developpe-militaire", nom: "Développé militaire", groupesMusculaires: ["Épaules", "Triceps"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "push_vertical", photoUrl: `${IMAGE_BASE}/developpe-militaire.png` },
  { id: "elevations-laterales", nom: "Élévations latérales", groupesMusculaires: ["Épaules"], materiel: ["Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/elevations-laterales.png` },
  { id: "tractions", nom: "Tractions", groupesMusculaires: ["Dos", "Biceps"], materiel: ["Poids du corps"], sports: ["Musculation", "Général"], qualitesPhysiques: ["Force"], icon: "body-outline", pattern: "pull_vertical" },
  { id: "tirage-vertical", nom: "Tirage vertical", groupesMusculaires: ["Dos", "Biceps"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "fitness-outline", pattern: "pull_vertical", photoUrl: `${IMAGE_BASE}/tirage-vertical.png` },
  { id: "rowing-barre", nom: "Rowing barre", groupesMusculaires: ["Dos"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "pull_horizontal" },
  { id: "rowing-haltere", nom: "Rowing haltère", groupesMusculaires: ["Dos"], materiel: ["Haltères", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "pull_horizontal" },
  { id: "tirage-horizontal", nom: "Tirage horizontal", groupesMusculaires: ["Dos", "Biceps"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "fitness-outline", pattern: "pull_horizontal", photoUrl: `${IMAGE_BASE}/tirage-horizontal.png` },
  { id: "pompes", nom: "Pompes", groupesMusculaires: ["Pectoraux", "Triceps"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Force", "Endurance"], icon: "body-outline", pattern: "push_horizontal" },
  { id: "curl-biceps", nom: "Curl biceps", groupesMusculaires: ["Biceps"], materiel: ["Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/curl-biceps.png` },
  { id: "extension-triceps", nom: "Extension triceps", groupesMusculaires: ["Triceps"], materiel: ["Haltères", "Élastique"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation" },
  { id: "gainage-planche", nom: "Gainage (planche)", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core" },
  { id: "hollow-body", nom: "Hollow body hold", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core" },
  { id: "russian-twist", nom: "Russian twist", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage", "Coordination"], icon: "body-outline", pattern: "core_rotation" },
  { id: "mountain-climbers", nom: "Mountain climbers", groupesMusculaires: ["Abdominaux", "Full body"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Coordination"], icon: "walk-outline", pattern: "core_rotation" },
  { id: "burpees", nom: "Burpees", groupesMusculaires: ["Full body"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Puissance"], icon: "flash-outline", pattern: "jump" },
  { id: "corde-a-sauter", nom: "Corde à sauter", groupesMusculaires: ["Mollets", "Full body"], materiel: ["Corde"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Coordination"], icon: "sync-outline", pattern: "locomotion" },
  { id: "sprint", nom: "Sprint", groupesMusculaires: ["Full body"], materiel: ["Poids du corps"], sports: ["Athlétisme", "Football", "Rugby"], qualitesPhysiques: ["Vitesse"], icon: "walk-outline", pattern: "locomotion" },
  { id: "box-jump", nom: "Box jump", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Poids du corps"], sports: ["Athlétisme", "Basketball"], qualitesPhysiques: ["Puissance"], icon: "flash-outline", pattern: "jump" },
  { id: "kettlebell-swing", nom: "Kettlebell swing", groupesMusculaires: ["Fessiers", "Dos"], materiel: ["Kettlebell"], sports: ["Général"], qualitesPhysiques: ["Puissance", "Endurance"], icon: "fitness-outline", pattern: "hinge" },
  { id: "farmer-walk", nom: "Farmer's walk", groupesMusculaires: ["Full body"], materiel: ["Haltères", "Kettlebell"], sports: ["Général"], qualitesPhysiques: ["Force", "Gainage"], icon: "walk-outline", pattern: "locomotion" },
  { id: "battle-ropes", nom: "Battle ropes", groupesMusculaires: ["Épaules", "Full body"], materiel: ["Corde"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Puissance"], icon: "pulse-outline", pattern: "isolation" },
  { id: "gainage-lateral", nom: "Gainage latéral", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core" },
  { id: "mollets-debout", nom: "Mollets debout", groupesMusculaires: ["Mollets"], materiel: ["Machine", "Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation" },
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
