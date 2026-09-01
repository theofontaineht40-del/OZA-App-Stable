// Sélection manuelle des muscles sollicités par une séance — indépendante
// des exercices qui la composent et du nom de la séance. Remplace, quand
// elle est renseignée, la déduction automatique historique
// (constants/exercise-muscles.ts, à partir des exercices) qui reste le
// filet de sécurité pour les séances créées avant cette fonctionnalité
// (voir Seance.muscles dans services/programmes.ts).
//
// Taxonomie volontairement plus fine que les 12 groupes "grossiers" de
// constants/muscle-groups.ts (ex : 3 zones de deltoïde au lieu d'un seul
// "shoulders") — c'est un système à part, pas une extension du premier.
export type MuscleId =
  | "quadriceps"
  | "ischio_jambiers"
  | "fessiers"
  | "mollets"
  | "adducteurs"
  | "grand_dorsal"
  | "trapezes"
  | "rhomboides"
  | "erecteurs_rachis"
  | "grand_pectoral"
  | "petit_pectoral"
  | "deltoide_anterieur"
  | "deltoide_moyen"
  | "deltoide_posterieur"
  | "biceps"
  | "triceps"
  | "avant_bras"
  | "grand_droit"
  | "obliques"
  | "transverse";

export type MuscleCategory = {
  label: string;
  muscles: { id: MuscleId; label: string }[];
};

export const MUSCLE_CATEGORIES: MuscleCategory[] = [
  {
    label: "Jambes",
    muscles: [
      { id: "quadriceps", label: "Quadriceps" },
      { id: "ischio_jambiers", label: "Ischio-jambiers" },
      { id: "fessiers", label: "Fessiers" },
      { id: "mollets", label: "Mollets" },
      { id: "adducteurs", label: "Adducteurs" },
    ],
  },
  {
    label: "Dos",
    muscles: [
      { id: "grand_dorsal", label: "Grand dorsal" },
      { id: "trapezes", label: "Trapèzes" },
      { id: "rhomboides", label: "Rhomboïdes" },
      { id: "erecteurs_rachis", label: "Érecteurs du rachis" },
    ],
  },
  {
    label: "Pectoraux",
    muscles: [
      { id: "grand_pectoral", label: "Grand pectoral" },
      { id: "petit_pectoral", label: "Petit pectoral" },
    ],
  },
  {
    label: "Épaules",
    muscles: [
      { id: "deltoide_anterieur", label: "Deltoïde antérieur" },
      { id: "deltoide_moyen", label: "Deltoïde moyen" },
      { id: "deltoide_posterieur", label: "Deltoïde postérieur" },
    ],
  },
  {
    label: "Bras",
    muscles: [
      { id: "biceps", label: "Biceps" },
      { id: "triceps", label: "Triceps" },
      { id: "avant_bras", label: "Avant-bras" },
    ],
  },
  {
    label: "Centre du corps",
    muscles: [
      { id: "grand_droit", label: "Grand droit" },
      { id: "obliques", label: "Obliques" },
      { id: "transverse", label: "Transverse" },
    ],
  },
];

export const MUSCLE_ID_LABELS: Record<MuscleId, string> = Object.fromEntries(
  MUSCLE_CATEGORIES.flatMap((c) => c.muscles.map((m) => [m.id, m.label]))
) as Record<MuscleId, string>;
