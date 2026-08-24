export type BodyView = "face" | "dos";

export type BodyZonePoint = { x: number; y: number };

// Deux formes possibles : "point" pour les articulations (petite zone
// ponctuelle : poignet...), "polygon" pour les groupes
// musculaires (toute la surface du muscle se colore au clic, pas juste un
// point dessus). Les contours "polygon" ont été extraits automatiquement à
// partir des traits de l'illustration (détection de contours + fusion des
// lobes d'un même muscle), pas dessinés à la main — d'où le nombre de
// sommets parfois élevé mais fidèle au dessin réel.
export type BodyZone =
  | { key: string; label: string; view: BodyView; shape: "point"; x: number; y: number }
  | { key: string; label: string; view: BodyView; shape: "polygon"; points: BodyZonePoint[] };

export const BODY_ZONES: BodyZone[] = [
  // ── Face ──
  { key: "tete", label: "Tête", view: "face", shape: "point", x: 50, y: 8 },

  {
    key: "epaule_g",
    label: "Épaule gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 45.2, y: 13.2 }, { x: 34.5, y: 17.4 }, { x: 29.4, y: 17.6 }, { x: 25.1, y: 19.4 },
      { x: 22.1, y: 23.4 }, { x: 22.1, y: 25.1 }, { x: 23.7, y: 28.0 }, { x: 38.9, y: 18.7 },
      { x: 38.9, y: 17.8 }, { x: 45.3, y: 17.5 },
    ],
  },
  {
    key: "epaule_d",
    label: "Épaule droite",
    view: "face",
    shape: "polygon",
    points: [
      { x: 57.9, y: 13.2 }, { x: 57.7, y: 17.5 }, { x: 64.6, y: 17.7 }, { x: 64.5, y: 18.8 },
      { x: 79.3, y: 27.9 }, { x: 80.7, y: 23.1 }, { x: 77.6, y: 19.4 }, { x: 73.5, y: 17.6 },
      { x: 68.3, y: 17.5 }, { x: 66.0, y: 16.1 },
    ],
  },
  {
    key: "pec_g",
    label: "Pectoral gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 48.5, y: 18.7 }, { x: 46.1, y: 18.4 }, { x: 38.6, y: 18.6 }, { x: 29.9, y: 23.9 },
      { x: 31.7, y: 24.5 }, { x: 33.8, y: 26.7 }, { x: 37.2, y: 28.3 }, { x: 39.8, y: 28.8 },
      { x: 43.2, y: 28.7 }, { x: 47.6, y: 28.0 }, { x: 50.2, y: 26.9 }, { x: 51.5, y: 23.6 },
      { x: 50.2, y: 20.0 },
    ],
  },
  {
    key: "pec_d",
    label: "Pectoral droit",
    view: "face",
    shape: "polygon",
    points: [
      { x: 54.4, y: 18.8 }, { x: 52.8, y: 20.4 }, { x: 51.8, y: 23.6 }, { x: 53.0, y: 27.0 },
      { x: 54.8, y: 27.9 }, { x: 59.7, y: 28.7 }, { x: 63.2, y: 28.8 }, { x: 65.8, y: 28.3 },
      { x: 68.6, y: 27.1 }, { x: 70.0, y: 25.5 }, { x: 72.6, y: 24.1 }, { x: 72.1, y: 23.2 },
      { x: 64.3, y: 18.6 }, { x: 57.3, y: 18.4 },
    ],
  },
  {
    key: "bras_g",
    label: "Bras gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 31.4, y: 24.1 }, { x: 29.7, y: 24.1 }, { x: 28.0, y: 24.8 }, { x: 24.3, y: 27.2 },
      { x: 22.5, y: 29.2 }, { x: 21.1, y: 33.4 }, { x: 21.6, y: 34.9 }, { x: 23.1, y: 35.9 },
      { x: 25.0, y: 35.9 }, { x: 28.3, y: 34.6 }, { x: 31.7, y: 31.1 }, { x: 32.8, y: 28.7 },
      { x: 32.9, y: 26.6 }, { x: 32.8, y: 25.2 },
    ],
  },
  {
    key: "bras_d",
    label: "Bras droit",
    view: "face",
    shape: "polygon",
    points: [
      { x: 72.1, y: 24.0 }, { x: 70.8, y: 24.6 }, { x: 70.0, y: 26.1 }, { x: 70.8, y: 30.2 },
      { x: 74.6, y: 34.4 }, { x: 76.9, y: 35.6 }, { x: 79.5, y: 35.9 }, { x: 81.2, y: 35.2 },
      { x: 81.9, y: 33.9 }, { x: 81.2, y: 30.3 }, { x: 77.2, y: 26.1 }, { x: 74.0, y: 24.3 },
    ],
  },
  {
    key: "coude_g",
    label: "Coude gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 17.2, y: 32.3 }, { x: 15.5, y: 34.2 }, { x: 15.5, y: 34.5 }, { x: 17.2, y: 35.1 },
      { x: 17.6, y: 36.1 }, { x: 17.6, y: 37.7 }, { x: 16.7, y: 39.6 }, { x: 17.0, y: 40.2 },
      { x: 20.8, y: 37.8 }, { x: 23.7, y: 37.4 }, { x: 24.5, y: 35.8 }, { x: 25.7, y: 34.6 },
      { x: 25.3, y: 33.9 }, { x: 22.7, y: 33.9 }, { x: 19.3, y: 32.9 }, { x: 18.2, y: 32.8 },
    ],
  },
  {
    key: "coude_d",
    label: "Coude droit",
    view: "face",
    shape: "polygon",
    points: [
      { x: 82.7, y: 32.3 }, { x: 81.6, y: 32.8 }, { x: 80.6, y: 32.9 }, { x: 77.2, y: 33.9 },
      { x: 74.6, y: 33.9 }, { x: 74.1, y: 34.6 }, { x: 75.3, y: 35.8 }, { x: 76.1, y: 37.4 },
      { x: 79.0, y: 37.8 }, { x: 82.8, y: 40.2 }, { x: 83.2, y: 39.6 }, { x: 82.2, y: 37.7 },
      { x: 82.2, y: 36.1 }, { x: 82.7, y: 35.1 }, { x: 84.4, y: 34.5 }, { x: 84.4, y: 34.2 },
    ],
  },
  {
    key: "abdomen",
    label: "Abdomen",
    view: "face",
    shape: "polygon",
    points: [
      { x: 61.3, y: 29.2 }, { x: 57.7, y: 29.1 }, { x: 58.8, y: 33.3 }, { x: 50.6, y: 30.8 },
      { x: 42.5, y: 33.5 }, { x: 44.2, y: 38.8 }, { x: 50.2, y: 38.1 }, { x: 47.8, y: 35.0 },
      { x: 51.4, y: 31.7 }, { x: 51.9, y: 35.2 }, { x: 56.4, y: 35.2 }, { x: 51.4, y: 35.9 },
      { x: 51.5, y: 38.5 }, { x: 58.5, y: 38.0 }, { x: 58.0, y: 40.5 }, { x: 51.2, y: 40.0 },
      { x: 50.9, y: 46.3 }, { x: 49.6, y: 39.1 }, { x: 43.3, y: 39.8 }, { x: 36.6, y: 33.3 },
      { x: 40.0, y: 36.1 }, { x: 37.0, y: 41.7 }, { x: 41.0, y: 43.3 }, { x: 36.8, y: 43.2 },
      { x: 46.7, y: 61.1 }, { x: 42.6, y: 47.2 }, { x: 44.7, y: 52.1 }, { x: 46.8, y: 48.5 },
      { x: 41.2, y: 44.0 }, { x: 51.4, y: 49.9 }, { x: 65.3, y: 41.6 }, { x: 61.4, y: 41.9 },
      { x: 64.0, y: 34.1 }, { x: 59.0, y: 34.8 },
    ],
  },
  { key: "poignet_g", label: "Poignet gauche", view: "face", shape: "point", x: 8, y: 53 },
  { key: "poignet_d", label: "Poignet droit", view: "face", shape: "point", x: 92, y: 53 },
  {
    key: "hanche_g",
    label: "Hanche gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 47.8, y: 40.5 }, { x: 46.8, y: 41.0 }, { x: 43.8, y: 50.1 }, { x: 44.5, y: 48.7 },
      { x: 45.5, y: 47.9 }, { x: 52.3, y: 44.7 }, { x: 51.6, y: 43.0 }, { x: 51.2, y: 43.1 },
    ],
  },
  {
    key: "hanche_d",
    label: "Hanche droite",
    view: "face",
    shape: "polygon",
    points: [
      { x: 61.6, y: 40.5 }, { x: 57.8, y: 42.6 }, { x: 57.2, y: 44.2 }, { x: 62.2, y: 46.8 },
      { x: 64.5, y: 48.6 }, { x: 65.2, y: 50.0 }, { x: 62.8, y: 41.3 },
    ],
  },
  {
    key: "quadriceps_g",
    label: "Quadriceps gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 38.4, y: 45.9 }, { x: 31.1, y: 53.0 }, { x: 29.4, y: 58.9 }, { x: 31.1, y: 63.0 },
      { x: 34.0, y: 65.7 }, { x: 35.8, y: 65.9 }, { x: 38.7, y: 64.0 }, { x: 40.7, y: 67.2 },
      { x: 43.2, y: 68.2 }, { x: 46.6, y: 66.4 }, { x: 47.5, y: 61.9 },
    ],
  },
  {
    key: "quadriceps_d",
    label: "Quadriceps droit",
    view: "face",
    shape: "polygon",
    points: [
      { x: 64.8, y: 46.0 }, { x: 56.4, y: 61.3 }, { x: 56.7, y: 65.7 }, { x: 59.6, y: 68.1 },
      { x: 62.9, y: 67.0 }, { x: 64.8, y: 63.4 }, { x: 65.8, y: 63.5 }, { x: 68.1, y: 66.1 },
      { x: 69.5, y: 65.7 }, { x: 72.4, y: 63.0 }, { x: 74.1, y: 57.2 }, { x: 72.4, y: 53.2 },
    ],
  },
  {
    key: "genou_g",
    label: "Genou gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 34.5, y: 62.5 }, { x: 31.9, y: 65.6 }, { x: 30.9, y: 65.6 }, { x: 28.5, y: 64.1 },
      { x: 29.1, y: 65.7 }, { x: 28.8, y: 70.8 }, { x: 30.5, y: 74.6 }, { x: 31.4, y: 75.2 },
      { x: 32.9, y: 75.4 }, { x: 35.4, y: 75.1 }, { x: 36.9, y: 74.3 }, { x: 39.2, y: 72.2 },
      { x: 41.5, y: 68.6 }, { x: 37.2, y: 66.7 }, { x: 35.5, y: 63.1 },
    ],
  },
  {
    key: "genou_d",
    label: "Genou droit",
    view: "face",
    shape: "polygon",
    points: [
      { x: 65.4, y: 62.5 }, { x: 64.3, y: 63.1 }, { x: 62.6, y: 66.7 }, { x: 58.3, y: 68.6 },
      { x: 60.0, y: 71.5 }, { x: 62.9, y: 74.3 }, { x: 64.5, y: 75.1 }, { x: 66.9, y: 75.4 },
      { x: 68.5, y: 75.2 }, { x: 69.4, y: 74.6 }, { x: 71.1, y: 70.8 }, { x: 70.8, y: 65.7 },
      { x: 71.4, y: 64.1 }, { x: 68.9, y: 65.6 },
    ],
  },
  {
    key: "tibia_g",
    label: "Tibia gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 32.8, y: 70.6 }, { x: 28.9, y: 74.6 }, { x: 27.7, y: 77.4 }, { x: 32.0, y: 88.9 },
      { x: 31.5, y: 92.3 }, { x: 35.7, y: 91.2 }, { x: 34.8, y: 74.9 },
    ],
  },
  {
    key: "tibia_d",
    label: "Tibia droit",
    view: "face",
    shape: "polygon",
    points: [
      { x: 70.6, y: 70.6 }, { x: 68.5, y: 75.9 }, { x: 67.8, y: 91.2 }, { x: 71.8, y: 92.4 },
      { x: 71.7, y: 87.7 }, { x: 75.5, y: 79.6 }, { x: 75.7, y: 77.4 }, { x: 74.1, y: 74.1 },
    ],
  },
  {
    key: "cheville_g",
    label: "Cheville gauche",
    view: "face",
    shape: "polygon",
    points: [
      { x: 31.7, y: 87.2 }, { x: 32.0, y: 91.3 }, { x: 30.5, y: 94.4 }, { x: 34.6, y: 94.3 },
      { x: 39.1, y: 95.8 }, { x: 39.4, y: 92.6 }, { x: 38.1, y: 90.7 }, { x: 38.9, y: 87.2 },
      { x: 38.0, y: 87.2 }, { x: 35.8, y: 87.6 },
    ],
  },
  {
    key: "cheville_d",
    label: "Cheville droite",
    view: "face",
    shape: "polygon",
    points: [
      { x: 69.7, y: 87.2 }, { x: 68.3, y: 89.4 }, { x: 65.1, y: 89.7 },
      { x: 64.0, y: 93.0 }, { x: 64.3, y: 96.9 }, { x: 66.9, y: 97.8 }, { x: 69.1, y: 97.1 },
      { x: 70.6, y: 98.1 }, { x: 71.5, y: 97.6 }, { x: 73.8, y: 97.9 }, { x: 76.7, y: 97.3 },
      { x: 72.4, y: 94.0 }, { x: 72.4, y: 92.4 }, { x: 70.9, y: 89.7 },
    ],
  },

  // ── Dos ──
  { key: "cervicales", label: "Cervicales", view: "dos", shape: "point", x: 50, y: 11 },
  {
    key: "trapezes",
    label: "Trapèzes",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 32.3, y: 17.1 }, { x: 42.1, y: 18.8 }, { x: 47.3, y: 20.4 }, { x: 45.4, y: 16.6 },
      { x: 48.4, y: 12.0 }, { x: 49.5, y: 12.0 }, { x: 52.9, y: 16.7 }, { x: 50.9, y: 20.5 },
      { x: 61.4, y: 17.5 }, { x: 65.9, y: 17.2 }, { x: 55.2, y: 13.7 }, { x: 50.5, y: 9.8 },
      { x: 48.4, y: 9.6 }, { x: 42.6, y: 13.8 },
    ],
  },
  {
    key: "epaule_g_dos",
    label: "Épaule gauche",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 36.4, y: 19.6 }, { x: 31.6, y: 18.2 }, { x: 28.8, y: 17.8 }, { x: 26.4, y: 17.9 },
      { x: 24.3, y: 18.5 }, { x: 21.6, y: 20.1 }, { x: 19.6, y: 22.5 }, { x: 19.3, y: 25.4 },
      { x: 19.8, y: 26.5 }, { x: 20.4, y: 26.5 }, { x: 24.1, y: 24.8 }, { x: 31.9, y: 22.1 },
      { x: 35.9, y: 20.2 },
    ],
  },
  {
    key: "epaule_d_dos",
    label: "Épaule droite",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 61.7, y: 19.6 }, { x: 65.0, y: 21.4 }, { x: 75.1, y: 25.1 }, { x: 78.5, y: 26.8 },
      { x: 79.2, y: 25.1 }, { x: 78.7, y: 21.9 }, { x: 76.4, y: 19.5 }, { x: 74.5, y: 18.5 },
      { x: 71.5, y: 17.7 }, { x: 69.4, y: 17.7 }, { x: 65.0, y: 18.5 },
    ],
  },
  {
    key: "bras_g_dos",
    label: "Bras gauche",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 27.7, y: 23.5 }, { x: 22.2, y: 25.2 }, { x: 18.5, y: 27.7 }, { x: 16.2, y: 34.2 },
      { x: 17.0, y: 35.9 }, { x: 18.5, y: 32.2 }, { x: 21.3, y: 30.5 }, { x: 22.4, y: 30.6 },
      { x: 22.9, y: 32.6 }, { x: 21.6, y: 36.6 }, { x: 26.3, y: 35.0 }, { x: 28.3, y: 33.1 },
      { x: 30.3, y: 29.9 }, { x: 30.3, y: 28.2 },
    ],
  },
  {
    key: "bras_d_dos",
    label: "Bras droit",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 71.1, y: 23.5 }, { x: 68.7, y: 26.9 }, { x: 68.4, y: 30.4 }, { x: 71.5, y: 34.5 },
      { x: 76.7, y: 36.7 }, { x: 75.6, y: 33.9 }, { x: 76.4, y: 30.7 }, { x: 77.4, y: 30.7 },
      { x: 79.3, y: 31.7 }, { x: 81.0, y: 35.5 }, { x: 82.0, y: 35.0 }, { x: 81.0, y: 29.2 },
      { x: 77.0, y: 25.5 },
    ],
  },
  {
    key: "coude_g_dos",
    label: "Coude gauche",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 18.2, y: 32.8 }, { x: 16.8, y: 33.4 }, { x: 14.6, y: 35.5 }, { x: 14.3, y: 36.6 },
      { x: 15.2, y: 38.3 }, { x: 15.4, y: 40.0 }, { x: 16.8, y: 40.3 }, { x: 19.6, y: 40.4 },
      { x: 22.9, y: 39.8 }, { x: 23.6, y: 39.3 }, { x: 24.0, y: 37.1 }, { x: 23.6, y: 36.3 },
      { x: 22.6, y: 35.9 }, { x: 23.2, y: 34.6 }, { x: 23.0, y: 33.5 }, { x: 20.2, y: 32.8 },
    ],
  },
  {
    key: "coude_d_dos",
    label: "Coude droit",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 80.4, y: 32.8 }, { x: 77.8, y: 33.2 }, { x: 76.8, y: 33.5 }, { x: 76.7, y: 34.6 },
      { x: 77.3, y: 35.9 }, { x: 76.2, y: 36.3 }, { x: 76.0, y: 38.9 }, { x: 76.5, y: 39.6 },
      { x: 78.2, y: 40.1 }, { x: 80.2, y: 40.4 }, { x: 83.0, y: 40.3 }, { x: 84.6, y: 39.8 },
      { x: 84.6, y: 38.3 }, { x: 85.5, y: 36.6 }, { x: 85.4, y: 35.8 }, { x: 82.7, y: 33.2 },
      { x: 81.6, y: 32.8 },
    ],
  },
  { key: "omoplate_g", label: "Omoplate gauche", view: "dos", shape: "point", x: 31, y: 27 },
  { key: "omoplate_d", label: "Omoplate droite", view: "dos", shape: "point", x: 69, y: 27 },
  {
    key: "dos_haut",
    label: "Dos haut",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 45.7, y: 12.0 }, { x: 41.0, y: 13.2 }, { x: 38.4, y: 15.9 }, { x: 41.8, y: 22.3 },
      { x: 44.4, y: 20.4 }, { x: 41.5, y: 24.1 }, { x: 44.9, y: 22.7 }, { x: 40.8, y: 25.7 },
      { x: 36.1, y: 31.2 }, { x: 46.2, y: 33.6 }, { x: 46.8, y: 37.1 }, { x: 49.1, y: 30.9 },
      { x: 58.0, y: 30.4 }, { x: 65.8, y: 28.9 }, { x: 49.4, y: 24.0 }, { x: 48.5, y: 22.3 },
      { x: 51.4, y: 23.8 }, { x: 50.1, y: 21.8 }, { x: 53.8, y: 19.0 }, { x: 53.8, y: 15.0 },
      { x: 49.1, y: 12.2 },
    ],
  },
  {
    key: "grand_dorsal",
    label: "Grand dorsal",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 29.4, y: 26.6 }, { x: 31.1, y: 31.6 }, { x: 39.5, y: 41.0 }, { x: 45.7, y: 34.8 },
      { x: 52.6, y: 34.8 }, { x: 56.1, y: 37.7 }, { x: 57.7, y: 40.7 }, { x: 59.3, y: 40.8 },
      { x: 68.1, y: 30.6 }, { x: 68.7, y: 26.6 }, { x: 66.6, y: 27.3 }, { x: 56.6, y: 26.7 },
      { x: 52.7, y: 30.6 }, { x: 45.7, y: 30.6 }, { x: 42.0, y: 26.9 }, { x: 32.5, y: 27.3 },
    ],
  },
  {
    key: "lombaires",
    label: "Lombaires",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 51.5, y: 45.1 }, { x: 50.4, y: 45.6 }, { x: 47.8, y: 48.5 }, { x: 47.2, y: 49.8 },
      { x: 47.5, y: 52.7 }, { x: 48.3, y: 52.9 }, { x: 48.3, y: 53.3 }, { x: 49.8, y: 54.0 },
      { x: 52.4, y: 54.6 }, { x: 59.6, y: 54.7 }, { x: 60.9, y: 54.4 }, { x: 61.9, y: 53.7 },
      { x: 62.2, y: 51.2 }, { x: 61.1, y: 50.5 }, { x: 60.6, y: 49.7 }, { x: 59.8, y: 49.5 },
      { x: 58.0, y: 48.1 }, { x: 54.9, y: 46.6 }, { x: 54.9, y: 46.1 },
    ],
  },
  {
    key: "fessier_g",
    label: "Fessier gauche",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 36.2, y: 42.3 }, { x: 34.5, y: 43.2 }, { x: 33.1, y: 44.8 }, { x: 32.3, y: 53.1 },
      { x: 33.6, y: 54.2 }, { x: 35.9, y: 54.6 }, { x: 42.9, y: 54.6 }, { x: 47.0, y: 53.6 },
      { x: 49.0, y: 52.3 }, { x: 49.1, y: 48.7 }, { x: 46.5, y: 45.4 }, { x: 43.1, y: 43.5 },
      { x: 39.5, y: 42.5 },
    ],
  },
  {
    key: "fessier_d",
    label: "Fessier droit",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 61.9, y: 42.3 }, { x: 57.7, y: 42.7 }, { x: 55.5, y: 43.4 }, { x: 52.6, y: 45.0 },
      { x: 50.1, y: 47.4 }, { x: 49.3, y: 48.8 }, { x: 49.3, y: 52.3 }, { x: 50.4, y: 53.2 },
      { x: 54.1, y: 54.4 }, { x: 63.3, y: 54.6 }, { x: 65.0, y: 54.0 }, { x: 65.9, y: 53.0 },
      { x: 65.2, y: 48.8 }, { x: 65.5, y: 45.4 }, { x: 64.2, y: 43.4 },
    ],
  },
  {
    key: "ischio_g",
    label: "Ischio-jambier gauche",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 34.1, y: 54.6 }, { x: 30.8, y: 55.8 }, { x: 28.9, y: 58.3 }, { x: 29.9, y: 66.6 },
      { x: 29.1, y: 72.3 }, { x: 35.3, y: 68.5 }, { x: 39.2, y: 73.6 }, { x: 42.1, y: 70.5 },
      { x: 44.2, y: 65.4 }, { x: 43.7, y: 58.6 }, { x: 41.5, y: 54.6 },
    ],
  },
  {
    key: "ischio_d",
    label: "Ischio-jambier droit",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 62.8, y: 54.5 }, { x: 56.3, y: 54.7 }, { x: 54.4, y: 58.8 }, { x: 54.4, y: 66.6 },
      { x: 58.9, y: 74.2 }, { x: 63.0, y: 68.6 }, { x: 64.1, y: 68.6 }, { x: 68.1, y: 72.3 },
      { x: 69.1, y: 72.2 }, { x: 68.1, y: 68.7 }, { x: 69.1, y: 57.6 }, { x: 67.3, y: 55.7 },
    ],
  },
  {
    key: "mollet_g",
    label: "Mollet gauche",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 32.7, y: 70.0 }, { x: 27.1, y: 74.3 }, { x: 24.4, y: 79.1 }, { x: 30.3, y: 95.8 },
      { x: 31.6, y: 91.8 }, { x: 28.0, y: 84.0 }, { x: 33.7, y: 83.0 }, { x: 36.5, y: 84.8 },
      { x: 33.4, y: 90.3 }, { x: 33.9, y: 94.2 }, { x: 35.9, y: 87.9 }, { x: 41.4, y: 81.4 },
      { x: 37.9, y: 71.3 }, { x: 34.5, y: 72.3 },
    ],
  },
  {
    key: "mollet_d",
    label: "Mollet droit",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 65.8, y: 70.2 }, { x: 63.6, y: 72.6 }, { x: 60.2, y: 71.3 }, { x: 56.6, y: 80.1 },
      { x: 62.7, y: 88.9 }, { x: 64.2, y: 94.4 }, { x: 64.7, y: 90.5 }, { x: 61.3, y: 84.7 },
      { x: 64.2, y: 82.8 }, { x: 70.1, y: 83.8 }, { x: 66.4, y: 92.2 }, { x: 67.8, y: 95.7 },
      { x: 70.0, y: 93.0 }, { x: 73.6, y: 78.4 },
    ],
  },
  {
    key: "genou_g_dos",
    label: "Genou gauche",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 37.0, y: 67.2 }, { x: 36.4, y: 67.2 }, { x: 31.6, y: 71.7 }, { x: 31.6, y: 71.9 },
      { x: 33.4, y: 71.0 }, { x: 34.5, y: 71.1 }, { x: 36.1, y: 75.5 }, { x: 36.9, y: 75.4 },
      { x: 37.9, y: 73.1 }, { x: 39.7, y: 71.4 }, { x: 38.6, y: 68.9 },
    ],
  },
  {
    key: "genou_d_dos",
    label: "Genou droit",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 62.8, y: 67.2 }, { x: 61.3, y: 68.9 }, { x: 60.2, y: 71.4 }, { x: 61.9, y: 73.1 },
      { x: 63.0, y: 75.4 }, { x: 63.8, y: 75.5 }, { x: 65.3, y: 71.0 }, { x: 66.3, y: 70.9 },
      { x: 67.2, y: 71.6 }, { x: 68.1, y: 71.9 }, { x: 68.3, y: 71.7 }, { x: 63.5, y: 67.2 },
    ],
  },
  {
    key: "cheville_g_dos",
    label: "Cheville gauche",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 27.5, y: 87.2 }, { x: 27.1, y: 88.2 }, { x: 28.0, y: 92.5 }, { x: 26.7, y: 94.6 },
      { x: 26.4, y: 97.8 }, { x: 27.2, y: 98.8 }, { x: 29.4, y: 99.9 }, { x: 34.5, y: 99.9 },
      { x: 35.9, y: 98.8 }, { x: 35.9, y: 93.9 }, { x: 34.8, y: 91.8 }, { x: 35.3, y: 89.1 },
      { x: 34.1, y: 89.2 }, { x: 33.1, y: 90.9 }, { x: 31.9, y: 91.1 }, { x: 29.7, y: 87.8 },
    ],
  },
  {
    key: "cheville_d_dos",
    label: "Cheville droite",
    view: "dos",
    shape: "polygon",
    points: [
      { x: 70.0, y: 89.0 }, { x: 67.5, y: 89.4 }, { x: 62.8, y: 89.3 }, { x: 63.3, y: 92.2 },
      { x: 62.2, y: 94.1 }, { x: 62.8, y: 95.9 }, { x: 62.4, y: 98.1 }, { x: 64.7, y: 99.1 },
      { x: 68.4, y: 98.8 }, { x: 71.2, y: 96.9 }, { x: 71.2, y: 94.6 }, { x: 69.8, y: 92.5 },
      { x: 70.5, y: 89.5 },
    ],
  },
];
