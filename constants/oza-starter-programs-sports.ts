// Programmes de démarrage OZA Programs pour les autres sports. Même méthode que
// le rugby : cycle d'approche en progression linéaire pour le débutant,
// planification ondulatoire hebdomadaire pour l'intermédiaire (hypertrophie →
// force → puissance → décharge). Chaque sport définit ses trois séances par
// « emplacements » (puissance, principal, secondaire…) ; les séries, répétitions,
// RPE et repos sont déduits du niveau et de la semaine.
//
// Tous les programmes sont importés en BROUILLON : personne ne les voit avant
// relecture et publication par l'administrateur. Les charges sont en RPE.

import {
  APPROCHE,
  BlocSpec,
  Ex,
  GOLD,
  GREEN,
  NAVY,
  ONDE,
  Onde,
  SKY,
  StarterProgram,
  TEAL,
  seance,
} from "./oza-starter-programs";
import type { OzaNiveau } from "./oza-sports";
import type { Seance } from "../services/programmes";

type Slot = "power" | "principal" | "secondaire" | "accessoire" | "gainage" | "vitesse" | "finisher" | "cardio" | "circuit" | "warm";
type ExSpec = { id: string; reps?: string; note?: string };
type BlocT = {
  slot: Slot;
  nom: string;
  objectif: string;
  couleur: string;
  role?: BlocSpec["role"];
  mode?: BlocSpec["mode"];
  // Bloc réservé aux intermédiaires (pliométrie, finisher...).
  intermediaireOnly?: boolean;
  exos: ExSpec[];
};
type SeanceT = { nom: string; blocs: BlocT[] };

// ── Prescription : emplacement + niveau + semaine → série/rép/RPE/repos ──

function prescribe(slot: Slot, level: OzaNiveau, w: number, e: ExSpec, onde: Onde): Ex {
  const base = { id: e.id, note: e.note };
  const deb = level === "debutant";
  const p = APPROCHE[w];
  switch (slot) {
    case "principal":
      return deb
        ? { ...base, series: p.series, reps: e.reps ?? p.reps, rpe: p.rpe, repos: p.repos }
        : { ...base, series: onde.principal.series, reps: e.reps ?? onde.principal.reps, rpe: onde.principal.rpe, repos: onde.principal.repos };
    case "secondaire":
      return deb
        ? { ...base, series: p.series, reps: e.reps ?? p.reps, rpe: p.rpe, repos: p.repos }
        : { ...base, series: onde.secondaire.series, reps: e.reps ?? onde.secondaire.reps, rpe: onde.secondaire.rpe, repos: onde.secondaire.repos };
    case "accessoire":
      return deb
        ? { ...base, series: "3", reps: e.reps ?? "12", rpe: "5", repos: "60 s" }
        : { ...base, series: "3", reps: e.reps ?? onde.secondaire.reps, rpe: onde.secondaire.rpe, repos: "60 s" };
    case "power":
      return deb
        ? { ...base, series: "2", reps: e.reps ?? "5", repos: "90 s" }
        : { ...base, series: onde.puissance.series, reps: e.reps ?? onde.puissance.reps, repos: "90 s" };
    case "gainage":
      return { ...base, series: "3", reps: e.reps ?? "30 s", repos: "45 s" };
    case "vitesse":
      return deb
        ? { ...base, series: "6", reps: e.reps ?? "15 m", rpe: "7", repos: "1 min 30" }
        : { ...base, series: w === 2 ? "8" : "6", reps: e.reps ?? "15 m", rpe: "9", repos: "2 min" };
    case "finisher":
      return { ...base, series: onde.finisher.series, reps: e.reps ?? onde.finisher.effort, rpe: "8", repos: onde.finisher.repos };
    case "cardio":
      return deb
        ? { ...base, series: "3", reps: e.reps ?? "3 min", rpe: "6", repos: "90 s" }
        : { ...base, series: ["4", "4", "5", "3"][w], reps: e.reps ?? "3 min", rpe: ["7", "7-8", "8", "6"][w], repos: "2 min" };
    case "circuit":
      return deb
        ? { ...base, series: "3", reps: e.reps ?? "10", rpe: "6", repos: "2 min" }
        : { ...base, series: ["3", "4", "4", "2"][w], reps: e.reps ?? "10", rpe: ["7", "7", "8", "6"][w], repos: "2 min" };
    case "warm":
      return { ...base, series: "1", reps: e.reps ?? "10" };
  }
}

const WARM: BlocT = {
  slot: "warm",
  role: "echauffement",
  nom: "Échauffement",
  objectif: "Monter en température, mobiliser hanches, chevilles et épaules.",
  couleur: SKY,
  exos: [{ id: "rotation-hanche-genou-leve", reps: "10 / côté" }, { id: "marche-basse-position-gardee", reps: "10 m" }, { id: "mobilite-epaule" }],
};

function buildSeances(key: string, level: OzaNiveau, w: number, templates: SeanceT[], onde: Onde): Seance[] {
  return templates.map((t, i) =>
    seance(
      `${key}-s${w + 1}-${i + 1}`,
      t.nom,
      [WARM, ...t.blocs]
        .filter((b) => level !== "debutant" || !b.intermediaireOnly)
        .map((b): BlocSpec => ({
          role: b.role,
          mode: b.mode,
          nom: b.nom,
          objectif: b.objectif,
          couleur: b.couleur,
          exos: b.exos.map((e) => prescribe(b.slot, level, w, e, onde)),
        }))
    )
  );
}

type SportDef = {
  sportId: string;
  nom: string;
  qualitesApproche: { nom: string; pct: number }[];
  qualitesGeneral: { nom: string; pct: number }[];
  objectifApproche: string;
  objectifGeneral: string;
  publicApproche: string;
  publicGeneral: string;
  materiel: string[];
  seances: SeanceT[];
  // Cycle ondulatoire propre au sport (par défaut : hypertrophie → force → puissance → décharge).
  onde?: Onde[];
  themesApproche?: string[];
};

const THEMES_APPROCHE = ["Découverte des mouvements", "Installation du volume", "Montée en charge", "Consolidation"];

function program(def: SportDef, level: OzaNiveau): StarterProgram {
  const deb = level === "debutant";
  const ondes = def.onde ?? ONDE;
  return {
    id: `starter-${def.sportId}-${deb ? "approche" : "general"}`,
    sportId: def.sportId,
    positionId: null,
    nom: `${def.nom} · ${deb ? "Cycle d'approche" : "Préparation générale"}`,
    objectif: deb ? def.objectifApproche : def.objectifGeneral,
    publicCible: deb ? def.publicApproche : def.publicGeneral,
    niveau: level,
    seancesParSemaine: def.seances.length,
    materiel: def.materiel,
    qualites: deb ? def.qualitesApproche : def.qualitesGeneral,
    semaines: [0, 1, 2, 3].map((w) => ({
      numero: w + 1,
      theme: deb ? (def.themesApproche ?? THEMES_APPROCHE)[w] : ondes[w].theme,
      consignes: deb
        ? w === 0
          ? "Charges légères : l'objectif est de bien faire, pas de forcer. Garde 4 à 5 répétitions en réserve."
          : "Le volume baisse un peu et l'intensité monte. N'augmente la charge que si la technique reste propre."
        : ondes[w].consignes,
      seances: buildSeances(`${def.sportId}-${deb ? "approche" : "general"}`, level, w, def.seances, ondes[w]),
    })),
  };
}

const GAINAGE_ROT: BlocT = {
  slot: "gainage",
  nom: "Gainage",
  objectif: "Stabilité du tronc et résistance aux rotations.",
  couleur: GOLD,
  exos: [{ id: "pallof-press", reps: "10 / côté" }, { id: "gainage-lateral", reps: "25 s / côté" }],
};

const HAUT_CORPS: BlocT[] = [
  { slot: "principal", role: "principal", nom: "Poussée", objectif: "Force de poussée.", couleur: TEAL, exos: [{ id: "developpe-couche-halteres" }] },
  { slot: "secondaire", nom: "Tirage", objectif: "Équilibrer la poussée.", couleur: GREEN, exos: [{ id: "tirage-horizontal" }, { id: "rowing-haltere" }] },
  { slot: "accessoire", nom: "Épaules", objectif: "Santé et stabilité de l'épaule.", couleur: GOLD, exos: [{ id: "face-pull", reps: "15" }] },
];

const SPORTS: SportDef[] = [
  {
    sportId: "football",
    nom: "Football",
    objectifApproche: "Construire la force des jambes, le gainage et les bases de la vitesse avant un travail plus intense",
    objectifGeneral: "Gagner en vitesse, en puissance et en solidité pour répéter les sprints et limiter les blessures",
    publicApproche: "Joueur débutant ou qui reprend, tous postes",
    publicGeneral: "Joueur régulier depuis plus d'un an, tous postes",
    materiel: ["Salle de sport complète", "Barre et rack", "Haltères", "Terrain ou piste"],
    qualitesApproche: [{ nom: "Technique des mouvements de base", pct: 35 }, { nom: "Force des jambes", pct: 30 }, { nom: "Gainage", pct: 20 }, { nom: "Vitesse technique", pct: 15 }],
    qualitesGeneral: [{ nom: "Force unilatérale", pct: 25 }, { nom: "Vitesse et accélération", pct: 25 }, { nom: "Puissance", pct: 20 }, { nom: "Prévention des blessures", pct: 20 }, { nom: "Répétition de sprints", pct: 10 }],
    seances: [
      {
        nom: "Bas du corps : force unilatérale",
        blocs: [
          { slot: "power", intermediaireOnly: true, role: "specifique", nom: "Détente", objectif: "Activer le système nerveux.", couleur: NAVY, exos: [{ id: "cmj" }] },
          { slot: "principal", role: "principal", nom: "Squat", objectif: "Force des jambes.", couleur: TEAL, exos: [{ id: "squat-arriere" }] },
          { slot: "secondaire", nom: "Unilatéral et charnière", objectif: "Force sur une jambe, chaîne postérieure.", couleur: GREEN, exos: [{ id: "split-squat", reps: "8 / jambe" }, { id: "souleve-terre-roumain" }] },
          { slot: "accessoire", nom: "Prévention", objectif: "Ischio-jambiers et adducteurs, zones les plus touchées.", couleur: GOLD, exos: [{ id: "leg-curl" }, { id: "planche-copenhague", reps: "20 s / côté" }] },
        ],
      },
      {
        nom: "Vitesse et puissance",
        blocs: [
          { slot: "vitesse", role: "specifique", nom: "Vitesse", objectif: "Accélérer : qualité d'abord, repos complet.", couleur: NAVY, exos: [{ id: "sprint", reps: "20 m", note: "Accélération maximale, repos complet entre les courses." }] },
          { slot: "power", intermediaireOnly: true, nom: "Pliométrie", objectif: "Puissance de jambes.", couleur: SKY, exos: [{ id: "box-jump" }] },
          { slot: "principal", role: "principal", nom: "Chaîne postérieure", objectif: "Poussée de hanche explosive.", couleur: TEAL, exos: [{ id: "hip-thrust" }] },
          { slot: "secondaire", nom: "Unilatéral", objectif: "Stabilité et équilibre.", couleur: GREEN, exos: [{ id: "reverse-lunge", reps: "8 / jambe" }] },
          { slot: "finisher", intermediaireOnly: true, nom: "Répétition de sprints", objectif: "Répéter des efforts courts et intenses.", couleur: GOLD, exos: [{ id: "assault-bike" }] },
        ],
      },
      {
        nom: "Haut du corps, gainage et prévention",
        blocs: [...HAUT_CORPS, GAINAGE_ROT, { slot: "accessoire", nom: "Chevilles", objectif: "Solidité de la cheville et du mollet.", couleur: SKY, exos: [{ id: "mollets-debout", reps: "15" }] }],
      },
    ],
  },
  {
    sportId: "basket",
    nom: "Basket-ball",
    objectifApproche: "Construire la force des jambes et de la cheville avant un travail de détente",
    objectifGeneral: "Gagner en détente verticale, en vitesse de déplacement et en solidité articulaire",
    publicApproche: "Joueur débutant ou qui reprend, tous postes",
    publicGeneral: "Joueur régulier depuis plus d'un an, tous postes",
    materiel: ["Salle de sport complète", "Barre et rack", "Haltères", "Box de pliométrie"],
    qualitesApproche: [{ nom: "Technique des mouvements de base", pct: 35 }, { nom: "Force des jambes", pct: 30 }, { nom: "Gainage", pct: 20 }, { nom: "Stabilité de cheville", pct: 15 }],
    qualitesGeneral: [{ nom: "Détente verticale", pct: 30 }, { nom: "Force des jambes", pct: 25 }, { nom: "Vitesse de déplacement", pct: 20 }, { nom: "Prévention cheville et genou", pct: 15 }, { nom: "Haut du corps", pct: 10 }],
    seances: [
      {
        nom: "Bas du corps : force",
        blocs: [
          { slot: "principal", role: "principal", nom: "Squat", objectif: "Force des jambes.", couleur: TEAL, exos: [{ id: "squat-arriere" }] },
          { slot: "secondaire", nom: "Charnière et unilatéral", objectif: "Chaîne postérieure et équilibre.", couleur: GREEN, exos: [{ id: "souleve-terre-roumain" }, { id: "split-squat", reps: "8 / jambe" }] },
          { slot: "accessoire", nom: "Chevilles et adducteurs", objectif: "Prévention des entorses et des douleurs d'aine.", couleur: GOLD, exos: [{ id: "mollets-debout", reps: "15" }, { id: "planche-copenhague", reps: "20 s / côté" }] },
        ],
      },
      {
        nom: "Détente verticale et vitesse",
        blocs: [
          { slot: "power", role: "specifique", nom: "Détente", objectif: "Sauter plus haut : intention maximale, réception contrôlée.", couleur: NAVY, exos: [{ id: "cmj" }, { id: "box-jump" }] },
          { slot: "vitesse", nom: "Vitesse courte", objectif: "Accélérations de 10 m, comme sur un terrain de basket.", couleur: SKY, exos: [{ id: "sprint", reps: "10 m" }] },
          { slot: "principal", role: "principal", nom: "Squat avant", objectif: "Force des jambes, buste droit.", couleur: TEAL, exos: [{ id: "squat-avant" }] },
          { slot: "secondaire", nom: "Poussée de hanche", objectif: "Extension de hanche puissante.", couleur: GREEN, exos: [{ id: "hip-thrust" }] },
          { slot: "finisher", intermediaireOnly: true, nom: "Répétition d'efforts", objectif: "Répéter des efforts intenses.", couleur: GOLD, exos: [{ id: "corde-a-sauter", reps: "30 s" }] },
        ],
      },
      {
        nom: "Haut du corps et gainage",
        blocs: [
          { slot: "principal", role: "principal", nom: "Poussée verticale", objectif: "Force des épaules.", couleur: TEAL, exos: [{ id: "developpe-militaire-halteres" }] },
          { slot: "secondaire", nom: "Tirage", objectif: "Contact et rebond.", couleur: GREEN, exos: [{ id: "tractions", note: "Assistées (élastique ou machine) si tu ne fais pas encore le nombre de répétitions demandé." }, { id: "rowing-haltere" }] },
          { slot: "accessoire", nom: "Épaules", objectif: "Santé de l'épaule.", couleur: GOLD, exos: [{ id: "face-pull", reps: "15" }] },
          { slot: "gainage", nom: "Gainage", objectif: "Stabilité du tronc.", couleur: SKY, exos: [{ id: "hollow-body", reps: "20 s" }, { id: "pallof-press", reps: "10 / côté" }] },
        ],
      },
    ],
  },
  {
    sportId: "handball",
    nom: "Handball",
    objectifApproche: "Construire la force générale, la stabilité d'épaule et les bases de la vitesse",
    objectifGeneral: "Gagner en puissance de lancer, en vitesse et en capacité à répéter les efforts",
    publicApproche: "Joueur débutant ou qui reprend, tous postes",
    publicGeneral: "Joueur régulier depuis plus d'un an, tous postes",
    materiel: ["Salle de sport complète", "Barre et rack", "Kettlebell", "Assault bike"],
    qualitesApproche: [{ nom: "Technique des mouvements de base", pct: 35 }, { nom: "Force générale", pct: 30 }, { nom: "Stabilité d'épaule", pct: 20 }, { nom: "Gainage", pct: 15 }],
    qualitesGeneral: [{ nom: "Puissance de lancer", pct: 25 }, { nom: "Force", pct: 25 }, { nom: "Vitesse", pct: 20 }, { nom: "Santé de l'épaule", pct: 15 }, { nom: "Répétition d'efforts", pct: 15 }],
    seances: [
      {
        nom: "Bas du corps",
        blocs: [
          { slot: "principal", role: "principal", nom: "Squat", objectif: "Force des jambes.", couleur: TEAL, exos: [{ id: "squat-arriere" }] },
          { slot: "secondaire", nom: "Charnière et unilatéral", objectif: "Chaîne postérieure et appuis.", couleur: GREEN, exos: [{ id: "souleve-terre-roumain" }, { id: "reverse-lunge", reps: "8 / jambe" }] },
          GAINAGE_ROT,
        ],
      },
      {
        nom: "Haut du corps et lancer",
        blocs: [
          { slot: "power", intermediaireOnly: true, role: "specifique", nom: "Rotation explosive", objectif: "Transmettre la force du sol au bras.", couleur: NAVY, exos: [{ id: "swing-baseball-rotation" }] },
          { slot: "principal", role: "principal", nom: "Poussée", objectif: "Force de poussée.", couleur: TEAL, exos: [{ id: "developpe-couche" }] },
          { slot: "secondaire", nom: "Tirage", objectif: "Équilibrer la poussée et protéger l'épaule.", couleur: GREEN, exos: [{ id: "tractions", note: "Assistées (élastique ou machine) si tu ne fais pas encore le nombre de répétitions demandé." }, { id: "rowing-barre" }] },
          { slot: "accessoire", nom: "Coiffe des rotateurs", objectif: "Santé de l'épaule du lanceur.", couleur: GOLD, exos: [{ id: "rotation-externe-r1", reps: "15" }, { id: "face-pull", reps: "15" }] },
        ],
      },
      {
        nom: "Corps entier : vitesse et répétition d'efforts",
        blocs: [
          { slot: "vitesse", role: "specifique", nom: "Vitesse", objectif: "Accélérer sur de courtes distances.", couleur: NAVY, exos: [{ id: "sprint", reps: "15 m" }] },
          { slot: "principal", role: "principal", nom: "Chaîne postérieure", objectif: "Poussée de hanche.", couleur: TEAL, exos: [{ id: "hip-thrust" }] },
          { slot: "secondaire", nom: "Balancé", objectif: "Puissance de hanche.", couleur: GREEN, exos: [{ id: "kettlebell-swing", reps: "12" }] },
          { slot: "finisher", intermediaireOnly: true, nom: "Répétition d'efforts", objectif: "Répéter des efforts intenses comme en match.", couleur: GOLD, exos: [{ id: "assault-bike" }] },
        ],
      },
    ],
  },
  {
    sportId: "athletisme",
    nom: "Athlétisme",
    objectifApproche: "Construire la force des jambes, le gainage et la technique de course avant un travail explosif",
    objectifGeneral: "Gagner en force, en puissance et en vitesse maximale (sprint, sauts, lancers)",
    publicApproche: "Athlète débutant ou qui reprend",
    publicGeneral: "Athlète régulier depuis plus d'un an (sprint, sauts, épreuves explosives)",
    materiel: ["Salle de sport complète", "Barre et rack", "Piste", "Box de pliométrie"],
    qualitesApproche: [{ nom: "Technique des mouvements de base", pct: 35 }, { nom: "Force des jambes", pct: 30 }, { nom: "Gainage", pct: 20 }, { nom: "Technique de course", pct: 15 }],
    qualitesGeneral: [{ nom: "Force maximale", pct: 25 }, { nom: "Puissance", pct: 25 }, { nom: "Vitesse maximale", pct: 25 }, { nom: "Force du haut du corps", pct: 10 }, { nom: "Gainage", pct: 15 }],
    seances: [
      {
        nom: "Bas du corps : force",
        blocs: [
          { slot: "principal", role: "principal", nom: "Squat", objectif: "Force maximale des jambes.", couleur: TEAL, exos: [{ id: "squat-arriere" }] },
          { slot: "secondaire", nom: "Charnière et unilatéral", objectif: "Chaîne postérieure, base de la vitesse.", couleur: GREEN, exos: [{ id: "souleve-terre-roumain" }, { id: "split-squat", reps: "8 / jambe" }] },
          { slot: "accessoire", nom: "Mollets", objectif: "Raideur et force du complexe cheville.", couleur: GOLD, exos: [{ id: "mollets-debout", reps: "15" }] },
        ],
      },
      {
        nom: "Vitesse et pliométrie",
        blocs: [
          { slot: "vitesse", role: "specifique", nom: "Vitesse", objectif: "Accélération puis vitesse lancée, repos complet.", couleur: NAVY, exos: [{ id: "sprint", reps: "20 m" }] },
          { slot: "power", intermediaireOnly: true, nom: "Pliométrie", objectif: "Puissance de jambes.", couleur: SKY, exos: [{ id: "cmj" }, { id: "box-jump" }] },
          { slot: "principal", role: "principal", nom: "Poussée de hanche", objectif: "Extension de hanche puissante.", couleur: TEAL, exos: [{ id: "hip-thrust" }] },
          { slot: "secondaire", nom: "Balancé", objectif: "Puissance de hanche.", couleur: GREEN, exos: [{ id: "kettlebell-swing", reps: "12" }] },
        ],
      },
      {
        nom: "Haut du corps et gainage",
        blocs: [...HAUT_CORPS.slice(0, 2), { slot: "gainage", nom: "Gainage", objectif: "Transmettre la force du sol au haut du corps.", couleur: GOLD, exos: [{ id: "hollow-body", reps: "20 s" }, { id: "pallof-press", reps: "10 / côté" }] }],
      },
    ],
  },
  {
    sportId: "combat",
    nom: "Sports de combat",
    objectifApproche: "Construire la force générale, le gainage et la condition physique de base",
    objectifGeneral: "Gagner en force, en puissance de rotation et en endurance de combat",
    publicApproche: "Pratiquant débutant ou qui reprend (boxe, MMA, judo, lutte…)",
    publicGeneral: "Pratiquant régulier depuis plus d'un an (boxe, MMA, judo, lutte…)",
    materiel: ["Salle de sport complète", "Barre et rack", "Assault bike", "Battle ropes"],
    qualitesApproche: [{ nom: "Technique des mouvements de base", pct: 35 }, { nom: "Force générale", pct: 25 }, { nom: "Gainage", pct: 20 }, { nom: "Condition physique", pct: 20 }],
    qualitesGeneral: [{ nom: "Force", pct: 25 }, { nom: "Puissance de rotation", pct: 20 }, { nom: "Endurance de combat", pct: 25 }, { nom: "Gainage", pct: 15 }, { nom: "Vitesse", pct: 15 }],
    seances: [
      {
        nom: "Bas du corps et gainage",
        blocs: [
          { slot: "principal", role: "principal", nom: "Squat", objectif: "Force des jambes et d'ancrage.", couleur: TEAL, exos: [{ id: "squat-arriere" }] },
          { slot: "secondaire", nom: "Charnière et unilatéral", objectif: "Chaîne postérieure et appuis.", couleur: GREEN, exos: [{ id: "souleve-terre-roumain" }, { id: "reverse-lunge", reps: "8 / jambe" }] },
          GAINAGE_ROT,
        ],
      },
      {
        nom: "Haut du corps et rotation",
        blocs: [
          { slot: "power", intermediaireOnly: true, role: "specifique", nom: "Rotation explosive", objectif: "Puissance de frappe : la force vient du sol et des hanches.", couleur: NAVY, exos: [{ id: "rotation-tronc-explosive" }] },
          { slot: "principal", role: "principal", nom: "Poussée", objectif: "Force de poussée.", couleur: TEAL, exos: [{ id: "developpe-couche" }] },
          { slot: "secondaire", nom: "Tirage", objectif: "Contrôle, saisies et tirage.", couleur: GREEN, exos: [{ id: "tractions", note: "Assistées (élastique ou machine) si tu ne fais pas encore le nombre de répétitions demandé." }, { id: "rowing-barre" }] },
          { slot: "gainage", nom: "Gainage", objectif: "Tenir le tronc sous les impacts.", couleur: GOLD, exos: [{ id: "gainage-planche", reps: "30 s" }, { id: "rotation-landmine", reps: "10 / côté" }] },
        ],
      },
      {
        nom: "Condition physique : circuit",
        blocs: [
          { slot: "circuit", mode: "circuit", role: "principal", nom: "Circuit de combat", objectif: "Enchaîner les efforts avec peu de récupération, comme sur un round.", couleur: TEAL, exos: [{ id: "burpees", reps: "8" }, { id: "battle-ropes", reps: "20 s" }, { id: "corde-a-sauter", reps: "30 s" }, { id: "mountain-climbers", reps: "20 s" }] },
          { slot: "finisher", intermediaireOnly: true, nom: "Finisher", objectif: "Finir les rounds fatigué, garder la qualité.", couleur: GOLD, exos: [{ id: "assault-bike" }] },
        ],
      },
    ],
  },
  {
    sportId: "hyrox",
    nom: "Hyrox",
    objectifApproche: "Construire la force des jambes, les portés et la base d'endurance avant un travail spécifique",
    objectifGeneral: "Gagner en force-endurance et en capacité à enchaîner course et stations",
    publicApproche: "Pratiquant débutant ou qui prépare son premier Hyrox",
    publicGeneral: "Pratiquant régulier depuis plus d'un an, déjà à l'aise avec les stations",
    materiel: ["Salle de sport complète", "Rameur", "SkiErg", "Kettlebell", "Assault bike"],
    qualitesApproche: [{ nom: "Technique des stations", pct: 30 }, { nom: "Force des jambes", pct: 30 }, { nom: "Endurance de base", pct: 25 }, { nom: "Gainage", pct: 15 }],
    qualitesGeneral: [{ nom: "Force-endurance", pct: 30 }, { nom: "Endurance aérobie", pct: 25 }, { nom: "Force des jambes", pct: 20 }, { nom: "Enchaînements", pct: 15 }, { nom: "Portés", pct: 10 }],
    seances: [
      {
        nom: "Force des jambes et portés",
        blocs: [
          { slot: "principal", role: "principal", nom: "Squat", objectif: "Force des jambes.", couleur: TEAL, exos: [{ id: "squat-arriere" }] },
          { slot: "secondaire", nom: "Fentes et charnière", objectif: "Base des fentes marchées de la compétition.", couleur: GREEN, exos: [{ id: "fentes-marchees", reps: "20 m" }, { id: "souleve-terre-roumain" }] },
          { slot: "accessoire", nom: "Portés", objectif: "Tenue sous charge, comme à la station Farmers carry.", couleur: GOLD, exos: [{ id: "farmer-walk", reps: "40 m" }] },
        ],
      },
      {
        nom: "Intervalles : rameur et SkiErg",
        blocs: [
          { slot: "cardio", role: "principal", nom: "Rameur", objectif: "Endurance et tirage efficace.", couleur: TEAL, exos: [{ id: "rameur" }] },
          { slot: "cardio", nom: "SkiErg", objectif: "Endurance haut du corps.", couleur: GREEN, exos: [{ id: "skierg" }] },
          { slot: "gainage", nom: "Gainage", objectif: "Stabilité du tronc.", couleur: GOLD, exos: [{ id: "gainage-planche", reps: "30 s" }] },
        ],
      },
      {
        nom: "Circuit hybride",
        blocs: [
          { slot: "circuit", mode: "circuit", role: "principal", nom: "Circuit stations", objectif: "Enchaîner les mouvements des stations avec peu de récupération.", couleur: TEAL, exos: [{ id: "kettlebell-swing", reps: "12" }, { id: "burpees", reps: "8" }, { id: "fentes-marchees", reps: "20 m" }, { id: "farmer-walk", reps: "30 m" }] },
          { slot: "finisher", intermediaireOnly: true, nom: "Finisher", objectif: "Finir sous fatigue, garder la technique.", couleur: GOLD, exos: [{ id: "assault-bike" }] },
        ],
      },
    ],
  },
  {
    sportId: "course",
    nom: "Course à pied",
    objectifApproche: "Renforcer les jambes et le tronc pour courir plus longtemps et moins se blesser",
    objectifGeneral: "Gagner en économie de course et en solidité, en complément du plan d'entraînement de course",
    publicApproche: "Coureur débutant ou qui reprend",
    publicGeneral: "Coureur régulier depuis plus d'un an",
    materiel: ["Salle de sport complète", "Haltères", "Barre et rack"],
    qualitesApproche: [{ nom: "Technique des mouvements de base", pct: 35 }, { nom: "Force des jambes", pct: 30 }, { nom: "Gainage", pct: 25 }, { nom: "Mollets et chevilles", pct: 10 }],
    qualitesGeneral: [{ nom: "Force des jambes", pct: 30 }, { nom: "Économie de course", pct: 20 }, { nom: "Gainage et stabilité", pct: 25 }, { nom: "Prévention des blessures", pct: 15 }, { nom: "Haut du corps", pct: 10 }],
    seances: [
      {
        nom: "Force des jambes",
        blocs: [
          { slot: "principal", role: "principal", nom: "Squat", objectif: "Force des jambes, pour garder son allure en fin de course.", couleur: TEAL, exos: [{ id: "squat-arriere" }] },
          { slot: "secondaire", nom: "Unilatéral et charnière", objectif: "Stabilité et chaîne postérieure.", couleur: GREEN, exos: [{ id: "split-squat", reps: "8 / jambe" }, { id: "souleve-terre-roumain" }] },
          { slot: "accessoire", nom: "Mollets", objectif: "Absorber les impacts.", couleur: GOLD, exos: [{ id: "mollets-debout", reps: "15" }] },
        ],
      },
      {
        nom: "Gainage et stabilité",
        blocs: [
          { slot: "gainage", nom: "Tronc", objectif: "Garder une foulée stable quand la fatigue arrive.", couleur: GOLD, exos: [{ id: "gainage-planche", reps: "30 s" }, { id: "gainage-lateral", reps: "25 s / côté" }, { id: "pallof-press", reps: "10 / côté" }] },
          { slot: "accessoire", nom: "Hanches", objectif: "Stabilité du bassin, prévention des blessures.", couleur: GREEN, exos: [{ id: "planche-copenhague", reps: "20 s / côté" }, { id: "hip-thrust", reps: "10" }] },
          { slot: "secondaire", nom: "Haut du corps léger", objectif: "Posture et gestion des bras.", couleur: SKY, exos: [{ id: "tirage-horizontal" }, { id: "pompes", reps: "10" }] },
        ],
      },
      {
        nom: "Pliométrie légère et mollets",
        blocs: [
          { slot: "power", role: "specifique", nom: "Rebonds", objectif: "Raideur et réactivité du pied.", couleur: NAVY, exos: [{ id: "corde-a-sauter", reps: "30 s" }, { id: "squat-saute", reps: "5" }] },
          { slot: "principal", role: "principal", nom: "Poussée de hanche", objectif: "Force de propulsion.", couleur: TEAL, exos: [{ id: "hip-thrust" }] },
          { slot: "accessoire", nom: "Pieds et chevilles", objectif: "Solidité du pied et de la cheville.", couleur: GOLD, exos: [{ id: "mollets-debout", reps: "15" }, { id: "montee-pointes-pieds", reps: "15" }] },
        ],
      },
    ],
  },
];

// ── Musculation : cycle d'hypertrophie (volume → intensité → volume haut → décharge) ──

const ONDE_HYPER: Onde[] = [
  { theme: "Volume", consignes: "Volume élevé, intensité moyenne. Garde 2 à 3 répétitions en réserve et soigne le contrôle du mouvement.", principal: { series: "4", reps: "10", rpe: "7", repos: "2 min" }, secondaire: { series: "3", reps: "12", rpe: "7", repos: "90 s" }, puissance: { series: "0", reps: "" }, finisher: { series: "0", effort: "", repos: "" } },
  { theme: "Intensité", consignes: "Charges plus lourdes, moins de répétitions. Repose-toi complètement entre les séries.", principal: { series: "4", reps: "8", rpe: "8", repos: "2 min 30" }, secondaire: { series: "3", reps: "10", rpe: "8", repos: "90 s" }, puissance: { series: "0", reps: "" }, finisher: { series: "0", effort: "", repos: "" } },
  { theme: "Volume élevé", consignes: "Une série de plus sur les exercices principaux. C'est la semaine la plus chargée du cycle.", principal: { series: "5", reps: "10", rpe: "8", repos: "2 min" }, secondaire: { series: "4", reps: "12", rpe: "8", repos: "90 s" }, puissance: { series: "0", reps: "" }, finisher: { series: "0", effort: "", repos: "" } },
  { theme: "Décharge", consignes: "Volume réduit d'environ 40 %. Récupère pour consolider les gains.", principal: { series: "3", reps: "8", rpe: "6", repos: "2 min" }, secondaire: { series: "2", reps: "10", rpe: "6", repos: "90 s" }, puissance: { series: "0", reps: "" }, finisher: { series: "0", effort: "", repos: "" } },
];

const MUSCULATION: SportDef = {
  sportId: "musculation",
  nom: "Musculation",
  objectifApproche: "Apprendre les mouvements de base et installer la régularité avant un travail plus lourd",
  objectifGeneral: "Développer la masse musculaire et la force avec un cycle poussée, tirage, jambes",
  publicApproche: "Pratiquant débutant ou qui reprend",
  publicGeneral: "Pratiquant régulier depuis plus d'un an",
  materiel: ["Salle de sport complète", "Barre et rack", "Haltères"],
  qualitesApproche: [{ nom: "Technique des mouvements de base", pct: 40 }, { nom: "Force générale", pct: 30 }, { nom: "Hypertrophie légère", pct: 20 }, { nom: "Gainage", pct: 10 }],
  qualitesGeneral: [{ nom: "Hypertrophie", pct: 50 }, { nom: "Force", pct: 30 }, { nom: "Gainage", pct: 10 }, { nom: "Santé de l'épaule", pct: 10 }],
  onde: ONDE_HYPER,
  seances: [
    {
      nom: "Poussée : pectoraux, épaules, triceps",
      blocs: [
        { slot: "principal", role: "principal", nom: "Poussée horizontale", objectif: "Pectoraux, triceps.", couleur: TEAL, exos: [{ id: "developpe-couche" }] },
        { slot: "secondaire", nom: "Poussée verticale", objectif: "Épaules.", couleur: GREEN, exos: [{ id: "developpe-militaire-halteres" }, { id: "dips", reps: "8" }] },
        { slot: "accessoire", nom: "Isolation", objectif: "Épaules et triceps.", couleur: GOLD, exos: [{ id: "elevations-laterales", reps: "15" }, { id: "extension-triceps", reps: "12" }] },
      ],
    },
    {
      nom: "Tirage : dos, biceps",
      blocs: [
        { slot: "principal", role: "principal", nom: "Tirage vertical", objectif: "Grand dorsal.", couleur: TEAL, exos: [{ id: "tractions", note: "Assistées (élastique ou machine) si tu ne fais pas encore le nombre de répétitions demandé." }] },
        { slot: "secondaire", nom: "Tirage horizontal", objectif: "Épaisseur du dos.", couleur: GREEN, exos: [{ id: "rowing-barre" }, { id: "tirage-vertical" }] },
        { slot: "accessoire", nom: "Isolation", objectif: "Biceps et arrière d'épaule.", couleur: GOLD, exos: [{ id: "curl-biceps", reps: "12" }, { id: "face-pull", reps: "15" }] },
      ],
    },
    {
      nom: "Jambes",
      blocs: [
        { slot: "principal", role: "principal", nom: "Squat", objectif: "Quadriceps, fessiers.", couleur: TEAL, exos: [{ id: "squat-arriere" }] },
        { slot: "secondaire", nom: "Charnière et presse", objectif: "Ischio-jambiers, fessiers, quadriceps.", couleur: GREEN, exos: [{ id: "souleve-terre-roumain" }, { id: "presse-cuisses" }] },
        { slot: "accessoire", nom: "Isolation", objectif: "Ischio-jambiers et mollets.", couleur: GOLD, exos: [{ id: "leg-curl", reps: "12" }, { id: "mollets-debout", reps: "15" }] },
      ],
    },
  ],
};

export const SPORT_STARTER_PROGRAMS: StarterProgram[] = [...SPORTS, MUSCULATION].flatMap((d) => [
  program(d, "debutant"),
  program(d, "intermediaire"),
]);
