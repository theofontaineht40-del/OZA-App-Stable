import { QualiteKey } from "./sports-radar";

// Relie chaque test existant à la qualité physique qu'il évalue le mieux.
// Certaines qualités (coordination, hypertrophie...) n'ont pas de test
// correspondant dans le catalogue actuel et restent à évaluer manuellement.
export const TEST_QUALITY_MAP: Partial<Record<string, QualiteKey>> = {
  // Vitesse
  sprint_5m: "vitesse_execution",
  sprint_10m: "vitesse_execution",
  sprint_20m: "vitesse_execution",
  sprint_30m: "vitesse_execution",
  flying_sprint: "vitesse_execution",
  cod_505: "vitesse_reaction",
  illinois: "vitesse_reaction",
  t_test: "vitesse_reaction",

  // Puissance
  cmj: "puissance_alactique",
  sj: "puissance_alactique",
  dj: "puissance_alactique",
  rsi: "puissance_alactique",

  // Force
  "1rm": "force_maximale",
  "3rm": "force_maximale",
  "5rm": "force_maximale",
  squat_max: "force_maximale",
  bench_max: "force_maximale",
  deadlift_max: "force_maximale",
  imtp: "force_maximale",
  grip: "force_maximale",

  // Endurance
  vma: "vma",
  vameval: "vma",
  luc_leger: "vma",
  cooper: "endurance_aerobie",
  vo2max: "endurance_aerobie",
  yoyo: "capacite_repetition",
  lactate: "endurance_lactique",

  // Mobilité → souplesse
  knee_to_wall: "souplesse",
  weight_bearing_lunge: "souplesse",
  thomas_test: "souplesse",
  ober_test: "souplesse",
  straight_leg_raise: "souplesse",
  hip_90_90: "souplesse",
  thoracic_rotation: "souplesse",
  thoracic_extension: "souplesse",
  shoulder_apley: "souplesse",
  shoulder_flexion: "souplesse",
  shoulder_rotation_ext: "souplesse",
  shoulder_rotation_int: "souplesse",
  wrist_mobility: "souplesse",
  knee_mobility: "souplesse",
};
