export type PosturalView = "face" | "profil" | "dos";

export type CorrectiveExercise = {
  nom: string;
  series: number;
  repetitions: string;
  rpe: number;
  recuperation: string;
};

export type PosturalAnomaly = {
  key: string;
  label: string;
  view: PosturalView;
  chainesRaccourcies: string[];
  chainesFaibles: string[];
  exercices: CorrectiveExercise[];
};

export const POSTURAL_ANOMALIES: PosturalAnomaly[] = [
  {
    key: "tete_projetee",
    label: "Projection de tête",
    view: "face",
    chainesRaccourcies: ["Chaîne postérieure cervicale", "Trapèze supérieur"],
    chainesFaibles: ["Fléchisseurs profonds du cou"],
    exercices: [
      { nom: "Rétraction cervicale (chin tuck)", series: 3, repetitions: "12", rpe: 4, recuperation: "45 sec" },
      { nom: "Étirement trapèze supérieur", series: 2, repetitions: "30 sec", rpe: 2, recuperation: "20 sec" },
    ],
  },
  {
    key: "epaules_enroulees",
    label: "Épaules enroulées",
    view: "face",
    chainesRaccourcies: ["Grand pectoral", "Petit pectoral"],
    chainesFaibles: ["Rhomboïdes", "Trapèze moyen/inférieur"],
    exercices: [
      { nom: "Étirement pectoraux au cadre de porte", series: 3, repetitions: "30 sec", rpe: 3, recuperation: "20 sec" },
      { nom: "Face pull à la poulie", series: 3, repetitions: "15", rpe: 5, recuperation: "60 sec" },
    ],
  },
  {
    key: "genou_valgus",
    label: "Genou valgus",
    view: "face",
    chainesRaccourcies: ["Bandelette ilio-tibiale", "Adducteurs"],
    chainesFaibles: ["Moyen fessier", "Vaste médial"],
    exercices: [
      { nom: "Clam shell avec élastique", series: 3, repetitions: "15", rpe: 4, recuperation: "45 sec" },
      { nom: "Squat unilatéral contrôlé", series: 3, repetitions: "8", rpe: 6, recuperation: "90 sec" },
    ],
  },
  {
    key: "genou_varus",
    label: "Genou varus",
    view: "face",
    chainesRaccourcies: ["Tenseur du fascia lata"],
    chainesFaibles: ["Adducteurs", "Vaste médial"],
    exercices: [
      { nom: "Étirement TFL debout", series: 2, repetitions: "30 sec", rpe: 3, recuperation: "20 sec" },
      { nom: "Adduction hanche à la poulie", series: 3, repetitions: "12", rpe: 5, recuperation: "60 sec" },
    ],
  },
  {
    key: "pieds_plats",
    label: "Pieds plats",
    view: "face",
    chainesRaccourcies: ["Triceps sural"],
    chainesFaibles: ["Tibial postérieur", "Muscles intrinsèques du pied"],
    exercices: [
      { nom: "Short foot exercise", series: 3, repetitions: "10", rpe: 3, recuperation: "30 sec" },
      { nom: "Étirement mollets", series: 2, repetitions: "30 sec", rpe: 2, recuperation: "20 sec" },
    ],
  },

  {
    key: "hyperlordose",
    label: "Hyperlordose lombaire",
    view: "profil",
    chainesRaccourcies: ["Fléchisseurs de hanche", "Erector spinae lombaire"],
    chainesFaibles: ["Grand fessier", "Abdominaux profonds"],
    exercices: [
      { nom: "Étirement psoas (fente)", series: 2, repetitions: "30 sec", rpe: 3, recuperation: "20 sec" },
      { nom: "Gainage bascule du bassin", series: 3, repetitions: "12", rpe: 4, recuperation: "45 sec" },
    ],
  },
  {
    key: "cyphose",
    label: "Cyphose dorsale",
    view: "profil",
    chainesRaccourcies: ["Grand pectoral", "Dorsal"],
    chainesFaibles: ["Extenseurs thoraciques", "Trapèze moyen"],
    exercices: [
      { nom: "Extension thoracique sur foam roller", series: 3, repetitions: "10", rpe: 3, recuperation: "30 sec" },
      { nom: "Y-raise face contre mur", series: 3, repetitions: "12", rpe: 4, recuperation: "45 sec" },
    ],
  },
  {
    key: "anteversion_bassin",
    label: "Antéversion du bassin",
    view: "profil",
    chainesRaccourcies: ["Fléchisseurs de hanche", "Erector spinae"],
    chainesFaibles: ["Grand fessier", "Ischio-jambiers"],
    exercices: [
      { nom: "Hip thrust", series: 3, repetitions: "10", rpe: 6, recuperation: "90 sec" },
      { nom: "Étirement fléchisseurs de hanche", series: 2, repetitions: "30 sec", rpe: 3, recuperation: "20 sec" },
    ],
  },
  {
    key: "retroversion_bassin",
    label: "Rétroversion du bassin",
    view: "profil",
    chainesRaccourcies: ["Ischio-jambiers", "Grand fessier"],
    chainesFaibles: ["Fléchisseurs de hanche", "Erector spinae"],
    exercices: [
      { nom: "Étirement ischio-jambiers", series: 2, repetitions: "30 sec", rpe: 3, recuperation: "20 sec" },
      { nom: "Superman renforcement lombaire", series: 3, repetitions: "12", rpe: 4, recuperation: "45 sec" },
    ],
  },

  {
    key: "scapula_ailee",
    label: "Scapula ailée",
    view: "dos",
    chainesRaccourcies: ["Grand dentelé (faible tonus)"],
    chainesFaibles: ["Grand dentelé", "Trapèze inférieur"],
    exercices: [
      { nom: "Push-up plus", series: 3, repetitions: "12", rpe: 5, recuperation: "60 sec" },
      { nom: "Scapular wall slide", series: 3, repetitions: "10", rpe: 3, recuperation: "45 sec" },
    ],
  },
  {
    key: "rotation_bassin",
    label: "Rotation du bassin",
    view: "dos",
    chainesRaccourcies: ["Piriforme (côté rotation)"],
    chainesFaibles: ["Moyen fessier controlatéral"],
    exercices: [
      { nom: "Étirement piriforme", series: 2, repetitions: "30 sec", rpe: 3, recuperation: "20 sec" },
      { nom: "Clam shell unilatéral", series: 3, repetitions: "15", rpe: 4, recuperation: "45 sec" },
    ],
  },
  {
    key: "asymetrie_epaules",
    label: "Asymétrie des épaules",
    view: "dos",
    chainesRaccourcies: ["Trapèze supérieur (côté haut)"],
    chainesFaibles: ["Trapèze inférieur controlatéral"],
    exercices: [
      { nom: "Étirement trapèze unilatéral", series: 2, repetitions: "30 sec", rpe: 2, recuperation: "20 sec" },
      { nom: "Y-raise unilatéral", series: 3, repetitions: "12", rpe: 4, recuperation: "45 sec" },
    ],
  },
];

export function anomaliesForView(view: PosturalView): PosturalAnomaly[] {
  return POSTURAL_ANOMALIES.filter((a) => a.view === view);
}

export function getAnomaly(key: string): PosturalAnomaly | undefined {
  return POSTURAL_ANOMALIES.find((a) => a.key === key);
}
