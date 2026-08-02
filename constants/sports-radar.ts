export type QualiteKey =
  | "coordination"
  | "souplesse"
  | "vitesse_reaction"
  | "vitesse_execution"
  | "endurance_aerobie"
  | "vma"
  | "endurance_lactique"
  | "puissance_lactique"
  | "capacite_alactique"
  | "capacite_repetition"
  | "puissance_alactique"
  | "force_maximale"
  | "force_puissance"
  | "force_vitesse"
  | "endurance_force"
  | "hypertrophie_sarcomerique"
  | "hypertrophie_sarcoplasmique";

export const QUALITES: { key: QualiteKey; label: string; code: string }[] = [
  { key: "coordination", label: "Coordination", code: "COORD" },
  { key: "souplesse", label: "Souplesse", code: "SOUPL" },
  { key: "vitesse_reaction", label: "Vitesse de réaction", code: "V.REA" },
  { key: "vitesse_execution", label: "Vitesse d'exécution", code: "V.EXE" },
  { key: "endurance_aerobie", label: "Endurance aérobie", code: "END.A" },
  { key: "vma", label: "VMA", code: "VMA" },
  { key: "endurance_lactique", label: "Endurance lactique", code: "END.L" },
  { key: "puissance_lactique", label: "Puissance lactique", code: "PUI.L" },
  { key: "capacite_alactique", label: "Capacité alactique", code: "CAP.A" },
  { key: "capacite_repetition", label: "Capacité à répéter les efforts", code: "RSA" },
  { key: "puissance_alactique", label: "Puissance alactique", code: "PUI.A" },
  { key: "force_maximale", label: "Force maximale", code: "F.MAX" },
  { key: "force_puissance", label: "Force-puissance", code: "F.PUI" },
  { key: "force_vitesse", label: "Force-vitesse", code: "F.VIT" },
  { key: "endurance_force", label: "Endurance de force", code: "END.F" },
  { key: "hypertrophie_sarcomerique", label: "Hypertrophie sarcomérique", code: "HYP.S" },
  { key: "hypertrophie_sarcoplasmique", label: "Hypertrophie sarcoplasmique", code: "HYP.P" },
];

export type SportRadar = Record<QualiteKey, number>;

export type SportProfile = {
  key: string;
  label: string;
  radar: SportRadar;
};

// Valeurs de départ indicatives (0-10), basées sur les profils d'exigence
// généralement admis en préparation physique. Modifiables par le coach.
export const SPORTS: SportProfile[] = [
  {
    key: "football",
    label: "Football",
    radar: {
      coordination: 8, souplesse: 6, vitesse_reaction: 7, vitesse_execution: 8,
      endurance_aerobie: 8, vma: 8, endurance_lactique: 6, puissance_lactique: 6,
      capacite_alactique: 7, capacite_repetition: 8, puissance_alactique: 6,
      force_maximale: 6, force_puissance: 7, force_vitesse: 8, endurance_force: 5,
      hypertrophie_sarcomerique: 4, hypertrophie_sarcoplasmique: 3,
    },
  },
  {
    key: "rugby",
    label: "Rugby",
    radar: {
      coordination: 7, souplesse: 5, vitesse_reaction: 7, vitesse_execution: 7,
      endurance_aerobie: 7, vma: 6, endurance_lactique: 7, puissance_lactique: 7,
      capacite_alactique: 8, capacite_repetition: 7, puissance_alactique: 8,
      force_maximale: 8, force_puissance: 8, force_vitesse: 7, endurance_force: 7,
      hypertrophie_sarcomerique: 7, hypertrophie_sarcoplasmique: 6,
    },
  },
  {
    key: "basketball",
    label: "Basketball",
    radar: {
      coordination: 9, souplesse: 6, vitesse_reaction: 8, vitesse_execution: 8,
      endurance_aerobie: 6, vma: 6, endurance_lactique: 6, puissance_lactique: 7,
      capacite_alactique: 8, capacite_repetition: 7, puissance_alactique: 8,
      force_maximale: 6, force_puissance: 7, force_vitesse: 7, endurance_force: 5,
      hypertrophie_sarcomerique: 5, hypertrophie_sarcoplasmique: 4,
    },
  },
  {
    key: "volleyball",
    label: "Volleyball",
    radar: {
      coordination: 8, souplesse: 7, vitesse_reaction: 8, vitesse_execution: 7,
      endurance_aerobie: 5, vma: 5, endurance_lactique: 5, puissance_lactique: 6,
      capacite_alactique: 9, capacite_repetition: 6, puissance_alactique: 9,
      force_maximale: 6, force_puissance: 8, force_vitesse: 7, endurance_force: 5,
      hypertrophie_sarcomerique: 5, hypertrophie_sarcoplasmique: 4,
    },
  },
  {
    key: "course_a_pied",
    label: "Course à pied (demi-fond/fond)",
    radar: {
      coordination: 5, souplesse: 4, vitesse_reaction: 4, vitesse_execution: 6,
      endurance_aerobie: 10, vma: 9, endurance_lactique: 7, puissance_lactique: 5,
      capacite_alactique: 3, capacite_repetition: 4, puissance_alactique: 3,
      force_maximale: 3, force_puissance: 4, force_vitesse: 5, endurance_force: 6,
      hypertrophie_sarcomerique: 2, hypertrophie_sarcoplasmique: 2,
    },
  },
  {
    key: "hyrox",
    label: "Hyrox",
    radar: {
      coordination: 5, souplesse: 5, vitesse_reaction: 4, vitesse_execution: 6,
      endurance_aerobie: 9, vma: 7, endurance_lactique: 8, puissance_lactique: 6,
      capacite_alactique: 4, capacite_repetition: 8, puissance_alactique: 5,
      force_maximale: 6, force_puissance: 6, force_vitesse: 5, endurance_force: 9,
      hypertrophie_sarcomerique: 4, hypertrophie_sarcoplasmique: 4,
    },
  },
  {
    key: "natation",
    label: "Natation",
    radar: {
      coordination: 8, souplesse: 8, vitesse_reaction: 6, vitesse_execution: 6,
      endurance_aerobie: 8, vma: 6, endurance_lactique: 7, puissance_lactique: 6,
      capacite_alactique: 5, capacite_repetition: 5, puissance_alactique: 6,
      force_maximale: 5, force_puissance: 6, force_vitesse: 6, endurance_force: 6,
      hypertrophie_sarcomerique: 4, hypertrophie_sarcoplasmique: 4,
    },
  },
  {
    key: "cyclisme",
    label: "Cyclisme (route)",
    radar: {
      coordination: 4, souplesse: 3, vitesse_reaction: 3, vitesse_execution: 4,
      endurance_aerobie: 10, vma: 8, endurance_lactique: 6, puissance_lactique: 5,
      capacite_alactique: 3, capacite_repetition: 5, puissance_alactique: 4,
      force_maximale: 5, force_puissance: 5, force_vitesse: 4, endurance_force: 7,
      hypertrophie_sarcomerique: 3, hypertrophie_sarcoplasmique: 2,
    },
  },
  {
    key: "musculation",
    label: "Musculation",
    radar: {
      coordination: 4, souplesse: 3, vitesse_reaction: 2, vitesse_execution: 3,
      endurance_aerobie: 2, vma: 2, endurance_lactique: 4, puissance_lactique: 3,
      capacite_alactique: 4, capacite_repetition: 3, puissance_alactique: 4,
      force_maximale: 8, force_puissance: 6, force_vitesse: 3, endurance_force: 6,
      hypertrophie_sarcomerique: 8, hypertrophie_sarcoplasmique: 9,
    },
  },
  {
    key: "crossfit",
    label: "CrossFit",
    radar: {
      coordination: 7, souplesse: 6, vitesse_reaction: 5, vitesse_execution: 7,
      endurance_aerobie: 7, vma: 6, endurance_lactique: 8, puissance_lactique: 8,
      capacite_alactique: 6, capacite_repetition: 9, puissance_alactique: 7,
      force_maximale: 7, force_puissance: 8, force_vitesse: 7, endurance_force: 8,
      hypertrophie_sarcomerique: 5, hypertrophie_sarcoplasmique: 5,
    },
  },
];

export function getSport(key: string): SportProfile | undefined {
  return SPORTS.find((s) => s.key === key);
}

export function emptyRadar(): SportRadar {
  const radar = {} as SportRadar;
  QUALITES.forEach((q) => {
    radar[q.key] = 0;
  });
  return radar;
}
