// Référentiel scientifique d'OZA : types partagés par les données, le moteur de
// prescription et l'IA. AUCUN import d'interface (React, Expo, Firebase) ici :
// ce dossier doit rester du TypeScript pur, testable avec Node.
//
// Principes (voir science/README.md) :
//  - une règle n'existe que si elle cite des sources vérifiées ;
//  - seules les règles au statut « valide » sont utilisables par le moteur ;
//  - tout ce que le moteur prescrit garde la liste des règles qui l'ont produit.

export type Level = "debutant" | "intermediaire" | "avance";

// Les 10 catégories du référentiel.
export type Category =
  | "A" // volume par groupe musculaire
  | "B" // intensité, répétitions, RPE/RIR, repos
  | "C" // fréquence et répartition
  | "D" // progression, périodisation, décharge
  | "E" // vitesse, sprint, pliométrie
  | "F" // filières énergétiques, intermittent
  | "G" // prévention des blessures
  | "H" // équilibres musculaires et patterns
  | "I" // charge d'entraînement et risque
  | "J"; // populations particulières

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "A", label: "Volume par groupe musculaire" },
  { key: "B", label: "Intensité, répétitions, RPE/RIR, repos" },
  { key: "C", label: "Fréquence et répartition" },
  { key: "D", label: "Progression, périodisation, décharge" },
  { key: "E", label: "Vitesse, sprint, pliométrie" },
  { key: "F", label: "Filières énergétiques et intermittent" },
  { key: "G", label: "Prévention des blessures" },
  { key: "H", label: "Équilibres et patterns moteurs" },
  { key: "I", label: "Charge d'entraînement et risque" },
  { key: "J", label: "Populations particulières" },
];

export type EvidenceLevel = "fort" | "modere" | "faible" | "opinion";

// brouillon : importé, pas encore relu. valide : relu et accepté par le
// responsable scientifique (le coach). refuse : écarté, conservé pour mémoire.
export type RuleStatus = "brouillon" | "valide" | "refuse";

export type StudyType =
  | "meta-analyse"
  | "revue-systematique"
  | "essai-controle"
  | "observationnelle"
  | "consensus"
  | "autre";

export type ScienceSource = {
  id: string; // ex. "schoenfeld-2017-dose-response"
  authors: string;
  year: number;
  title: string;
  journal: string;
  doi?: string;
  pmid?: string;
  studyType: StudyType;
  // Population étudiée (obligatoire : on ne transpose pas les pros aux amateurs sans le dire).
  population: string;
  // true seulement quand un humain a ouvert le DOI/PMID et vérifié que la
  // référence existe et dit ce qu'on lui fait dire.
  verified: boolean;
  verifiedAt?: string; // AAAA-MM-JJ
  notes?: string;
};

// Valeur d'un paramètre : minimale, recommandée, maximale indicative.
export type Range = { min: number | null; recommended: number | null; max: number | null };

export type RuleTarget = {
  // muscle : id de constants/muscle-groups ; quality : qualité physique ; pattern : pattern de mouvement.
  kind: "muscle" | "quality" | "pattern" | "energy" | "general";
  id: string;
};

export type ScienceRule = {
  id: string; // unique, stable : ex. "A-quadriceps-volume-hebdo"
  category: Category;
  parameter: string; // ex. "Séries par semaine"
  unit: string; // ex. "séries/semaine", "% 1RM", "s", "%"
  value: Range; // valeur générale
  byLevel?: Partial<Record<Level, Range>>;
  // Sports concernés (ids OZA, ex. "rugby") ou "*" pour tous.
  sportIds: string[] | "*";
  positionIds?: string[];
  target: RuleTarget;
  // Public concerné quand la règle ne vaut pas pour tout le monde.
  population?: { sexe?: "homme" | "femme"; ageMin?: number; ageMax?: number; note?: string };
  evidence: EvidenceLevel;
  sourceIds: string[];
  limits: string; // limites scientifiques
  conditions: string; // conditions d'application
  status: RuleStatus;
  version: number;
  validatedBy?: string;
  validatedAt?: string; // AAAA-MM-JJ
  notes?: string;
};

// ── Modèles de sport et métadonnées d'exercices (structure, remplie en phases 3 à 5) ──

export type SportModel = {
  sportId: string;
  // Qualités classées par priorité (1 = la plus importante), chacune reliée à des règles.
  qualities: { id: string; priority: 1 | 2 | 3 | 4 | 5; ruleIds: string[] }[];
  energy: { phosphagen: number | null; glycolytic: number | null; oxidative: number | null } | null;
  muscles: { id: string; priority: 1 | 2 | 3 | 4 | 5 }[];
  tests: { id: string; ruleIds: string[] }[];
  // Surcharges par poste ou spécialité.
  positions: Record<string, { qualities?: { id: string; priority: 1 | 2 | 3 | 4 | 5 }[]; muscles?: { id: string; priority: 1 | 2 | 3 | 4 | 5 }[] }>;
  status: RuleStatus;
  version: number;
};

export type ExerciseMeta = {
  exerciseId: string; // id de constants/exercise-library
  pattern: string;
  // Part de la série comptée pour chaque muscle (1 = principal, 0.5 = secondaire).
  muscles: { id: string; weight: number }[];
  minLevel: Level;
  equipment: string[];
  // Zones (ids de constants/body-zones) pour lesquelles l'exercice est déconseillé ou à remplacer.
  contraindicatedZones: string[];
  alternativeIds: string[];
};

// ── Traçabilité d'une prescription ──

export type RuleUse = { ruleId: string; ruleVersion: number; appliedTo: string; note?: string };

export type PrescriptionStatus = "propose" | "valide_coach" | "refuse_coach";

export type PrescriptionTrace = {
  engineVersion: string;
  generatedAt: number;
  // Copie du profil et des variables au moment de la génération.
  input: Record<string, unknown>;
  rulesUsed: RuleUse[];
  // Règles qu'on aurait voulu appliquer mais qui sont absentes ou non validées.
  gaps: string[];
  status: PrescriptionStatus;
};
