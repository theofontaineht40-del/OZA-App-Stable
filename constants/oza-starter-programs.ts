// Programmes de démarrage OZA Programs (rugby), rédigés selon la méthode de
// planification : cycle d'approche en progression linéaire pour le débutant,
// planification ondulatoire hebdomadaire (hypertrophie → force → puissance →
// décharge) pour l'intermédiaire.
//
// Ils sont importés en BROUILLON par l'administrateur : personne ne les voit
// tant qu'ils n'ont pas été relus puis publiés. Les charges sont exprimées en
// RPE (effort perçu) car aucune charge absolue ne peut convenir à tous.

import { EXERCISE_LIBRARY } from "./exercise-library";
import type { OzaNiveau } from "./oza-sports";
import type { Bloc, BlocExercice, BlocMode, BlocRole, Seance } from "../services/programmes";

export type Ex = {
  id: string;
  series: string;
  reps: string;
  repos?: string;
  rpe?: string;
  note?: string;
};

export type BlocSpec = { role?: BlocRole; mode?: BlocMode; nom: string; objectif: string; couleur: string; exos: Ex[] };

const lib = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));

function exo(seed: string, e: Ex, i: number): BlocExercice {
  const tpl = lib.get(e.id);
  if (!tpl) throw new Error(`Exercice inconnu dans la bibliothèque : ${e.id}`);
  return {
    id: `${seed}-${i}`,
    exerciceId: tpl.id,
    exerciceNom: tpl.nom,
    exerciceIcon: tpl.icon,
    series: e.series,
    repetitions: e.reps,
    tempo: "",
    chargeType: e.rpe ? "rpe" : "libre",
    chargeValeur: e.rpe ?? "",
    poidsIndicatif: "",
    reposSeries: e.repos ?? "",
    reposRepetitions: "",
    commentaires: e.note ?? "",
  };
}

export function seance(id: string, nom: string, blocs: BlocSpec[], muscles?: Seance["muscles"]): Seance {
  return {
    id,
    nom,
    ...(muscles ? { muscles } : {}),
    blocs: blocs.map(
      (b, bi): Bloc => ({
        id: `${id}-b${bi}`,
        ...(b.role ? { role: b.role } : {}),
        ...(b.mode ? { mode: b.mode } : {}),
        nom: b.nom,
        objectif: b.objectif,
        couleur: b.couleur,
        exercices: b.exos.map((e, ei) => exo(`${id}-b${bi}`, e, ei)),
      })
    ),
  };
}

export const TEAL = "#14B8A6";
export const GOLD = "#E0B000";
export const GREEN = "#34C759";
export const SKY = "#5EEAD4";
export const NAVY = "#0B2E2D";

export type StarterProgram = {
  id: string;
  sportId: string;
  positionId: string | null;
  nom: string;
  objectif: string;
  publicCible: string;
  niveau: OzaNiveau;
  seancesParSemaine: number;
  materiel: string[];
  qualites: { nom: string; pct: number }[];
  semaines: { numero: number; theme: string; consignes: string; seances: Seance[] }[];
};

// ── Rugby · Cycle d'approche (débutant, progression linéaire) ──

export type Approche = { series: string; reps: string; rpe: string; repos: string };

// Linéaire : le volume baisse légèrement et l'intensité monte chaque semaine.
export const APPROCHE: Approche[] = [
  { series: "3", reps: "12", rpe: "5", repos: "90 s" },
  { series: "3", reps: "10", rpe: "6", repos: "90 s" },
  { series: "3", reps: "8", rpe: "6-7", repos: "2 min" },
  { series: "3", reps: "6-8", rpe: "7", repos: "2 min" },
];

function approcheSeances(w: number): Seance[] {
  const p = APPROCHE[w];
  const key = `rugby-approche-s${w + 1}`;
  const echauffement = (extra: Ex[]): BlocSpec => ({
    role: "echauffement",
    nom: "Échauffement",
    objectif: "Monter en température, mobiliser hanches, chevilles et épaules.",
    couleur: SKY,
    exos: [
      { id: "rotation-hanche-genou-leve", series: "1", reps: "10 / côté" },
      { id: "marche-basse-position-gardee", series: "2", reps: "10 m" },
      ...extra,
    ],
  });
  return [
    seance(`${key}-1`, "Bas du corps et gainage", [
      echauffement([{ id: "mobilite-epaule", series: "1", reps: "10" }]),
      {
        role: "principal",
        nom: "Squat et charnière de hanche",
        objectif: "Apprendre les deux mouvements de base, technique avant charge.",
        couleur: TEAL,
        exos: [
          { id: "squat-arriere", series: p.series, reps: p.reps, rpe: p.rpe, repos: p.repos, note: "Barre légère : technique propre, profondeur maîtrisée. Presse à cuisses si le squat n'est pas encore sûr." },
          { id: "souleve-terre-roumain", series: p.series, reps: p.reps, rpe: p.rpe, repos: p.repos, note: "Dos plat, hanches vers l'arrière, barre proche des jambes." },
        ],
      },
      {
        nom: "Unilatéral",
        objectif: "Stabilité et équilibre sur une jambe.",
        couleur: GREEN,
        exos: [{ id: "reverse-lunge", series: "3", reps: "8 / jambe", rpe: "6", repos: "90 s" }],
      },
      {
        nom: "Gainage",
        objectif: "Tenir le tronc sous les contacts.",
        couleur: GOLD,
        exos: [
          { id: "gainage-planche", series: "3", reps: "30 s", repos: "45 s" },
          { id: "gainage-lateral", series: "2", reps: "25 s / côté", repos: "45 s" },
        ],
      },
    ]),
    seance(`${key}-2`, "Haut du corps", [
      echauffement([{ id: "face-pull", series: "2", reps: "15", rpe: "4" }]),
      {
        role: "principal",
        nom: "Poussée et tirage",
        objectif: "Équilibrer poussée et tirage, base de la force du haut du corps.",
        couleur: TEAL,
        exos: [
          { id: "developpe-couche-halteres", series: p.series, reps: p.reps, rpe: p.rpe, repos: p.repos },
          { id: "tirage-horizontal", series: p.series, reps: p.reps, rpe: p.rpe, repos: p.repos },
          { id: "developpe-militaire-halteres", series: "3", reps: p.reps, rpe: p.rpe, repos: p.repos },
        ],
      },
      {
        nom: "Épaules et gainage",
        objectif: "Protéger l'épaule, gainer le tronc.",
        couleur: GOLD,
        exos: [
          { id: "face-pull", series: "3", reps: "15", rpe: "5", repos: "60 s" },
          { id: "hollow-body", series: "3", reps: "20 s", repos: "45 s" },
        ],
      },
    ]),
    seance(`${key}-3`, "Corps entier et courses", [
      echauffement([{ id: "corde-a-sauter", series: "2", reps: "30 s" }]),
      {
        role: "specifique",
        nom: "Vitesse technique",
        objectif: "Poser la technique de course et d'accélération, sans fatigue.",
        couleur: NAVY,
        exos: [{ id: "sprint", series: "6", reps: "15 m", rpe: "7", repos: "1 min 30", note: "Accélérations progressives, repos complet entre les courses." }],
      },
      {
        role: "principal",
        nom: "Force du corps entier",
        objectif: "Charnière de hanche dynamique et portés.",
        couleur: TEAL,
        exos: [
          { id: "kettlebell-swing", series: p.series, reps: "12", rpe: p.rpe, repos: p.repos },
          { id: "farmer-walk", series: "3", reps: "20 m", rpe: "6", repos: "90 s" },
        ],
      },
      {
        nom: "Gainage anti-rotation",
        objectif: "Résister aux rotations.",
        couleur: GOLD,
        exos: [{ id: "pallof-press", series: "3", reps: "10 / côté", rpe: "6", repos: "45 s" }],
      },
    ]),
  ];
}

// ── Rugby · Préparation générale (intermédiaire, ondulatoire hebdomadaire) ──

export type Onde = {
  theme: string;
  consignes: string;
  principal: { series: string; reps: string; rpe: string; repos: string };
  secondaire: { series: string; reps: string; rpe: string; repos: string };
  puissance: { series: string; reps: string };
  finisher: { series: string; effort: string; repos: string };
};

export const ONDE: Onde[] = [
  {
    theme: "Hypertrophie fonctionnelle",
    consignes: "Volume élevé, intensité moyenne. Cherche la qualité de chaque répétition, garde 2 à 3 répétitions en réserve.",
    principal: { series: "4", reps: "8", rpe: "7", repos: "2 min" },
    secondaire: { series: "3", reps: "10", rpe: "7", repos: "90 s" },
    puissance: { series: "3", reps: "5" },
    finisher: { series: "6", effort: "20 s", repos: "40 s" },
  },
  {
    theme: "Force",
    consignes: "Intensité élevée, volume moyen. Charges lourdes mais techniques, repos complets entre les séries.",
    principal: { series: "5", reps: "4", rpe: "8", repos: "3 min" },
    secondaire: { series: "3", reps: "6", rpe: "8", repos: "2 min" },
    puissance: { series: "3", reps: "3" },
    finisher: { series: "6", effort: "20 s", repos: "40 s" },
  },
  {
    theme: "Puissance et vitesse",
    consignes: "Charge modérée déplacée le plus vite possible. Arrête une série dès que la vitesse baisse.",
    principal: { series: "4", reps: "3", rpe: "7", repos: "3 min" },
    secondaire: { series: "3", reps: "5", rpe: "7", repos: "2 min" },
    puissance: { series: "4", reps: "4" },
    finisher: { series: "8", effort: "15 s", repos: "45 s" },
  },
  {
    theme: "Décharge",
    consignes: "Volume réduit d'environ 40 %. Récupère pour consolider les gains : garde de la marge à chaque série.",
    principal: { series: "3", reps: "5", rpe: "6", repos: "2 min" },
    secondaire: { series: "2", reps: "8", rpe: "6", repos: "90 s" },
    puissance: { series: "2", reps: "3" },
    finisher: { series: "4", effort: "20 s", repos: "40 s" },
  },
];

function ondeSeances(w: number): Seance[] {
  const o = ONDE[w];
  const key = `rugby-general-s${w + 1}`;
  const warm = (extra: Ex[]): BlocSpec => ({
    role: "echauffement",
    nom: "Échauffement",
    objectif: "Mobilité et activation avant le travail lourd.",
    couleur: SKY,
    exos: [
      { id: "rotation-hanche-genou-leve", series: "1", reps: "10 / côté" },
      { id: "marche-basse-position-gardee", series: "2", reps: "10 m" },
      ...extra,
    ],
  });
  return [
    seance(`${key}-1`, "Bas du corps : force et puissance", [
      warm([{ id: "mobilite-epaule", series: "1", reps: "10" }]),
      {
        role: "specifique",
        nom: "Puissance du bas du corps",
        objectif: "Activer le système nerveux avant le travail lourd.",
        couleur: NAVY,
        exos: [{ id: w === 2 ? "box-jump" : "cmj", series: o.puissance.series, reps: o.puissance.reps, repos: "90 s", note: "Intention maximale, réception contrôlée, repos complet." }],
      },
      {
        role: "principal",
        nom: "Squat",
        objectif: "Mouvement principal de la séance.",
        couleur: TEAL,
        exos: [{ id: "squat-arriere", series: o.principal.series, reps: o.principal.reps, rpe: o.principal.rpe, repos: o.principal.repos }],
      },
      {
        nom: "Charnière et unilatéral",
        objectif: "Chaîne postérieure et force sur une jambe.",
        couleur: GREEN,
        exos: [
          { id: "souleve-terre-roumain", series: o.secondaire.series, reps: o.secondaire.reps, rpe: o.secondaire.rpe, repos: o.secondaire.repos },
          { id: "split-squat", series: o.secondaire.series, reps: w === 0 ? "10 / jambe" : o.secondaire.reps + " / jambe", rpe: o.secondaire.rpe, repos: o.secondaire.repos },
        ],
      },
      {
        nom: "Gainage",
        objectif: "Stabilité du tronc.",
        couleur: GOLD,
        exos: [
          { id: "pallof-press", series: "3", reps: "10 / côté", rpe: "7", repos: "45 s" },
          { id: "gainage-lateral", series: "3", reps: "30 s / côté", repos: "45 s" },
        ],
      },
    ]),
    seance(`${key}-2`, "Haut du corps : poussée et tirage", [
      warm([{ id: "face-pull", series: "2", reps: "15", rpe: "4" }]),
      {
        role: "principal",
        nom: "Poussée horizontale",
        objectif: "Développé : force de poussée en contact.",
        couleur: TEAL,
        exos: [{ id: "developpe-couche", series: o.principal.series, reps: o.principal.reps, rpe: o.principal.rpe, repos: o.principal.repos }],
      },
      {
        nom: "Tirage",
        objectif: "Équilibrer la poussée, tenir le contact.",
        couleur: GREEN,
        exos: [
          { id: "tractions", series: o.secondaire.series, reps: o.secondaire.reps, rpe: o.secondaire.rpe, repos: o.secondaire.repos, note: "Lestées ou assistées selon ton niveau." },
          { id: "rowing-barre", series: o.secondaire.series, reps: o.secondaire.reps, rpe: o.secondaire.rpe, repos: o.secondaire.repos },
        ],
      },
      {
        nom: "Épaules",
        objectif: "Force verticale et santé de l'épaule.",
        couleur: GOLD,
        exos: [
          { id: "developpe-militaire-halteres", series: "3", reps: o.secondaire.reps, rpe: o.secondaire.rpe, repos: o.secondaire.repos },
          { id: "face-pull", series: "3", reps: "15", rpe: "6", repos: "60 s" },
        ],
      },
      {
        nom: "Gainage",
        objectif: "Gainer le tronc en extension.",
        couleur: SKY,
        exos: [{ id: "hollow-body", series: "3", reps: "25 s", repos: "45 s" }],
      },
    ]),
    seance(`${key}-3`, "Corps entier : vitesse et répétition d'efforts", [
      warm([{ id: "corde-a-sauter", series: "2", reps: "30 s" }]),
      {
        role: "specifique",
        nom: "Vitesse",
        objectif: "Accélérer : qualité d'abord, repos complet.",
        couleur: NAVY,
        exos: [{ id: "sprint", series: w === 2 ? "8" : "6", reps: w === 2 ? "20 m" : "15 m", rpe: "9", repos: "2 min", note: "Accélération maximale, repos complet entre les courses." }],
      },
      {
        role: "principal",
        nom: "Chaîne postérieure",
        objectif: "Poussée de hanche explosive.",
        couleur: TEAL,
        exos: [
          { id: "hip-thrust", series: o.principal.series, reps: o.principal.reps, rpe: o.principal.rpe, repos: o.principal.repos },
          { id: "kettlebell-swing", series: o.secondaire.series, reps: "12", rpe: o.secondaire.rpe, repos: o.secondaire.repos },
        ],
      },
      {
        nom: "Portés",
        objectif: "Force fonctionnelle, tenue sous charge.",
        couleur: GREEN,
        exos: [{ id: "farmer-walk", series: "3", reps: "30 m", rpe: "7", repos: "90 s" }],
      },
      {
        nom: "Répétition d'efforts",
        objectif: "Répéter des efforts intenses avec peu de récupération, comme en match.",
        couleur: GOLD,
        exos: [{ id: "assault-bike", series: o.finisher.series, reps: o.finisher.effort, rpe: "8", repos: o.finisher.repos, note: "Effort maximal contrôlé, récupération active." }],
      },
    ]),
  ];
}

export const RUGBY_STARTER_PROGRAMS: StarterProgram[] = [
  {
    id: "starter-rugby-approche",
    sportId: "rugby",
    positionId: null,
    nom: "Rugby · Cycle d'approche",
    objectif: "Poser les bases techniques et la force générale avant un travail plus lourd",
    publicCible: "Joueur débutant ou qui reprend, tous postes",
    niveau: "debutant",
    seancesParSemaine: 3,
    materiel: ["Barre et rack", "Haltères", "Kettlebell", "Piste ou terrain"],
    qualites: [
      { nom: "Technique des mouvements de base", pct: 35 },
      { nom: "Force générale", pct: 30 },
      { nom: "Gainage", pct: 20 },
      { nom: "Vitesse technique", pct: 15 },
    ],
    semaines: APPROCHE.map((_, w) => ({
      numero: w + 1,
      theme: ["Découverte des mouvements", "Installation du volume", "Montée en charge", "Consolidation"][w],
      consignes:
        w === 0
          ? "Charges légères : l'objectif est de bien faire, pas de forcer. Garde 4 à 5 répétitions en réserve."
          : "Le volume baisse un peu et l'intensité monte. N'augmente la charge que si la technique reste propre.",
      seances: approcheSeances(w),
    })),
  },
  {
    id: "starter-rugby-general",
    sportId: "rugby",
    positionId: null,
    nom: "Rugby · Préparation générale",
    objectif: "Gagner en force, en puissance et en capacité à répéter les efforts",
    publicCible: "Joueur régulier depuis plus d'un an, tous postes",
    niveau: "intermediaire",
    seancesParSemaine: 3,
    materiel: ["Salle de sport complète", "Barre et rack", "Kettlebell", "Piste ou terrain", "Assault bike"],
    qualites: [
      { nom: "Force", pct: 30 },
      { nom: "Puissance", pct: 25 },
      { nom: "Hypertrophie fonctionnelle", pct: 15 },
      { nom: "Répétition d'efforts", pct: 15 },
      { nom: "Vitesse", pct: 15 },
    ],
    semaines: ONDE.map((o, w) => ({
      numero: w + 1,
      theme: o.theme,
      consignes: o.consignes,
      seances: ondeSeances(w),
    })),
  },
];
