import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase";
import { OzaNiveau } from "../constants/oza-sports";
import { MaterielKey, ObjectifKey } from "../constants/onboarding";

// Profil sportif rempli via le questionnaire d'accueil. Chaque champ est
// optionnel : l'utilisateur peut passer une question et compléter plus tard.
export type AthleteProfile = {
  sportId: string | null;
  positionId: string | null;
  niveau: OzaNiveau | null;
  objectif: ObjectifKey | null;
  seancesParSemaine: number | null;
  dureeMinutes: number | null;
  materiel: MaterielKey[];
  // null = non renseigné ; "" = aucune blessure ni limitation déclarée.
  limitations: string | null;
  // true une fois le questionnaire parcouru jusqu'au bout.
  completed: boolean;
  // Consentement au mini-coach IA (date) ; null/absent = pas activé.
  aiConsentAt?: number | null;
  updatedAt?: number;
};

export const EMPTY_ATHLETE_PROFILE: AthleteProfile = {
  sportId: null,
  positionId: null,
  niveau: null,
  objectif: null,
  seancesParSemaine: null,
  dureeMinutes: null,
  materiel: [],
  limitations: null,
  completed: false,
};

// Collection dédiée (et non le document `users`, lisible par tout compte
// connecté) : le profil contient des limitations physiques.
export async function getAthleteProfile(uid: string): Promise<AthleteProfile | null> {
  const snap = await getDoc(doc(db, "sportProfiles", uid));
  if (!snap.exists()) return null;
  return { ...EMPTY_ATHLETE_PROFILE, ...(snap.data() as Partial<AthleteProfile>) };
}

export async function saveAthleteProfile(uid: string, profile: AthleteProfile): Promise<void> {
  // merge : la modification du questionnaire ne doit pas effacer le consentement IA.
  await setDoc(doc(db, "sportProfiles", uid), { ...profile, updatedAt: Date.now() }, { merge: true });
}

export async function deleteAthleteProfile(uid: string): Promise<void> {
  await deleteDoc(doc(db, "sportProfiles", uid));
}

// Faut-il proposer le questionnaire ? Oui tant qu'aucun sport n'est choisi
// et que l'utilisateur ne l'a pas explicitement écarté (document existant).
export function needsOnboarding(profile: AthleteProfile | null): boolean {
  return profile === null;
}
