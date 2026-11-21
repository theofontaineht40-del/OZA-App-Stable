// OZA Programs : catalogue par défaut des sports et de leurs postes /
// spécialités. C'est de la STRUCTURE (noms, axes de préparation tels que listés
// dans le cahier des charges), pas du contenu d'entraînement : les programmes
// eux-mêmes sont rédigés par le coach et publiés dans Firestore.
//
// Ce catalogue sert tant que la collection Firestore `ozaSports` est vide ;
// dès qu'un sport y est enregistré (voir services/oza-programs.ts), la version
// Firestore prend le relais — ajouter ou modifier un sport ne demande donc
// aucun changement de code.

// Variante de mise en page du sport (chaque variante change la composition de
// l'écran, pas seulement les couleurs).
export type OzaVariant = "power" | "speed" | "vertical" | "competition" | "clean";

export type OzaPosition = {
  id: string;
  nom: string;
  description?: string;
  // Axes propres au poste ; vide = on affiche les axes du sport.
  axes?: string[];
};

export type OzaSport = {
  id: string;
  nom: string;
  ordre: number;
  variant: OzaVariant;
  // Dégradé de l'univers et couleur d'accent des éléments sélectionnés.
  couleurs: { from: string; to: string; accent: string };
  tagline: string;
  // Intitulé de la sélection : « Choisis ton poste », « ta spécialité »…
  positionLabel: "poste" | "spécialité" | "axe" | "objectif";
  axes: string[];
  positions: OzaPosition[];
  heroImage?: string | null;
  actif: boolean;
};

export type OzaNiveau = "debutant" | "intermediaire" | "avance";

export const OZA_NIVEAUX: { key: OzaNiveau; label: string }[] = [
  { key: "debutant", label: "Débutant" },
  { key: "intermediaire", label: "Intermédiaire" },
  { key: "avance", label: "Avancé" },
];

export const DEFAULT_OZA_SPORTS: OzaSport[] = [
  {
    id: "rugby",
    nom: "Rugby",
    ordre: 1,
    variant: "power",
    couleurs: { from: "#0B1B14", to: "#2C6B4A", accent: "#12C9B8" },
    tagline: "Force, explosivité, contact.",
    positionLabel: "poste",
    axes: ["Force maximale", "Puissance", "Hypertrophie fonctionnelle", "Répétition d'efforts"],
    positions: [
      { id: "premiere-ligne", nom: "Première ligne", description: "Avants : force maximale, puissance, hypertrophie fonctionnelle, capacité à répéter les efforts." },
      { id: "deuxieme-ligne", nom: "Deuxième ligne", description: "Avants : force maximale, puissance, hypertrophie fonctionnelle, capacité à répéter les efforts." },
      { id: "troisieme-ligne", nom: "Troisième ligne", description: "Puissance, vitesse, force et capacité aérobie.", axes: ["Puissance", "Vitesse", "Force", "Capacité aérobie"] },
      { id: "demi-de-melee", nom: "Demi de mêlée" },
      { id: "demi-d-ouverture", nom: "Demi d'ouverture" },
      { id: "centres", nom: "Centres" },
      { id: "ailiers", nom: "Ailiers", description: "Arrières : vitesse maximale, explosivité, accélération et puissance.", axes: ["Vitesse maximale", "Explosivité", "Accélération", "Puissance"] },
      { id: "arrieres", nom: "Arrières", description: "Vitesse maximale, explosivité, accélération et puissance.", axes: ["Vitesse maximale", "Explosivité", "Accélération", "Puissance"] },
    ],
    actif: true,
  },
  {
    id: "football",
    nom: "Football",
    ordre: 2,
    variant: "speed",
    couleurs: { from: "#04302D", to: "#12C9B8", accent: "#8BEDE0" },
    tagline: "Vitesse, agilité, répétition des sprints.",
    positionLabel: "poste",
    axes: ["Accélération", "Vitesse maximale", "Force unilatérale", "Puissance", "Changements de direction", "Prévention des blessures", "Capacité aérobie"],
    positions: [
      { id: "gardien", nom: "Gardien" },
      { id: "defenseur-central", nom: "Défenseur central" },
      { id: "lateral", nom: "Latéral" },
      { id: "milieu-defensif", nom: "Milieu défensif" },
      { id: "milieu-offensif", nom: "Milieu offensif" },
      { id: "ailier", nom: "Ailier" },
      { id: "attaquant", nom: "Attaquant" },
    ],
    actif: true,
  },
  {
    id: "basket",
    nom: "Basket-ball",
    ordre: 3,
    variant: "vertical",
    couleurs: { from: "#0F1030", to: "#4B4FD1", accent: "#8BEDE0" },
    tagline: "Détente, explosivité, agilité.",
    positionLabel: "poste",
    axes: ["Détente verticale", "Explosivité", "Force", "Vitesse", "Agilité", "Changements de direction"],
    positions: [
      { id: "meneur", nom: "Meneur" },
      { id: "arriere", nom: "Arrière" },
      { id: "ailier", nom: "Ailier" },
      { id: "ailier-fort", nom: "Ailier fort" },
      { id: "pivot", nom: "Pivot" },
    ],
    actif: true,
  },
  {
    id: "handball",
    nom: "Handball",
    ordre: 4,
    variant: "vertical",
    couleurs: { from: "#0A1430", to: "#2F58D6", accent: "#8BEDE0" },
    tagline: "Puissance de lancer, explosivité, épaule solide.",
    positionLabel: "poste",
    axes: ["Puissance de lancer", "Force", "Explosivité", "Vitesse", "Stabilité de l'épaule"],
    positions: [
      { id: "gardien", nom: "Gardien" },
      { id: "ailier", nom: "Ailier" },
      { id: "arriere", nom: "Arrière" },
      { id: "demi-centre", nom: "Demi-centre" },
      { id: "pivot", nom: "Pivot" },
    ],
    actif: true,
  },
  {
    id: "hyrox",
    nom: "Hyrox",
    ordre: 5,
    variant: "competition",
    couleurs: { from: "#0C0C0C", to: "#2A2A2A", accent: "#F2D300" },
    tagline: "Endurance, force-endurance, capacité de travail.",
    positionLabel: "axe",
    axes: ["Endurance cardiovasculaire", "Force-endurance", "Capacité de travail", "Gestion des transitions"],
    positions: [
      { id: "endurance-cardio", nom: "Endurance cardiovasculaire" },
      { id: "force-endurance", nom: "Force-endurance" },
      { id: "capacite-de-travail", nom: "Capacité de travail" },
      { id: "transitions", nom: "Gestion des transitions" },
      { id: "sled", nom: "Sled Push / Pull" },
      { id: "running", nom: "Running" },
      { id: "wall-balls", nom: "Wall Balls" },
    ],
    actif: true,
  },
  {
    id: "course",
    nom: "Course à pied",
    ordre: 6,
    variant: "clean",
    couleurs: { from: "#E9F6F4", to: "#BFE9E3", accent: "#087F78" },
    tagline: "Distance, endurance, progression.",
    positionLabel: "spécialité",
    axes: ["Endurance fondamentale", "VMA", "Seuil", "Économie de course", "Renforcement musculaire"],
    positions: [
      { id: "5km", nom: "5 km" },
      { id: "10km", nom: "10 km" },
      { id: "semi", nom: "Semi-marathon" },
      { id: "marathon", nom: "Marathon" },
      { id: "trail", nom: "Trail" },
    ],
    actif: true,
  },
  {
    id: "tennis",
    nom: "Tennis",
    ordre: 7,
    variant: "speed",
    couleurs: { from: "#0B2A1E", to: "#7BC043", accent: "#F4FF6B" },
    tagline: "Déplacements, rotation, répétition des points.",
    positionLabel: "spécialité",
    axes: ["Vitesse de déplacement", "Changements de direction", "Puissance rotative", "Force des membres inférieurs", "Endurance", "Prévention des blessures"],
    positions: [
      { id: "simple", nom: "Simple" },
      { id: "double", nom: "Double" },
      { id: "service", nom: "Service et puissance" },
      { id: "junior", nom: "Junior en développement" },
    ],
    actif: true,
  },
  {
    id: "athletisme",
    nom: "Athlétisme",
    ordre: 8,
    variant: "clean",
    couleurs: { from: "#F1F6F7", to: "#C7DCE0", accent: "#075B57" },
    tagline: "Vitesse, puissance, technique.",
    positionLabel: "spécialité",
    axes: ["Vitesse", "Puissance", "Force", "Endurance spécifique", "Mobilité"],
    positions: [
      { id: "sprint", nom: "Sprint" },
      { id: "haies", nom: "Haies" },
      { id: "demi-fond", nom: "Demi-fond" },
      { id: "sauts", nom: "Sauts" },
      { id: "lancers", nom: "Lancers" },
      { id: "combine", nom: "Épreuves combinées" },
    ],
    actif: true,
  },
  {
    id: "volley",
    nom: "Volley-ball",
    ordre: 9,
    variant: "vertical",
    couleurs: { from: "#1B1038", to: "#7A4DD8", accent: "#8BEDE0" },
    tagline: "Détente, réactivité, épaule solide.",
    positionLabel: "poste",
    axes: ["Détente verticale", "Explosivité", "Stabilité de l'épaule", "Réactivité", "Prévention des blessures"],
    positions: [
      { id: "passeur", nom: "Passeur" },
      { id: "receptionneur-attaquant", nom: "Réceptionneur-attaquant" },
      { id: "pointu", nom: "Pointu" },
      { id: "central", nom: "Central" },
      { id: "libero", nom: "Libéro" },
    ],
    actif: true,
  },
  {
    id: "combat",
    nom: "Sports de combat",
    ordre: 10,
    variant: "power",
    couleurs: { from: "#14090B", to: "#6B1F2A", accent: "#12C9B8" },
    tagline: "Puissance, force-endurance, vitesse.",
    positionLabel: "spécialité",
    axes: ["Puissance", "Force-endurance", "Vitesse", "Gainage", "Capacité aérobie et anaérobie"],
    positions: [
      { id: "boxe", nom: "Boxe" },
      { id: "mma", nom: "MMA" },
      { id: "judo", nom: "Judo" },
      { id: "lutte", nom: "Lutte" },
      { id: "jjb", nom: "Jiu-jitsu brésilien" },
      { id: "pieds-poings", nom: "Karaté / Taekwondo" },
    ],
    actif: true,
  },
  {
    id: "natation",
    nom: "Natation",
    ordre: 11,
    variant: "clean",
    couleurs: { from: "#E6F6FB", to: "#A9DCEB", accent: "#0B6E8A" },
    tagline: "Gainage, épaules, endurance.",
    positionLabel: "spécialité",
    axes: ["Force du haut du corps", "Gainage", "Mobilité d'épaule", "Endurance", "Puissance de départ"],
    positions: [
      { id: "sprint", nom: "Sprint" },
      { id: "demi-fond", nom: "Demi-fond" },
      { id: "fond", nom: "Fond" },
      { id: "eau-libre", nom: "Eau libre" },
    ],
    actif: true,
  },
  {
    id: "cyclisme",
    nom: "Cyclisme",
    ordre: 12,
    variant: "competition",
    couleurs: { from: "#0A0F14", to: "#1D2B38", accent: "#12C9B8" },
    tagline: "Puissance, endurance, solidité du dos.",
    positionLabel: "spécialité",
    axes: ["Force des membres inférieurs", "Endurance", "Puissance", "Gainage", "Prévention du dos"],
    positions: [
      { id: "route", nom: "Route" },
      { id: "vtt", nom: "VTT" },
      { id: "piste", nom: "Piste" },
      { id: "gravel", nom: "Gravel" },
    ],
    actif: true,
  },
  {
    id: "crossfit",
    nom: "CrossFit",
    ordre: 13,
    variant: "competition",
    couleurs: { from: "#0C0C0C", to: "#242424", accent: "#12C9B8" },
    tagline: "Force, gymnastique, conditionnement.",
    positionLabel: "axe",
    axes: ["Haltérophilie", "Gymnastique", "Conditionnement métabolique", "Force"],
    positions: [
      { id: "halterophilie", nom: "Haltérophilie" },
      { id: "gymnastique", nom: "Gymnastique" },
      { id: "conditionnement", nom: "Conditionnement métabolique" },
      { id: "force", nom: "Force" },
    ],
    actif: true,
  },
  {
    id: "triathlon",
    nom: "Triathlon",
    ordre: 14,
    variant: "clean",
    couleurs: { from: "#E8F5F2", to: "#B3E0D8", accent: "#087F78" },
    tagline: "Trois disciplines, une seule progression.",
    positionLabel: "spécialité",
    axes: ["Endurance", "Transitions", "Force", "Économie de mouvement", "Prévention des blessures"],
    positions: [
      { id: "sprint", nom: "Sprint" },
      { id: "olympique", nom: "Olympique" },
      { id: "70-3", nom: "Distance 70.3" },
      { id: "ironman", nom: "Distance Ironman" },
    ],
    actif: true,
  },
  {
    id: "musculation",
    nom: "Musculation",
    ordre: 15,
    variant: "power",
    couleurs: { from: "#06191A", to: "#0E5A55", accent: "#8BEDE0" },
    tagline: "Hypertrophie, force, perte de poids.",
    positionLabel: "objectif",
    axes: ["Hypertrophie", "Force", "Perte de poids", "Haltérophilie", "Renforcement musculaire"],
    positions: [
      { id: "hypertrophie", nom: "Hypertrophie" },
      { id: "perte-de-poids", nom: "Perte de poids" },
      { id: "force", nom: "Force" },
      { id: "halterophilie", nom: "Haltérophilie" },
      { id: "renforcement", nom: "Renforcement musculaire" },
    ],
    actif: true,
  },
];
