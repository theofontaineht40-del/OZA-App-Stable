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
  positionLabel: "poste" | "spécialité" | "axe";
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
];
