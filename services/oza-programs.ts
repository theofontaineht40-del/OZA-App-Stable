import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

import { db } from "../firebase";
import { DEFAULT_OZA_SPORTS, OzaNiveau, OzaSport } from "../constants/oza-sports";
import { RUGBY_STARTER_PROGRAMS } from "../constants/oza-starter-programs";
import { POSTE_STARTER_PROGRAMS } from "../constants/oza-starter-programs-postes";
import { SPECIALITE_STARTER_PROGRAMS } from "../constants/oza-starter-programs-specialites";
import { SPORT_STARTER_PROGRAMS } from "../constants/oza-starter-programs-sports";
import { uploadExercisePhoto } from "./exercises";
import { Programme, Seance, cloneSeance } from "./programmes";

const STARTER_PROGRAMS = [...RUGBY_STARTER_PROGRAMS, ...SPORT_STARTER_PROGRAMS, ...POSTE_STARTER_PROGRAMS, ...SPECIALITE_STARTER_PROGRAMS];

// ── Types ──

// Une semaine d'un cycle : un thème, des consignes générales, des séances.
export type OzaWeek = {
  numero: number;
  theme: string;
  consignes: string;
  seances: Seance[];
};

export type OzaProgram = {
  id: string;
  sportId: string;
  positionId: string | null;
  nom: string;
  objectif: string;
  publicCible: string;
  dureeSemaines: number;
  seancesParSemaine: number;
  niveau: OzaNiveau;
  materiel: string[];
  // Répartition des qualités physiques (en %), à renseigner par l'auteur.
  qualites: { nom: string; pct: number }[];
  semaines: OzaWeek[];
  statut: "brouillon" | "publie";
  version: number;
};

// Progression d'un utilisateur dans un programme.
export type OzaProgress = {
  startedAt: number;
  lastOpenedAt: number;
  // Où reprendre : semaine et séance en cours.
  currentWeek: number;
  currentSeanceId: string | null;
  // Séances terminées, clé "semaine:seanceId".
  done: string[];
};

export type OzaUserState = {
  favorites: string[];
  progress: Record<string, OzaProgress>;
};

// L'administrateur OZA : seul compte qui publie des programmes (les règles
// Firestore font la même vérification côté serveur).
export const OZA_ADMIN_EMAIL = "coaching.oza@gmail.com";
export function isOzaAdmin(email: string | null | undefined): boolean {
  return !!email && email.toLowerCase() === OZA_ADMIN_EMAIL;
}

// ── Sports ──

// Firestore d'abord (gestion dynamique des contenus) ; le catalogue par défaut
// prend le relais tant que la collection est vide ou illisible.
export async function getOzaSports(): Promise<OzaSport[]> {
  let fromDb: OzaSport[] = [];
  try {
    const snap = await getDocs(collection(db, "ozaSports"));
    fromDb = snap.docs.map((d) => ({ ...(d.data() as Omit<OzaSport, "id">), id: d.id }));
  } catch {
    // règles pas encore publiées, hors-ligne… on retombe sur le catalogue
  }
  // Union : une fiche Firestore remplace le sport du catalogue de même id
  // (ou le masque avec actif: false) ; les sports ajoutés au catalogue
  // apparaissent sans avoir à les recopier dans Firebase.
  const byId = new Map<string, OzaSport>(DEFAULT_OZA_SPORTS.map((s) => [s.id, s]));
  for (const s of fromDb) byId.set(s.id, s);
  return Array.from(byId.values())
    .filter((s) => s.actif !== false)
    .sort((a, b) => a.ordre - b.ordre);
}

export async function getOzaSport(sportId: string): Promise<OzaSport | null> {
  const sports = await getOzaSports();
  return sports.find((s) => s.id === sportId) ?? null;
}

// Enregistre le catalogue par défaut dans Firestore (administrateur) : il
// devient alors modifiable sans toucher au code.
export async function seedDefaultOzaSports(): Promise<number> {
  for (const sport of DEFAULT_OZA_SPORTS) {
    const { id, ...data } = sport;
    await setDoc(doc(db, "ozaSports", id), data);
  }
  return DEFAULT_OZA_SPORTS.length;
}

// ── Programmes ──

function toProgram(id: string, d: Record<string, any>): OzaProgram {
  return {
    id,
    sportId: d.sportId,
    positionId: d.positionId ?? null,
    nom: d.nom ?? "",
    objectif: d.objectif ?? "",
    publicCible: d.publicCible ?? "",
    dureeSemaines: d.dureeSemaines ?? (d.semaines?.length ?? 0),
    seancesParSemaine: d.seancesParSemaine ?? 0,
    niveau: d.niveau ?? "intermediaire",
    materiel: d.materiel ?? [],
    qualites: d.qualites ?? [],
    semaines: d.semaines ?? [],
    statut: d.statut === "publie" ? "publie" : "brouillon",
    version: d.version ?? 1,
  };
}

// Les règles n'autorisent que des lectures filtrées sur statut == "publie".
export async function getOzaProgramsForSport(sportId: string): Promise<OzaProgram[]> {
  const snap = await getDocs(
    query(collection(db, "ozaPrograms"), where("sportId", "==", sportId), where("statut", "==", "publie"))
  );
  return snap.docs.map((d) => toProgram(d.id, d.data())).sort((a, b) => a.nom.localeCompare(b.nom));
}

// Administrateur : liste aussi les brouillons (les règles n'autorisent cette
// lecture non filtrée qu'à l'admin).
export async function getOzaProgramsForSportAdmin(sportId: string): Promise<OzaProgram[]> {
  const snap = await getDocs(query(collection(db, "ozaPrograms"), where("sportId", "==", sportId)));
  return snap.docs.map((d) => toProgram(d.id, d.data())).sort((a, b) => a.nom.localeCompare(b.nom));
}

export async function setOzaProgramStatut(programId: string, statut: "brouillon" | "publie"): Promise<void> {
  await setDoc(doc(db, "ozaPrograms", programId), { statut, updatedAt: new Date() }, { merge: true });
}

// Importe les programmes de démarrage en BROUILLON. Un programme déjà PUBLIÉ
// n'est jamais touché ; un brouillon existant est mis à jour avec la dernière
// version du générateur (version incrémentée). Retourne les compteurs.
export async function seedStarterPrograms(): Promise<{ added: number; updated: number; skipped: number }> {
  const res = { added: 0, updated: 0, skipped: 0 };
  for (const sp of STARTER_PROGRAMS) {
    const ref = doc(db, "ozaPrograms", sp.id);
    const existing = await getDoc(ref);
    if (existing.exists() && existing.data().statut === "publie") {
      res.skipped++;
      continue;
    }
    const { id: _id, ...data } = sp;
    await setDoc(ref, {
      ...JSON.parse(JSON.stringify(data)),
      dureeSemaines: sp.semaines.length,
      statut: "brouillon",
      version: (existing.exists() ? (existing.data().version ?? 0) : 0) + 1,
      updatedAt: new Date(),
    });
    if (existing.exists()) res.updated++;
    else res.added++;
  }
  return res;
}

export async function getOzaProgram(programId: string): Promise<OzaProgram | null> {
  const snap = await getDoc(doc(db, "ozaPrograms", programId));
  return snap.exists() ? toProgram(snap.id, snap.data()) : null;
}

// Programmes favoris de l'utilisateur (un lot de lectures par id, plafonné).
export async function getOzaProgramsByIds(ids: string[]): Promise<OzaProgram[]> {
  const list = await Promise.all(ids.slice(0, 20).map((id) => getOzaProgram(id).catch(() => null)));
  return list.filter((p): p is OzaProgram => p !== null && p.statut === "publie");
}

// Publie (ou met à jour) un programme construit dans l'éditeur du coach.
// Les séances de l'éditeur sont réparties en semaines de `seancesParSemaine`.
export async function publishProgrammeToOza(
  programme: Programme,
  meta: Omit<OzaProgram, "id" | "semaines" | "nom" | "dureeSemaines" | "version"> & { nom?: string },
  existingId?: string
): Promise<string> {
  const perWeek = Math.max(1, meta.seancesParSemaine || 1);
  const semaines: OzaWeek[] = [];
  for (let i = 0; i < programme.seances.length; i += perWeek) {
    semaines.push({
      numero: semaines.length + 1,
      theme: "",
      consignes: "",
      seances: programme.seances.slice(i, i + perWeek).map((se) => cloneSeance(se, se.nom)),
    });
  }
  const ref = existingId ? doc(db, "ozaPrograms", existingId) : doc(collection(db, "ozaPrograms"));
  const prev = existingId ? await getDoc(ref) : null;
  await setDoc(ref, {
    ...meta,
    nom: meta.nom?.trim() || programme.nom,
    dureeSemaines: semaines.length,
    // JSON aller-retour : Firestore refuse les champs `undefined`.
    semaines: JSON.parse(JSON.stringify(semaines)),
    version: (prev?.exists() ? (prev.data().version ?? 0) : 0) + 1,
    updatedAt: new Date(),
  });
  return ref.id;
}

// ── État utilisateur : favoris et progression ──

const EMPTY_STATE: OzaUserState = { favorites: [], progress: {} };

export async function getOzaUserState(uid: string): Promise<OzaUserState> {
  try {
    const snap = await getDoc(doc(db, "ozaUserState", uid));
    if (!snap.exists()) return EMPTY_STATE;
    const d = snap.data();
    return { favorites: d.favorites ?? [], progress: d.progress ?? {} };
  } catch {
    return EMPTY_STATE;
  }
}

async function saveState(uid: string, state: OzaUserState): Promise<void> {
  await setDoc(doc(db, "ozaUserState", uid), state);
}

export async function toggleOzaFavorite(uid: string, programId: string): Promise<OzaUserState> {
  const state = await getOzaUserState(uid);
  const favorites = state.favorites.includes(programId)
    ? state.favorites.filter((f) => f !== programId)
    : [programId, ...state.favorites];
  const next = { ...state, favorites };
  await saveState(uid, next);
  return next;
}

export function seanceKey(week: number, seanceId: string): string {
  return `${week}:${seanceId}`;
}

// Démarre (ou reprend) un programme : crée la progression si besoin.
export async function startOzaProgram(uid: string, program: OzaProgram): Promise<OzaUserState> {
  const state = await getOzaUserState(uid);
  const existing = state.progress[program.id];
  const first = program.semaines[0]?.seances[0]?.id ?? null;
  const progress: OzaProgress = existing
    ? { ...existing, lastOpenedAt: Date.now() }
    : { startedAt: Date.now(), lastOpenedAt: Date.now(), currentWeek: 1, currentSeanceId: first, done: [] };
  const next = { ...state, progress: { ...state.progress, [program.id]: progress } };
  await saveState(uid, next);
  return next;
}

// Marque une séance terminée et avance le point de reprise à la suivante.
export async function completeOzaSeance(
  uid: string,
  program: OzaProgram,
  week: number,
  seanceId: string
): Promise<OzaUserState> {
  const state = await getOzaUserState(uid);
  const prev = state.progress[program.id];
  const done = Array.from(new Set([...(prev?.done ?? []), seanceKey(week, seanceId)]));
  const flat = program.semaines.flatMap((w) => w.seances.map((se) => ({ week: w.numero, id: se.id })));
  const next = flat.find((x) => !done.includes(seanceKey(x.week, x.id)));
  const progress: OzaProgress = {
    startedAt: prev?.startedAt ?? Date.now(),
    lastOpenedAt: Date.now(),
    currentWeek: next?.week ?? week,
    currentSeanceId: next?.id ?? null,
    done,
  };
  const out = { ...state, progress: { ...state.progress, [program.id]: progress } };
  await saveState(uid, out);
  return out;
}

export function programProgress(program: OzaProgram, progress: OzaProgress | undefined): number {
  const total = program.semaines.reduce((n, w) => n + w.seances.length, 0);
  if (total === 0 || !progress) return 0;
  return Math.min(1, progress.done.length / total);
}

// Administrateur : retire un programme de la bibliothèque (irréversible).
export async function deleteOzaProgram(programId: string): Promise<void> {
  await deleteDoc(doc(db, "ozaPrograms", programId));
}

// Efface la progression de l'utilisateur dans un programme (repart de zéro) ;
// le favori est conservé.
export async function resetOzaProgress(uid: string, programId: string): Promise<OzaUserState> {
  const state = await getOzaUserState(uid);
  const progress = { ...state.progress };
  delete progress[programId];
  const next = { ...state, progress };
  await saveState(uid, next);
  return next;
}

// Administrateur : met une photo d'action en tête d'un sport. La photo est
// envoyée dans le stockage existant, puis la fiche du sport (catalogue par
// défaut incluse) est enregistrée dans Firestore avec son `heroImage`.
export async function setOzaSportHeroImage(uid: string, sport: OzaSport, localUri: string): Promise<OzaSport> {
  const url = await uploadExercisePhoto(uid, `oza-sport-${sport.id}`, localUri);
  const next: OzaSport = { ...sport, heroImage: url };
  const { id, ...data } = next;
  await setDoc(doc(db, "ozaSports", id), JSON.parse(JSON.stringify(data)));
  return next;
}

export async function clearOzaSportHeroImage(sport: OzaSport): Promise<OzaSport> {
  const next: OzaSport = { ...sport, heroImage: null };
  const { id, ...data } = next;
  await setDoc(doc(db, "ozaSports", id), JSON.parse(JSON.stringify(data)));
  return next;
}
