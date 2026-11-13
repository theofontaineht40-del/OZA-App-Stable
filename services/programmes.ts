import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { MuscleId } from "../constants/muscle-selection";

export type ChargeType = "1rm" | "rpe" | "libre";

export type BlocExercice = {
  id: string;
  exerciceId: string;
  exerciceNom: string;
  exerciceIcon: string;
  series: string;
  repetitions: string;
  tempo: string;
  chargeType: ChargeType;
  chargeValeur: string;
  poidsIndicatif: string;
  reposSeries: string;
  reposRepetitions: string;
  commentaires: string;
};

// Comment les exercices d'un bloc s'enchaînent : l'un après l'autre avec leurs
// propres séries et repos (défaut), ou en bi-set / tri-set / circuit (on passe
// d'un exercice au suivant sans s'arrêter, le repos vient en fin de tour).
// `undefined` sur les blocs créés avant cette option = "serie".
export type BlocMode = "serie" | "biset" | "triset" | "circuit";

export const BLOC_MODES: { key: BlocMode; label: string; short: string }[] = [
  { key: "serie", label: "L'un après l'autre", short: "" },
  { key: "biset", label: "Bi-set", short: "Bi-set" },
  { key: "triset", label: "Tri-set", short: "Tri-set" },
  { key: "circuit", label: "Circuit", short: "Circuit" },
];

// Libellé court affiché à côté du nom du bloc ("" pour le mode classique).
export function blocModeLabel(bloc: { mode?: BlocMode }): string {
  return BLOC_MODES.find((m) => m.key === (bloc.mode ?? "serie"))?.short ?? "";
}

// Message si le nombre d'exercices ne colle pas au mode (bi-set = 2, tri-set
// = 3, circuit = au moins 3). null = rien à signaler.
export function blocModeWarning(bloc: { mode?: BlocMode; exercices: unknown[] }): string | null {
  const n = bloc.exercices.length;
  switch (bloc.mode) {
    case "biset":
      return n === 2 ? null : `Un bi-set enchaîne 2 exercices (ici ${n}).`;
    case "triset":
      return n === 3 ? null : `Un tri-set enchaîne 3 exercices (ici ${n}).`;
    case "circuit":
      return n >= 3 ? null : `Un circuit compte au moins 3 exercices (ici ${n}).`;
    default:
      return null;
  }
}

export type Bloc = {
  id: string;
  nom: string;
  objectif: string;
  couleur: string;
  mode?: BlocMode;
  exercices: BlocExercice[];
};

export type Seance = {
  id: string;
  nom: string;
  blocs: Bloc[];
  // Sélection manuelle des muscles sollicités (constants/muscle-selection.ts)
  // — indépendante du nom de la séance et des exercices. `undefined` sur les
  // séances créées avant cette fonctionnalité : le rendu retombe alors sur
  // l'ancienne déduction automatique à partir des exercices (voir
  // components/next-session-widget.tsx). Un tableau vide, lui, veut dire
  // "le coach n'a rien sélectionné" et n'affiche donc rien.
  muscles?: MuscleId[];
};

export type Programme = {
  id: string;
  coachId: string;
  sportifId: string | null;
  sportifName: string | null;
  nom: string;
  seances: Seance[];
  updatedAt: Date;
};

let idCounter = 0;

function newId(): string {
  // Le compteur évite deux ids identiques quand on en crée plusieurs dans la
  // même milliseconde (ajout de 5 exercices d'un coup, copie d'une séance...).
  idCounter = (idCounter + 1) % 100000;
  return `${Date.now()}_${Math.floor(Math.random() * 10000)}_${idCounter}`;
}

export function newBloc(): Bloc {
  return { id: newId(), nom: "Bloc 1", objectif: "", couleur: "#14B8A6", exercices: [] };
}

// Copie d'exercices avec de NOUVEAUX identifiants : indispensable quand on
// réutilise une liste d'exercices (protocole d'échauffement, ...) dans un
// autre bloc, sinon deux blocs partageraient les mêmes ids.
export function cloneExercices(list: BlocExercice[]): BlocExercice[] {
  return list.map((e) => ({ ...e, id: newId() }));
}

export function newSeance(index: number): Seance {
  // `muscles: []` (et non `undefined`) dès la création : une séance neuve
  // utilise le système de sélection manuelle dès le départ, jamais la
  // déduction automatique historique — voir le commentaire sur Seance.muscles.
  return { id: newId(), nom: `Séance ${index}`, blocs: [], muscles: [] };
}

export function newBlocExercice(exercice: {
  id: string;
  nom: string;
  icon: string;
}): BlocExercice {
  return {
    id: newId(),
    exerciceId: exercice.id,
    exerciceNom: exercice.nom,
    exerciceIcon: exercice.icon,
    series: "3",
    repetitions: "10",
    tempo: "2/0/1/2",
    chargeType: "rpe",
    chargeValeur: "7",
    poidsIndicatif: "",
    reposSeries: "2'",
    reposRepetitions: "0\"",
    commentaires: "",
  };
}

// "2'" → 120, "90\"" → 90, "1'30" → 90, "45" → 45 (sans unité : secondes).
export function parseRestSeconds(raw: string): number {
  const text = (raw ?? "").trim().replace(",", ".");
  if (!text) return 0;
  const minSec = text.match(/^(\d+(?:\.\d+)?)\s*'\s*(\d+)?/);
  if (minSec) return Math.round(parseFloat(minSec[1]) * 60 + (minSec[2] ? parseInt(minSec[2], 10) : 0));
  const n = parseFloat(text);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

// Nombre de séries lu dans un champ libre ("3", "3-4" → 3).
export function parseCount(raw: string): number {
  const n = parseInt((raw ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Durée approximative d'une séance (en minutes) : ~40 s d'effort par série
// + le repos entre séries, plus 1 minute de transition par exercice. Les blocs
// en bi-set / tri-set / circuit enchaînent les exercices : le repos n'est
// compté qu'une fois par tour.
export function estimateSeanceMinutes(seance: Seance): number {
  let seconds = 0;
  for (const bloc of seance.blocs) {
    const mode = bloc.mode ?? "serie";
    if (mode === "serie") {
      for (const ex of bloc.exercices) {
        const sets = parseCount(ex.series);
        seconds += sets * 40 + Math.max(0, sets - 1) * parseRestSeconds(ex.reposSeries) + 60;
      }
    } else if (bloc.exercices.length > 0) {
      const rounds = Math.max(...bloc.exercices.map((e) => parseCount(e.series)), 0);
      const rest = Math.max(...bloc.exercices.map((e) => parseRestSeconds(e.reposSeries)), 0);
      seconds += rounds * (bloc.exercices.length * 40 + rest) + 60;
    }
  }
  return Math.round(seconds / 60);
}

export function countSeanceSets(seance: Seance): number {
  return seance.blocs.reduce(
    (total, b) => total + b.exercices.reduce((t, e) => t + parseCount(e.series), 0),
    0
  );
}

// Copie d'une séance (nouveaux identifiants partout) ajoutée à la suite.
export function cloneSeance(seance: Seance, nom: string): Seance {
  return {
    ...seance,
    id: newId(),
    nom,
    muscles: seance.muscles ? [...seance.muscles] : seance.muscles,
    blocs: seance.blocs.map((b) => ({ ...b, id: newId(), exercices: cloneExercices(b.exercices) })),
  };
}

function toMillis(value: unknown): number {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

function normalize(id: string, data: Omit<Programme, "id">): Programme {
  return {
    id,
    coachId: data.coachId,
    sportifId: data.sportifId ?? null,
    sportifName: data.sportifName ?? null,
    nom: data.nom,
    seances: data.seances,
    updatedAt: data.updatedAt,
  };
}

export async function getProgrammesForCoach(coachId: string): Promise<Programme[]> {
  const q = query(collection(db, "programmes"), where("coachId", "==", coachId));
  const snap = await getDocs(q);
  const programmes = snap.docs.map((d) => normalize(d.id, d.data() as Omit<Programme, "id">));
  return programmes.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
}

export async function getProgrammesForSportif(sportifId: string): Promise<Programme[]> {
  const q = query(collection(db, "programmes"), where("sportifId", "==", sportifId));
  const snap = await getDocs(q);
  const programmes = snap.docs.map((d) => normalize(d.id, d.data() as Omit<Programme, "id">));
  return programmes.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
}

// Variante utilisée côté coach (ex: écran de planification) : filtrer aussi sur
// coachId. Sans ça, la requête ne matche que sur sportifId, et si ce sportif a ne
// serait-ce qu'un seul programme créé par un AUTRE coach, les règles Firestore
// refusent la requête entière (elles exigent que resource.data.coachId corresponde
// pour CHAQUE document potentiellement renvoyé) — l'écran restait bloqué en
// chargement infini.
export async function getProgrammesForCoachAndSportif(
  coachId: string,
  sportifId: string
): Promise<Programme[]> {
  const q = query(
    collection(db, "programmes"),
    where("coachId", "==", coachId),
    where("sportifId", "==", sportifId)
  );
  const snap = await getDocs(q);
  const programmes = snap.docs.map((d) => normalize(d.id, d.data() as Omit<Programme, "id">));
  return programmes.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
}

export async function getProgramme(id: string): Promise<Programme | null> {
  const snap = await getDoc(doc(db, "programmes", id));
  if (!snap.exists()) return null;
  return normalize(snap.id, snap.data() as Omit<Programme, "id">);
}

export async function createProgramme(
  coachId: string,
  nom: string,
  sportifId: string | null = null,
  sportifName: string | null = null
): Promise<string> {
  const ref = doc(collection(db, "programmes"));
  const programme: Omit<Programme, "id"> = {
    coachId,
    sportifId,
    sportifName,
    nom,
    seances: [newSeance(1)],
    updatedAt: new Date(),
  };
  await setDoc(ref, programme);
  return ref.id;
}

export async function saveProgramme(
  id: string,
  data: Pick<Programme, "nom" | "seances">
): Promise<void> {
  await setDoc(
    doc(db, "programmes", id),
    { ...data, updatedAt: new Date() },
    { merge: true }
  );
}

// Copie un programme existant (ex: construit pour un sportif) en un nouveau
// programme non assigné, prêt à être attribué à quelqu'un d'autre via
// assignProgrammeToSportif — contrairement à ça, duplicateProgramme ne
// touche jamais l'original : les deux coexistent et évoluent ensuite
// séparément (modifier la copie n'affecte pas le programme source).
export async function duplicateProgramme(programme: Programme): Promise<string> {
  const ref = doc(collection(db, "programmes"));
  const copy: Omit<Programme, "id"> = {
    coachId: programme.coachId,
    sportifId: null,
    sportifName: null,
    nom: `${programme.nom} (copie)`,
    seances: programme.seances,
    updatedAt: new Date(),
  };
  await setDoc(ref, copy);
  return ref.id;
}

export async function assignProgrammeToSportif(
  id: string,
  sportifId: string | null,
  sportifName: string | null
): Promise<void> {
  await setDoc(
    doc(db, "programmes", id),
    { sportifId, sportifName, updatedAt: new Date() },
    { merge: true }
  );
}

export async function deleteProgramme(id: string): Promise<void> {
  await deleteDoc(doc(db, "programmes", id));
}
