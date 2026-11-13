// Générateur automatique de bloc musculation, selon la méthode du coach
// (logique de blocs, planification par niveau) :
//
//  - Débutant      → planification linéaire, et TOUJOURS un cycle d'approche
//                    (technique, charges modérées, RPE contrôlé), quel que
//                    soit l'objectif final : jamais de charges lourdes d'entrée.
//  - Intermédiaire → planification ondulatoire (la qualité dominante change
//                    d'une semaine à l'autre).
//  - Avancé        → planification par bloc : une seule qualité dominante,
//                    intensifiée semaine après semaine.
//
// Dans chaque séance : 1-2 polyarticulaires par pattern de mouvement, 1-2
// monoarticulaires par articulation, polyarticulaire avant monoarticulaire,
// qualité la plus nerveuse en premier.
//
// Le résultat est un programme Oza ordinaire (séances → blocs → exercices) :
// le coach le relit et le modifie dans l'éditeur habituel. OZA propose, le
// coach décide.

import { BLOC_COLORS, EXERCISE_LIBRARY, ExerciseTemplate, Materiel } from "../constants/exercise-library";
import { Bloc, BlocExercice, BlocMode, Objectif, Seance, newBlocExercice, newSeance } from "./programmes";

export type GenObjectif = "renforcement" | "hypertrophie" | "force" | "puissance" | "perte_de_poids";
export type GenNiveau = "debutant" | "intermediaire" | "avance";
export type GenCharge = "rpe" | "1rm";

export const GEN_OBJECTIFS: { key: GenObjectif; label: string }[] = [
  { key: "renforcement", label: "Renforcement" },
  { key: "hypertrophie", label: "Hypertrophie" },
  { key: "force", label: "Force" },
  { key: "puissance", label: "Puissance" },
  { key: "perte_de_poids", label: "Perte de poids" },
];

export const GEN_NIVEAUX: { key: GenNiveau; label: string }[] = [
  { key: "debutant", label: "Débutant" },
  { key: "intermediaire", label: "Intermédiaire" },
  { key: "avance", label: "Avancé" },
];

// Matériel qu'on peut cocher. "Poids du corps" et "Banc" sont toujours
// considérés comme disponibles.
export const GEN_MATERIELS: Materiel[] = ["Barre", "Haltères", "Machine", "Kettlebell", "Élastique", "Corde"];

export type GenParams = {
  objectif: GenObjectif;
  niveau: GenNiveau;
  semaines: number; // 3 à 6
  jours: number[]; // 0 = lundi … 6 = dimanche ; leur nombre = séances / semaine
  materiel: Materiel[];
  charge: GenCharge;
  deload: boolean; // dernière semaine allégée
};

// ── Qualités travaillées et leurs dosages ─────────────────────────────────

type Qualite = "approche" | "renforcement" | "hypertrophie" | "force" | "puissance";

export const QUALITE_LABEL: Record<Qualite | "decharge", string> = {
  approche: "Cycle d'approche",
  renforcement: "Renforcement",
  hypertrophie: "Hypertrophie",
  force: "Force",
  puissance: "Puissance",
  decharge: "Décharge",
};

type Dose = { series: number; reps: string; rpe: number; pct: number; rest: string; tempo: string };

// Progression d'une qualité : un dosage par "étape" (semaine où cette qualité
// est travaillée). Au-delà de la dernière étape, on reste sur la dernière.
const PROGRESSIONS: Record<Qualite, Dose[]> = {
  // Linéaire débutant : le volume baisse, l'intensité monte doucement, sans
  // jamais dépasser ~72 % / RPE 7,5.
  approche: [
    { series: 3, reps: "12", rpe: 6, pct: 60, rest: "1'30", tempo: "3/0/1/0" },
    { series: 3, reps: "10", rpe: 6.5, pct: 63, rest: "1'30", tempo: "3/0/1/0" },
    { series: 3, reps: "10", rpe: 7, pct: 66, rest: "1'30", tempo: "3/0/1/0" },
    { series: 3, reps: "8", rpe: 7, pct: 69, rest: "1'30", tempo: "2/0/1/0" },
    { series: 3, reps: "8", rpe: 7.5, pct: 72, rest: "1'30", tempo: "2/0/1/0" },
    { series: 4, reps: "8", rpe: 7.5, pct: 72, rest: "1'30", tempo: "2/0/1/0" },
  ],
  renforcement: [
    { series: 3, reps: "15", rpe: 6.5, pct: 55, rest: "1'", tempo: "2/0/1/0" },
    { series: 3, reps: "15", rpe: 7, pct: 58, rest: "1'", tempo: "2/0/1/0" },
    { series: 4, reps: "12", rpe: 7, pct: 62, rest: "1'", tempo: "2/0/1/0" },
    { series: 4, reps: "12", rpe: 7.5, pct: 65, rest: "1'", tempo: "2/0/1/0" },
    { series: 4, reps: "12", rpe: 8, pct: 65, rest: "1'", tempo: "2/0/1/0" },
    { series: 4, reps: "10", rpe: 8, pct: 68, rest: "1'", tempo: "2/0/1/0" },
  ],
  hypertrophie: [
    { series: 4, reps: "12", rpe: 7, pct: 67, rest: "1'30", tempo: "3/0/1/0" },
    { series: 4, reps: "10", rpe: 7.5, pct: 70, rest: "1'30", tempo: "3/0/1/0" },
    { series: 4, reps: "10", rpe: 8, pct: 72, rest: "1'30", tempo: "3/0/1/0" },
    { series: 5, reps: "8", rpe: 8.5, pct: 75, rest: "1'30", tempo: "3/0/1/0" },
    { series: 5, reps: "8", rpe: 9, pct: 77, rest: "1'30", tempo: "3/0/1/0" },
    { series: 5, reps: "8", rpe: 9, pct: 78, rest: "1'30", tempo: "3/0/1/0" },
  ],
  force: [
    { series: 4, reps: "6", rpe: 7.5, pct: 80, rest: "3'", tempo: "2/0/1/0" },
    { series: 5, reps: "5", rpe: 8, pct: 83, rest: "3'", tempo: "2/0/1/0" },
    { series: 5, reps: "4", rpe: 8.5, pct: 86, rest: "3'", tempo: "2/0/1/0" },
    { series: 5, reps: "3", rpe: 9, pct: 89, rest: "3'", tempo: "2/0/1/0" },
    { series: 5, reps: "3", rpe: 9, pct: 90, rest: "3'", tempo: "2/0/1/0" },
    { series: 6, reps: "2", rpe: 9.5, pct: 92, rest: "3'", tempo: "2/0/1/0" },
  ],
  // Charge sous-maximale déplacée le plus vite possible.
  puissance: [
    { series: 5, reps: "3", rpe: 7, pct: 50, rest: "3'", tempo: "1/0/X/0" },
    { series: 5, reps: "3", rpe: 7, pct: 55, rest: "3'", tempo: "1/0/X/0" },
    { series: 6, reps: "3", rpe: 7.5, pct: 55, rest: "3'", tempo: "1/0/X/0" },
    { series: 6, reps: "3", rpe: 7.5, pct: 60, rest: "3'", tempo: "1/0/X/0" },
    { series: 6, reps: "2", rpe: 8, pct: 60, rest: "3'", tempo: "1/0/X/0" },
    { series: 6, reps: "2", rpe: 8, pct: 60, rest: "3'", tempo: "1/0/X/0" },
  ],
};

// Planification ondulatoire (intermédiaire) : la qualité de chaque semaine.
const ONDULATION: Record<GenObjectif, Qualite[]> = {
  renforcement: ["renforcement", "hypertrophie"],
  hypertrophie: ["hypertrophie", "force"],
  force: ["hypertrophie", "force", "puissance"],
  puissance: ["force", "puissance"],
  perte_de_poids: ["renforcement", "hypertrophie"],
};

// Planification par bloc (avancé) : la qualité dominante unique.
const DOMINANTE: Record<GenObjectif, Qualite> = {
  renforcement: "renforcement",
  hypertrophie: "hypertrophie",
  force: "force",
  puissance: "puissance",
  perte_de_poids: "hypertrophie",
};

// ── Exercices ─────────────────────────────────────────────────────────────

type Slot =
  | "squat"
  | "hinge"
  | "lunge"
  | "push_h"
  | "push_v"
  | "pull_h"
  | "pull_v"
  | "core"
  | "genou"
  | "hanche"
  | "epaule"
  | "biceps"
  | "triceps"
  | "cheville"
  | "explosif"
  | "metabolique"
  | "cardio_doux";

// Préférences par emplacement, de la plus classique à la plus spécifique.
// Les débutants ont leur propre ordre : machines et haltères d'abord,
// mouvements techniques à la barre ensuite.
const CHOIX: Record<Slot, { std: string[]; debutant?: string[] }> = {
  squat: {
    std: ["squat-arriere", "squat-avant", "safety-bar-squat", "presse-cuisses", "fentes-marchees"],
    debutant: ["presse-cuisses", "squat-arriere", "safety-bar-squat", "fentes-marchees"],
  },
  hinge: {
    std: ["souleve-terre-roumain", "solueve-terre", "hip-thrust", "good-morning", "kettlebell-swing", "ghd-extension", "releve-bassin-gainage"],
    debutant: ["hip-thrust", "souleve-terre-roumain", "kettlebell-swing", "ghd-extension", "releve-bassin-gainage"],
  },
  lunge: {
    std: ["split-squat", "fentes", "reverse-lunge", "fentes-marchees"],
    debutant: ["fentes", "reverse-lunge", "fentes-marchees", "split-squat"],
  },
  push_h: {
    std: ["developpe-couche", "developpe-couche-halteres", "pompes"],
    debutant: ["developpe-couche-halteres", "pompes", "developpe-couche"],
  },
  push_v: {
    std: ["developpe-militaire", "developpe-militaire-halteres", "dips"],
    debutant: ["developpe-militaire-halteres", "developpe-militaire"],
  },
  pull_h: {
    std: ["rowing-barre", "rowing-haltere", "tirage-horizontal", "tirage-scapulaire"],
    debutant: ["tirage-horizontal", "rowing-haltere", "rowing-barre", "tirage-scapulaire"],
  },
  pull_v: {
    std: ["tractions", "tirage-vertical", "tirage-vertical-unilateral"],
    debutant: ["tirage-vertical", "tirage-vertical-unilateral", "tractions"],
  },
  core: { std: ["gainage-planche", "pallof-press", "gainage-lateral", "hollow-body"] },
  genou: { std: ["leg-extension", "leg-curl", "leg-curl-ventral-poulie"] },
  hanche: { std: ["abduction-hanche-poulie", "kickback-fessier", "abduction-hanche-allonge-elastique"] },
  epaule: { std: ["elevations-laterales", "oiseau", "face-pull", "elevation-frontale"] },
  biceps: { std: ["curl-biceps", "curl-biceps-barre"] },
  triceps: { std: ["extension-triceps"] },
  cheville: { std: ["mollets-debout", "montee-pointes-pieds"] },
  explosif: { std: ["box-jump", "cmj", "squat-saute", "kettlebell-swing"] },
  metabolique: { std: ["rameur", "assault-bike", "burpees", "mountain-climbers", "corde-a-sauter", "skierg", "velo"] },
  // Cardio continu à basse intensité : uniquement des ergomètres (pas de burpees !).
  cardio_doux: { std: ["velo", "rameur", "skierg", "assault-bike"] },
};

const BY_ID = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]));

function isAvailable(ex: ExerciseTemplate, materiel: Materiel[]): boolean {
  // "Poids du corps" dans la liste = faisable sans rien (les autres matériels
  // ne sont que des variantes lestées).
  if (ex.materiel.includes("Poids du corps")) return true;
  const needed = ex.materiel.filter((m) => m !== "Banc");
  return needed.length === 0 || needed.some((m) => materiel.includes(m));
}

// Choisit un exercice pour l'emplacement. `variant` décale le choix (séance A
// vs séance B) ; `used` évite de placer deux fois le même exercice dans une
// séance.
function pick(
  slot: Slot,
  niveau: GenNiveau,
  materiel: Materiel[],
  variant: number,
  used: Set<string>
): ExerciseTemplate | null {
  const prefs = (niveau === "debutant" && CHOIX[slot].debutant) || CHOIX[slot].std;
  const options = prefs
    .map((id) => BY_ID.get(id))
    .filter((e): e is ExerciseTemplate => !!e && isAvailable(e, materiel) && !used.has(e.id));
  if (options.length === 0) return null;
  const chosen = options[variant % options.length];
  used.add(chosen.id);
  return chosen;
}

// ── Séances types ─────────────────────────────────────────────────────────

type SeanceType = {
  nom: string;
  principal: Slot[];
  secondaire: Slot[];
  accessoires: Slot[];
};

const TYPES: Record<string, SeanceType> = {
  fullA: { nom: "Full body A", principal: ["squat", "push_h"], secondaire: ["pull_v", "hinge"], accessoires: ["epaule", "biceps"] },
  fullB: { nom: "Full body B", principal: ["hinge", "push_v"], secondaire: ["pull_h", "lunge"], accessoires: ["genou", "triceps"] },
  fullC: { nom: "Full body C", principal: ["lunge", "pull_v"], secondaire: ["push_h", "hinge"], accessoires: ["hanche", "cheville"] },
  haut: { nom: "Haut du corps", principal: ["push_h", "pull_h"], secondaire: ["push_v", "pull_v"], accessoires: ["epaule", "biceps", "triceps"] },
  bas: { nom: "Bas du corps", principal: ["squat", "hinge"], secondaire: ["lunge"], accessoires: ["genou", "hanche", "cheville"] },
  push: { nom: "Poussée", principal: ["push_h", "push_v"], secondaire: ["push_h"], accessoires: ["epaule", "triceps"] },
  pull: { nom: "Tirage", principal: ["pull_v", "pull_h"], secondaire: ["pull_h"], accessoires: ["epaule", "biceps"] },
  jambes: { nom: "Jambes", principal: ["squat", "hinge"], secondaire: ["lunge"], accessoires: ["genou", "cheville"] },
};

// Répartition hebdomadaire selon le nombre de séances. Les débutants restent
// en full body (simple, chaque groupe musculaire vu plusieurs fois).
function weeklySplit(perWeek: number, niveau: GenNiveau): { type: SeanceType; variant: number }[] {
  const seq = (keys: string[]) => {
    const seen: Record<string, number> = {};
    return keys.map((k) => {
      seen[k] = (seen[k] ?? -1) + 1;
      return { type: TYPES[k], variant: seen[k] };
    });
  };
  const full = ["fullA", "fullB", "fullC", "fullA", "fullB", "fullC"].slice(0, perWeek);
  if (niveau === "debutant" || perWeek <= 3) return seq(full);
  if (perWeek === 4) return seq(["haut", "bas", "haut", "bas"]);
  if (perWeek === 5) return seq(["push", "pull", "jambes", "haut", "bas"]);
  return seq(["push", "pull", "jambes", "push", "pull", "jambes"]);
}

// ── Construction ──────────────────────────────────────────────────────────

export type GeneratedWeek = { index: number; qualite: Qualite | "decharge"; label: string };

export type GeneratedBlock = {
  nom: string;
  objectifBibliotheque: Objectif | null;
  planification: string;
  semaines: GeneratedWeek[];
  seances: Seance[];
  // seances[i] tombe la semaine seanceWeek[i], le jour seanceDay[i] (0 = lundi).
  seanceWeek: number[];
  seanceDay: number[];
  notes: string[];
};

const BIBLIO: Record<GenObjectif, Objectif | null> = {
  renforcement: "Renforcement musculaire",
  hypertrophie: "Hypertrophie",
  force: "Force",
  puissance: "Force",
  perte_de_poids: "Perte de poids",
};

let blocCounter = 0;
function blocId(): string {
  blocCounter = (blocCounter + 1) % 100000;
  return `gen_${Date.now()}_${Math.floor(Math.random() * 10000)}_${blocCounter}`;
}

function fmtRpe(n: number): string {
  return String(Math.round(n * 2) / 2).replace(".", ",");
}

function deloaded(d: Dose): Dose {
  return {
    ...d,
    series: Math.max(2, Math.round(d.series * 0.6)),
    rpe: Math.max(5, d.rpe - 1.5),
    pct: Math.max(50, d.pct - 10),
  };
}

function exerciseFrom(
  ex: ExerciseTemplate,
  dose: Dose,
  chargeType: "rpe" | "1rm",
  commentaires = ""
): BlocExercice {
  const item = newBlocExercice({ id: ex.id, nom: ex.nom, icon: ex.icon });
  return {
    ...item,
    series: String(dose.series),
    repetitions: dose.reps,
    tempo: dose.tempo,
    chargeType,
    chargeValeur: chargeType === "1rm" ? String(dose.pct) : fmtRpe(dose.rpe),
    reposSeries: dose.rest,
    reposRepetitions: "0\"",
    commentaires,
  };
}

function makeBloc(nom: string, objectif: string, index: number, exercices: BlocExercice[], mode: BlocMode = "serie"): Bloc {
  return {
    id: blocId(),
    nom,
    objectif,
    couleur: BLOC_COLORS[index % BLOC_COLORS.length],
    mode,
    exercices,
  };
}

export function generateBlock(params: GenParams): GeneratedBlock {
  const { objectif, niveau, materiel } = params;
  const semaines = Math.min(6, Math.max(3, params.semaines));
  const jours = [...params.jours].sort((a, b) => a - b);
  const perWeek = jours.length;
  // Le 1RM n'est fiable qu'à partir de l'intermédiaire.
  const charge: GenCharge = niveau === "debutant" ? "rpe" : params.charge;
  const notes: string[] = [];

  // 1. Qualité de chaque semaine.
  const weeks: GeneratedWeek[] = [];
  const steps: number[] = []; // étape de progression de la qualité, semaine par semaine
  const occurrences: Partial<Record<Qualite, number>> = {};
  for (let w = 0; w < semaines; w++) {
    const isDeload = params.deload && w === semaines - 1;
    let q: Qualite;
    if (niveau === "debutant") q = "approche";
    else if (niveau === "intermediaire") q = ONDULATION[objectif][w % ONDULATION[objectif].length];
    else q = DOMINANTE[objectif];
    if (isDeload) {
      weeks.push({ index: w, qualite: "decharge", label: QUALITE_LABEL.decharge });
      steps.push(Math.max(0, (occurrences[q] ?? 1) - 1));
    } else {
      const step = occurrences[q] ?? 0;
      occurrences[q] = step + 1;
      weeks.push({ index: w, qualite: q, label: QUALITE_LABEL[q] });
      steps.push(step);
    }
  }

  const planification =
    niveau === "debutant"
      ? "Planification linéaire"
      : niveau === "intermediaire"
        ? "Planification ondulatoire (d'une semaine à l'autre)"
        : "Planification par bloc";

  if (niveau === "debutant") {
    notes.push(
      objectif === "renforcement"
        ? "Débutant : cycle d'approche en planification linéaire (technique, gainage, charges modérées)."
        : `Débutant : cycle d'approche d'abord (technique, gainage, charges modérées). Le travail ${
            objectif === "perte_de_poids" ? "plus intense" : `orienté ${QUALITE_LABEL[DOMINANTE[objectif]].toLowerCase()}`
          } viendra au bloc suivant, une fois la technique acquise.`
    );
    if (params.charge === "1rm") notes.push("Intensité en RPE : un débutant n'a pas encore de 1RM fiable.");
  } else if (niveau === "intermediaire") {
    notes.push(
      `Intermédiaire : la qualité change chaque semaine (${ONDULATION[objectif]
        .map((q) => QUALITE_LABEL[q].toLowerCase())
        .join(" / ")}) pour éviter les plateaux.`
    );
  } else {
    notes.push(`Avancé : une seule qualité dominante sur tout le bloc (${QUALITE_LABEL[DOMINANTE[objectif]].toLowerCase()}), intensifiée chaque semaine.`);
  }
  if (objectif === "perte_de_poids") {
    notes.push(
      niveau === "debutant"
        ? "Perte de poids : circuits à faible intensité et cardio basse intensité en fin de séance."
        : niveau === "intermediaire"
          ? "Perte de poids : renforcement structuré + finisher intermittent à intensité modérée."
          : "Perte de poids : travail de masse (métabolisme de base) + finisher HIIT."
    );
  }
  if (params.deload) notes.push("Dernière semaine allégée : environ 40 % de séries en moins, charges réduites.");
  if (objectif === "puissance" || objectif === "force") {
    notes.push("Qualités nerveuses : garder au moins 48 h entre deux séances lourdes sur les mêmes groupes.");
  }
  notes.push("Prévoir l'échauffement (protocole d'échauffement de la bibliothèque) en tête de chaque séance.");

  // 2. Séances.
  const split = weeklySplit(perWeek, niveau);
  const seances: Seance[] = [];
  const seanceWeek: number[] = [];
  const seanceDay: number[] = [];
  const missing = new Set<string>();
  let noCardio = false;

  for (let w = 0; w < semaines; w++) {
    const week = weeks[w];
    const isDeload = week.qualite === "decharge";
    const baseQ: Qualite =
      niveau === "debutant"
        ? "approche"
        : niveau === "intermediaire"
          ? ONDULATION[objectif][w % ONDULATION[objectif].length]
          : DOMINANTE[objectif];
    const prog = PROGRESSIONS[baseQ];
    let main = prog[Math.min(steps[w], prog.length - 1)];
    if (isDeload) main = deloaded(main);

    // Polyarticulaires secondaires : un cran plus léger que le principal
    // (plus de répétitions) quand le principal est lourd ou explosif.
    let second: Dose =
      baseQ === "force" || baseQ === "puissance"
        ? { ...PROGRESSIONS.hypertrophie[Math.min(steps[w], 3)], series: 3 }
        : { ...main, series: Math.max(2, main.series - 1) };
    if (isDeload && !(baseQ === "force" || baseQ === "puissance")) second = { ...main, series: Math.max(2, main.series - 1) };
    else if (isDeload) second = deloaded(second);

    const acc: Dose = {
      series: isDeload ? 2 : 3,
      reps: w % 2 === 0 ? "12" : "15",
      rpe: isDeload ? 6.5 : Math.min(8.5, 7 + w * 0.3),
      pct: 0,
      rest: "1'",
      tempo: "2/0/1/1",
    };
    const holdSec = Math.min(45, 25 + steps[w] * 5);
    const gainage: Dose = { series: 3, reps: `${isDeload ? 25 : holdSec}"`, rpe: 6.5, pct: 0, rest: "45\"", tempo: "" };

    split.forEach(({ type, variant }, i) => {
      const used = new Set<string>();
      const seance = newSeance(seances.length + 1);
      seance.nom = `S${w + 1} · ${type.nom}`;
      const blocs: Bloc[] = [];
      const take = (slot: Slot, v = variant) => {
        const ex = pick(slot, niveau, materiel, v, used);
        if (!ex) missing.add(slot);
        return ex;
      };

      // Débutant en perte de poids : circuit basse intensité.
      if (niveau === "debutant" && objectif === "perte_de_poids") {
        const circuitDose: Dose = {
          series: isDeload ? 2 : Math.min(4, 2 + Math.floor(steps[w] / 2)),
          reps: "15",
          rpe: isDeload ? 5 : Math.min(6.5, 5.5 + steps[w] * 0.25),
          pct: 0,
          rest: "1'30",
          tempo: "2/0/1/0",
        };
        const circuit = [...type.principal, ...type.secondaire]
          .map((s) => take(s))
          .filter((e): e is ExerciseTemplate => !!e)
          .map((e) => exerciseFrom(e, circuitDose, "rpe", "Enchaîner sans pause ; repos en fin de tour."));
        if (circuit.length) blocs.push(makeBloc("Bloc 1 · Circuit renforcement", "Renforcement général, faible intensité", 0, circuit, circuit.length >= 3 ? "circuit" : "serie"));
        const core = take("core");
        if (core) blocs.push(makeBloc("Bloc 2 · Gainage", "Gainage", 1, [exerciseFrom(core, gainage, "rpe")]));
        const cardio = pick("cardio_doux", niveau, materiel, variant, used);
        if (!cardio) noCardio = true;
        if (cardio) {
          const minutes = isDeload ? 15 : Math.min(30, 15 + steps[w] * 3);
          blocs.push(
            makeBloc("Bloc 3 · Cardio basse intensité", "Endurance fondamentale", 2, [
              exerciseFrom(cardio, { series: 1, reps: `${minutes}'`, rpe: 5, pct: 0, rest: "0\"", tempo: "" }, "rpe", "Allure confortable : on peut parler."),
            ])
          );
        }
      } else {
        // Bloc 1 : qualité dominante. En puissance, un exercice explosif
        // ouvre le bloc (le plus nerveux en premier).
        const principalEx: BlocExercice[] = [];
        if (baseQ === "puissance") {
          const jump = take("explosif");
          if (jump) principalEx.push(exerciseFrom(jump, { ...main, reps: "5", pct: 0, rest: "2'" }, "rpe", "Qualité d'exécution maximale, arrêter dès que la vitesse baisse."));
        }
        const principalSlots = niveau === "debutant" ? type.principal : type.principal.slice(0, niveau === "avance" ? 2 : 1);
        for (const s of principalSlots) {
          const ex = take(s);
          if (ex) principalEx.push(exerciseFrom(ex, main, charge, baseQ === "puissance" ? "Phase concentrique la plus rapide possible." : ""));
        }
        if (principalEx.length) {
          blocs.push(
            makeBloc(
              `Bloc 1 · ${niveau === "debutant" ? "Technique" : isDeload ? "Décharge" : QUALITE_LABEL[baseQ]}`,
              niveau === "debutant" ? "Apprentissage technique, charges modérées" : QUALITE_LABEL[baseQ],
              0,
              principalEx
            )
          );
        }

        // Bloc 2 : polyarticulaires secondaires.
        const secondSlots = niveau === "debutant" ? type.secondaire.slice(0, 2) : [...type.principal.slice(principalSlots.length), ...type.secondaire];
        const secondEx = secondSlots
          .map((s) => take(s, variant + 1))
          .filter((e): e is ExerciseTemplate => !!e)
          .map((e) => exerciseFrom(e, niveau === "debutant" ? { ...main, series: Math.max(2, main.series - 1) } : second, charge));
        if (secondEx.length) {
          blocs.push(makeBloc(niveau === "debutant" ? "Bloc 2 · Renforcement" : niveau === "avance" ? "Bloc 2 · Entretien" : "Bloc 2 · Polyarticulaires", "Polyarticulaires secondaires", 1, secondEx));
        }

        // Bloc 3 : monoarticulaires (pas pour un débutant : priorité aux bases).
        if (niveau !== "debutant") {
          const accEx = type.accessoires
            .slice(0, niveau === "avance" ? 3 : 2)
            .map((s) => take(s))
            .filter((e): e is ExerciseTemplate => !!e)
            .map((e) => exerciseFrom(e, acc, "rpe"));
          if (accEx.length) blocs.push(makeBloc("Bloc 3 · Accessoires", "Monoarticulaires", 2, accEx));
        }

        // Dernier bloc : gainage, ou finisher métabolique en perte de poids.
        if (objectif === "perte_de_poids") {
          const hiit = niveau === "avance";
          const finisherDose: Dose = {
            series: isDeload ? 2 : hiit ? 4 : 3,
            reps: hiit ? "20\"" : "30\"",
            rpe: isDeload ? 6.5 : hiit ? 9 : 8,
            pct: 0,
            rest: hiit ? "1'" : "1'30",
            tempo: "",
          };
          const fin = [0, 1, 2]
            .map((k) => pick("metabolique", niveau, materiel, variant + k, used))
            .filter((e): e is ExerciseTemplate => !!e)
            .map((e) => exerciseFrom(e, finisherDose, "rpe", hiit ? "20\" d'effort / 10\" de récupération." : "30\" d'effort / 30\" de récupération."));
          if (fin.length) blocs.push(makeBloc(`Bloc ${blocs.length + 1} · Finisher ${hiit ? "HIIT" : "intermittent"}`, "Dépense énergétique", 3, fin, fin.length >= 3 ? "circuit" : "serie"));
        } else {
          const core = take("core");
          if (core) blocs.push(makeBloc(`Bloc ${blocs.length + 1} · Gainage`, "Gainage", 3, [exerciseFrom(core, gainage, "rpe")]));
        }
      }

      // Numérotation et couleurs finales (un emplacement sans exercice
      // disponible ne doit pas laisser de trou dans "Bloc 1, 2, 3…").
      blocs.forEach((b, k) => {
        b.nom = b.nom.replace(/^Bloc \d+/, `Bloc ${k + 1}`);
        b.couleur = BLOC_COLORS[k % BLOC_COLORS.length];
      });
      seance.blocs = blocs;
      seances.push(seance);
      seanceWeek.push(w);
      seanceDay.push(jours[i]);
    });
  }

  if (noCardio) {
    notes.push("Pas d'ergomètre coché (machine) : ajoute toi-même le cardio basse intensité (marche rapide, footing léger…).");
  }
  if (missing.size > 0) {
    notes.push("Certains mouvements n'ont pas d'exercice avec le matériel coché : ajoute-les à la main ou coche plus de matériel.");
  }

  const objLabel = GEN_OBJECTIFS.find((o) => o.key === objectif)?.label ?? "";
  const nivLabel = GEN_NIVEAUX.find((n) => n.key === niveau)?.label ?? "";
  return {
    nom: `Bloc ${objLabel.toLowerCase()} · ${nivLabel.toLowerCase()} · ${semaines} sem.`,
    objectifBibliotheque: BIBLIO[objectif],
    planification,
    semaines: weeks,
    seances,
    seanceWeek,
    seanceDay,
    notes,
  };
}
