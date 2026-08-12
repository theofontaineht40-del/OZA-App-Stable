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
// jsDelivr et les navigateurs mettent ces images en cache jusqu'à 7 jours
// (même nom de fichier à chaque mise à jour de photo) : sans un paramètre qui
// change, une photo remplacée continue de s'afficher en version périmée pour
// les utilisateurs qui l'ont déjà chargée. Incrémenter à chaque fois qu'une
// image existante est remplacée (pas besoin d'y toucher pour un ajout).
const IMAGE_VERSION = "2";

export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  { id: "squat-arriere", nom: "Squat arrière", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Barre"], sports: ["Musculation", "Général"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "squat", photoUrl: `${IMAGE_BASE}/squat-arriere.png?v=${IMAGE_VERSION}` },
  { id: "squat-avant", nom: "Squat avant", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "squat", photoUrl: `${IMAGE_BASE}/squat-avant.png?v=${IMAGE_VERSION}` },
  { id: "squat-saute", nom: "Squat sauté", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Poids du corps"], sports: ["Général", "Basketball"], qualitesPhysiques: ["Puissance"], icon: "flash-outline", pattern: "jump", photoUrl: `${IMAGE_BASE}/squat-saute.png?v=${IMAGE_VERSION}` },
  { id: "split-squat", nom: "Split squat bulgare", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Haltères", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Coordination"], icon: "walk-outline", pattern: "lunge", photoUrl: `${IMAGE_BASE}/split-squat.png?v=${IMAGE_VERSION}` },
  { id: "cmj", nom: "Countermovement jump", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Poids du corps"], sports: ["Athlétisme", "Basketball"], qualitesPhysiques: ["Puissance"], icon: "flash-outline", pattern: "jump", photoUrl: `${IMAGE_BASE}/cmj.png?v=${IMAGE_VERSION}` },
  { id: "solueve-terre", nom: "Soulevé de terre", groupesMusculaires: ["Dos", "Ischio-jambiers", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/solueve-terre.png?v=${IMAGE_VERSION}` },
  { id: "souleve-terre-roumain", nom: "Soulevé de terre roumain", groupesMusculaires: ["Ischio-jambiers", "Fessiers"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/souleve-terre-roumain.png?v=${IMAGE_VERSION}` },
  { id: "good-morning", nom: "Good morning", groupesMusculaires: ["Ischio-jambiers", "Dos"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/good-morning.png?v=${IMAGE_VERSION}` },
  { id: "fentes", nom: "Fentes", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Haltères"], sports: ["Général"], qualitesPhysiques: ["Force", "Coordination"], icon: "walk-outline", pattern: "lunge", photoUrl: `${IMAGE_BASE}/fentes.png?v=${IMAGE_VERSION}` },
  { id: "hip-thrust", nom: "Hip thrust", groupesMusculaires: ["Fessiers"], materiel: ["Barre", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/hip-thrust.png?v=${IMAGE_VERSION}` },
  { id: "ghd-extension", nom: "Extension GHD", groupesMusculaires: ["Ischio-jambiers", "Dos", "Fessiers"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Gainage"], icon: "fitness-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/ghd-extension.png?v=${IMAGE_VERSION}` },
  { id: "ghd-jefferson-curl", nom: "GHD Jefferson curl", groupesMusculaires: ["Dos", "Ischio-jambiers"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Mobilité"], icon: "fitness-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/ghd-jefferson-curl.png?v=${IMAGE_VERSION}` },
  { id: "kickback-fessier", nom: "Kickback fessier", groupesMusculaires: ["Fessiers"], materiel: ["Machine", "Élastique"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/kickback-fessier.png?v=${IMAGE_VERSION}` },
  { id: "abduction-hanche-poulie", nom: "Abduction de hanche (poulie basse)", groupesMusculaires: ["Fessiers"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/abduction-hanche-poulie.png?v=${IMAGE_VERSION}` },
  { id: "presse-cuisses", nom: "Presse à cuisses", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "settings-outline", pattern: "squat", photoUrl: `${IMAGE_BASE}/presse-cuisses.png?v=${IMAGE_VERSION}` },
  { id: "leg-extension", nom: "Leg extension", groupesMusculaires: ["Quadriceps"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/leg-extension.png?v=${IMAGE_VERSION}` },
  { id: "leg-curl", nom: "Leg curl", groupesMusculaires: ["Ischio-jambiers"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/leg-curl.png?v=${IMAGE_VERSION}` },
  { id: "developpe-couche", nom: "Développé couché", groupesMusculaires: ["Pectoraux", "Triceps"], materiel: ["Barre", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "push_horizontal", photoUrl: `${IMAGE_BASE}/developpe-couche.png?v=${IMAGE_VERSION}` },
  { id: "developpe-couche-halteres", nom: "Développé couché haltères", groupesMusculaires: ["Pectoraux", "Triceps"], materiel: ["Haltères", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "fitness-outline", pattern: "push_horizontal", photoUrl: `${IMAGE_BASE}/developpe-couche-halteres.png?v=${IMAGE_VERSION}` },
  { id: "developpe-militaire", nom: "Développé militaire", groupesMusculaires: ["Épaules", "Triceps"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "barbell-outline", pattern: "push_vertical", photoUrl: `${IMAGE_BASE}/developpe-militaire.png?v=${IMAGE_VERSION}` },
  { id: "developpe-militaire-halteres", nom: "Développé militaire haltères", groupesMusculaires: ["Épaules", "Triceps"], materiel: ["Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Force"], icon: "fitness-outline", pattern: "push_vertical", photoUrl: `${IMAGE_BASE}/developpe-militaire-halteres.png?v=${IMAGE_VERSION}` },
  { id: "elevations-laterales", nom: "Élévations latérales", groupesMusculaires: ["Épaules"], materiel: ["Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/elevations-laterales.png?v=${IMAGE_VERSION}` },
  { id: "tractions", nom: "Tractions", groupesMusculaires: ["Dos", "Biceps"], materiel: ["Poids du corps"], sports: ["Musculation", "Général"], qualitesPhysiques: ["Force"], icon: "body-outline", pattern: "pull_vertical", photoUrl: `${IMAGE_BASE}/tractions.png?v=${IMAGE_VERSION}` },
  { id: "tirage-vertical", nom: "Tirage vertical", groupesMusculaires: ["Dos", "Biceps"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "fitness-outline", pattern: "pull_vertical", photoUrl: `${IMAGE_BASE}/tirage-vertical.png?v=${IMAGE_VERSION}` },
  { id: "rowing-barre", nom: "Rowing barre", groupesMusculaires: ["Dos"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "barbell-outline", pattern: "pull_horizontal", photoUrl: `${IMAGE_BASE}/rowing-barre.png?v=${IMAGE_VERSION}` },
  { id: "rowing-haltere", nom: "Rowing haltère", groupesMusculaires: ["Dos"], materiel: ["Haltères", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "pull_horizontal", photoUrl: `${IMAGE_BASE}/rowing-haltere.png?v=${IMAGE_VERSION}` },
  { id: "tirage-horizontal", nom: "Tirage horizontal", groupesMusculaires: ["Dos", "Biceps"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "fitness-outline", pattern: "pull_horizontal", photoUrl: `${IMAGE_BASE}/tirage-horizontal.png?v=${IMAGE_VERSION}` },
  { id: "pull-over", nom: "Pull-over", groupesMusculaires: ["Dos", "Pectoraux"], materiel: ["Haltères", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "pull_horizontal", photoUrl: `${IMAGE_BASE}/pull-over.png?v=${IMAGE_VERSION}` },
  { id: "pull-over-poulie-basse", nom: "Pull-over poulie basse", groupesMusculaires: ["Dos", "Pectoraux"], materiel: ["Machine", "Banc"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "pull_horizontal", photoUrl: `${IMAGE_BASE}/pull-over-poulie-basse.png?v=${IMAGE_VERSION}` },
  { id: "pull-over-poulie-haute", nom: "Tirage bras tendus (poulie haute)", groupesMusculaires: ["Dos"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "pull_vertical", photoUrl: `${IMAGE_BASE}/pull-over-poulie-haute.png?v=${IMAGE_VERSION}` },
  { id: "pompes", nom: "Pompes", groupesMusculaires: ["Pectoraux", "Triceps"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Force", "Endurance"], icon: "body-outline", pattern: "push_horizontal" },
  { id: "dips", nom: "Dips", groupesMusculaires: ["Triceps", "Pectoraux"], materiel: ["Poids du corps"], sports: ["Musculation", "Général"], qualitesPhysiques: ["Force", "Hypertrophie"], icon: "body-outline", pattern: "push_vertical", photoUrl: `${IMAGE_BASE}/dips.png?v=${IMAGE_VERSION}` },
  { id: "butterfly-pecs", nom: "Butterfly (pec deck)", groupesMusculaires: ["Pectoraux"], materiel: ["Machine"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/butterfly-pecs.png?v=${IMAGE_VERSION}` },
  { id: "curl-biceps", nom: "Curl biceps", groupesMusculaires: ["Biceps"], materiel: ["Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/curl-biceps.png?v=${IMAGE_VERSION}` },
  { id: "curl-biceps-barre", nom: "Curl biceps barre", groupesMusculaires: ["Biceps"], materiel: ["Barre"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "barbell-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/curl-biceps-barre.png?v=${IMAGE_VERSION}` },
  { id: "extension-triceps", nom: "Extension triceps", groupesMusculaires: ["Triceps"], materiel: ["Haltères", "Élastique"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/extension-triceps.png?v=${IMAGE_VERSION}` },
  { id: "gainage-planche", nom: "Gainage (planche)", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core", photoUrl: `${IMAGE_BASE}/gainage-planche.png?v=${IMAGE_VERSION}` },
  { id: "hollow-body", nom: "Hollow body hold", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core" },
  { id: "russian-twist", nom: "Russian twist", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage", "Coordination"], icon: "body-outline", pattern: "core_rotation" },
  { id: "flexion-laterale-obliques", nom: "Flexion latérale (obliques)", groupesMusculaires: ["Abdominaux"], materiel: ["Haltères"], sports: ["Musculation", "Général"], qualitesPhysiques: ["Gainage", "Hypertrophie"], icon: "body-outline", pattern: "core_rotation", photoUrl: `${IMAGE_BASE}/flexion-laterale-obliques.png?v=${IMAGE_VERSION}` },
  { id: "mountain-climbers", nom: "Mountain climbers", groupesMusculaires: ["Abdominaux", "Full body"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Coordination"], icon: "walk-outline", pattern: "core_rotation" },
  { id: "burpees", nom: "Burpees", groupesMusculaires: ["Full body"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Puissance"], icon: "flash-outline", pattern: "jump" },
  { id: "corde-a-sauter", nom: "Corde à sauter", groupesMusculaires: ["Mollets", "Full body"], materiel: ["Corde"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Coordination"], icon: "sync-outline", pattern: "locomotion" },
  { id: "sprint", nom: "Sprint", groupesMusculaires: ["Full body"], materiel: ["Poids du corps"], sports: ["Athlétisme", "Football", "Rugby"], qualitesPhysiques: ["Vitesse"], icon: "walk-outline", pattern: "locomotion" },
  { id: "box-jump", nom: "Box jump", groupesMusculaires: ["Quadriceps", "Fessiers"], materiel: ["Poids du corps"], sports: ["Athlétisme", "Basketball"], qualitesPhysiques: ["Puissance"], icon: "flash-outline", pattern: "jump" },
  { id: "kettlebell-swing", nom: "Kettlebell swing", groupesMusculaires: ["Fessiers", "Dos"], materiel: ["Kettlebell"], sports: ["Général"], qualitesPhysiques: ["Puissance", "Endurance"], icon: "fitness-outline", pattern: "hinge", photoUrl: `${IMAGE_BASE}/kettlebell-swing.png?v=${IMAGE_VERSION}` },
  { id: "farmer-walk", nom: "Farmer's walk", groupesMusculaires: ["Full body"], materiel: ["Haltères", "Kettlebell"], sports: ["Général"], qualitesPhysiques: ["Force", "Gainage"], icon: "walk-outline", pattern: "locomotion" },
  { id: "battle-ropes", nom: "Battle ropes", groupesMusculaires: ["Épaules", "Full body"], materiel: ["Corde"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Puissance"], icon: "pulse-outline", pattern: "isolation" },
  { id: "assault-bike", nom: "Assault bike", groupesMusculaires: ["Full body"], materiel: ["Machine"], sports: ["Général"], qualitesPhysiques: ["Endurance", "Puissance"], icon: "bicycle-outline", pattern: "locomotion", photoUrl: `${IMAGE_BASE}/assault-bike.png?v=${IMAGE_VERSION}` },
  { id: "rameur", nom: "Rameur", groupesMusculaires: ["Dos", "Full body"], materiel: ["Machine"], sports: ["Général"], qualitesPhysiques: ["Endurance"], icon: "pulse-outline", pattern: "locomotion", photoUrl: `${IMAGE_BASE}/rameur.png?v=${IMAGE_VERSION}` },
  { id: "skierg", nom: "SkiErg", groupesMusculaires: ["Full body"], materiel: ["Machine"], sports: ["Général"], qualitesPhysiques: ["Endurance"], icon: "pulse-outline", pattern: "locomotion", photoUrl: `${IMAGE_BASE}/skierg.png?v=${IMAGE_VERSION}` },
  { id: "velo", nom: "Vélo", groupesMusculaires: ["Quadriceps", "Full body"], materiel: ["Machine"], sports: ["Général"], qualitesPhysiques: ["Endurance"], icon: "bicycle-outline", pattern: "locomotion", photoUrl: `${IMAGE_BASE}/velo.png?v=${IMAGE_VERSION}` },
  { id: "gainage-lateral", nom: "Gainage latéral", groupesMusculaires: ["Abdominaux"], materiel: ["Poids du corps"], sports: ["Général"], qualitesPhysiques: ["Gainage"], icon: "body-outline", pattern: "core" },
  { id: "mollets-debout", nom: "Mollets debout", groupesMusculaires: ["Mollets"], materiel: ["Machine", "Haltères"], sports: ["Musculation"], qualitesPhysiques: ["Hypertrophie"], icon: "fitness-outline", pattern: "isolation", photoUrl: `${IMAGE_BASE}/mollets-debout.png?v=${IMAGE_VERSION}` },
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
