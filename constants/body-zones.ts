export type BodyView = "face" | "dos";

export type BodyZone = {
  key: string;
  label: string;
  view: BodyView;
  x: number; // pourcentage horizontal dans le schéma
  y: number; // pourcentage vertical dans le schéma
};

export const BODY_ZONES: BodyZone[] = [
  // Face
  { key: "tete", label: "Tête", view: "face", x: 50, y: 6 },
  { key: "epaule_g", label: "Épaule gauche", view: "face", x: 28, y: 20 },
  { key: "epaule_d", label: "Épaule droite", view: "face", x: 72, y: 20 },
  { key: "thorax", label: "Thorax", view: "face", x: 50, y: 26 },
  { key: "coude_g", label: "Coude gauche", view: "face", x: 16, y: 36 },
  { key: "coude_d", label: "Coude droit", view: "face", x: 84, y: 36 },
  { key: "abdomen", label: "Abdomen", view: "face", x: 50, y: 38 },
  { key: "poignet_g", label: "Poignet gauche", view: "face", x: 10, y: 50 },
  { key: "poignet_d", label: "Poignet droit", view: "face", x: 90, y: 50 },
  { key: "hanche_g", label: "Hanche gauche", view: "face", x: 38, y: 48 },
  { key: "hanche_d", label: "Hanche droite", view: "face", x: 62, y: 48 },
  { key: "quadriceps_g", label: "Quadriceps gauche", view: "face", x: 39, y: 64 },
  { key: "quadriceps_d", label: "Quadriceps droit", view: "face", x: 61, y: 64 },
  { key: "genou_g", label: "Genou gauche", view: "face", x: 39, y: 78 },
  { key: "genou_d", label: "Genou droit", view: "face", x: 61, y: 78 },
  { key: "tibia_g", label: "Tibia gauche", view: "face", x: 39, y: 89 },
  { key: "tibia_d", label: "Tibia droit", view: "face", x: 61, y: 89 },
  { key: "cheville_g", label: "Cheville gauche", view: "face", x: 39, y: 97 },
  { key: "cheville_d", label: "Cheville droite", view: "face", x: 61, y: 97 },

  // Dos
  { key: "cervicales", label: "Cervicales", view: "dos", x: 50, y: 12 },
  { key: "trapezes_g", label: "Trapèze gauche", view: "dos", x: 37, y: 18 },
  { key: "trapezes_d", label: "Trapèze droit", view: "dos", x: 63, y: 18 },
  { key: "omoplate_g", label: "Omoplate gauche", view: "dos", x: 33, y: 27 },
  { key: "omoplate_d", label: "Omoplate droite", view: "dos", x: 67, y: 27 },
  { key: "dos_haut", label: "Dos haut", view: "dos", x: 50, y: 26 },
  { key: "lombaires", label: "Lombaires", view: "dos", x: 50, y: 42 },
  { key: "fessier_g", label: "Fessier gauche", view: "dos", x: 40, y: 50 },
  { key: "fessier_d", label: "Fessier droit", view: "dos", x: 60, y: 50 },
  { key: "ischio_g", label: "Ischio-jambier gauche", view: "dos", x: 39, y: 65 },
  { key: "ischio_d", label: "Ischio-jambier droit", view: "dos", x: 61, y: 65 },
  { key: "mollet_g", label: "Mollet gauche", view: "dos", x: 39, y: 82 },
  { key: "mollet_d", label: "Mollet droit", view: "dos", x: 61, y: 82 },
  { key: "cheville_g_dos", label: "Cheville gauche", view: "dos", x: 39, y: 97 },
  { key: "cheville_d_dos", label: "Cheville droite", view: "dos", x: 61, y: 97 },
];
