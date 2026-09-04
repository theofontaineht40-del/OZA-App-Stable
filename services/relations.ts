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

import { Specialite } from "../constants/specialites";
import { db } from "../firebase";

export type RelationType = "principal" | "specialiste";

export type Relation = {
  id: string;
  sportifId: string;
  sportifFirstName: string;
  sportifLastName: string;
  coachId: string;
  coachFirstName: string;
  coachLastName: string;
  type: RelationType;
  specialite: Specialite | null;
  createdAt: unknown;
};

function relationId(sportifId: string, coachId: string): string {
  return `${sportifId}_${coachId}`;
}

// Compat : avant l'introduction de la collection `relations`, le lien
// sportif → coach principal n'existait que via `users.coachId`. On le
// migre paresseusement en relation "principal" dès qu'on en a besoin.
async function migrateLegacyPrincipal(sportifId: string): Promise<Relation | null> {
  const userSnap = await getDoc(doc(db, "users", sportifId));
  if (!userSnap.exists()) return null;
  const data = userSnap.data();
  if (!data.coachId) return null;

  const id = relationId(sportifId, data.coachId);
  const relation: Omit<Relation, "id"> = {
    sportifId,
    sportifFirstName: data.firstName ?? "",
    sportifLastName: data.lastName ?? "",
    coachId: data.coachId,
    coachFirstName: data.coachFirstName ?? "",
    coachLastName: data.coachLastName ?? "",
    type: "principal",
    specialite: null,
    createdAt: new Date(),
  };
  await setDoc(doc(db, "relations", id), relation);
  return { id, ...relation };
}

export async function getRelation(sportifId: string, coachId: string): Promise<Relation | null> {
  const snap = await getDoc(doc(db, "relations", relationId(sportifId, coachId)));
  if (snap.exists()) return { id: snap.id, ...(snap.data() as Omit<Relation, "id">) };

  const userSnap = await getDoc(doc(db, "users", sportifId));
  if (userSnap.exists() && userSnap.data().coachId === coachId) {
    return migrateLegacyPrincipal(sportifId);
  }
  return null;
}

export async function getRelationsForSportif(sportifId: string): Promise<Relation[]> {
  const q = query(collection(db, "relations"), where("sportifId", "==", sportifId));
  const snap = await getDocs(q);
  const relations = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Relation, "id">) }));

  if (!relations.some((r) => r.type === "principal")) {
    const migrated = await migrateLegacyPrincipal(sportifId);
    if (migrated) relations.unshift(migrated);
  }

  return relations;
}

export async function getRelationsForCoach(coachId: string): Promise<Relation[]> {
  const q = query(collection(db, "relations"), where("coachId", "==", coachId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Relation, "id">) }));
}

// Définit (ou remplace) le coach principal du sportif. L'éventuel ancien
// principal perd l'accès de suivi, mais tout son historique (séances,
// programmes déjà créés...) reste intact ailleurs dans la base.
export async function setPrincipalCoach(
  sportifId: string,
  sportifFirstName: string,
  sportifLastName: string,
  coachId: string,
  coachFirstName: string,
  coachLastName: string
): Promise<void> {
  const existing = await getRelationsForSportif(sportifId);
  const previousPrincipal = existing.find(
    (r) => r.type === "principal" && r.coachId !== coachId
  );
  if (previousPrincipal) {
    await deleteDoc(doc(db, "relations", previousPrincipal.id));
  }

  await setDoc(doc(db, "relations", relationId(sportifId, coachId)), {
    sportifId,
    sportifFirstName,
    sportifLastName,
    coachId,
    coachFirstName,
    coachLastName,
    type: "principal",
    specialite: null,
    createdAt: new Date(),
  });

  await setDoc(
    doc(db, "users", sportifId),
    { coachId, coachFirstName, coachLastName },
    { merge: true }
  );
}

// Crée un profil sportif directement depuis l'espace coach, sans compte ni
// mot de passe — pour un client qui n'utilisera jamais l'app lui-même (ex.
// public senior peu à l'aise avec le smartphone). Le coach saisit tout à sa
// place (séances via app/coach/sportif/[id]/nouvelle-seance.tsx, bilans...).
// `users/{id}` est créé en premier, la relation "principal" ensuite : les
// règles Firestore de la relation vérifient que le sportif référencé est
// déjà marqué `managed: true` avec ce coach comme propriétaire.
export async function createManagedSportif(
  coachId: string,
  coachFirstName: string,
  coachLastName: string,
  firstName: string,
  lastName: string
): Promise<string> {
  const userRef = doc(collection(db, "users"));
  await setDoc(userRef, {
    firstName,
    lastName,
    role: "sportif",
    coachId,
    coachFirstName,
    coachLastName,
    managed: true,
    createdAt: new Date(),
  });

  await setDoc(doc(db, "relations", relationId(userRef.id, coachId)), {
    sportifId: userRef.id,
    sportifFirstName: firstName,
    sportifLastName: lastName,
    coachId,
    coachFirstName,
    coachLastName,
    type: "principal",
    specialite: null,
    createdAt: new Date(),
  });

  return userRef.id;
}

export async function addSpecialiste(
  sportifId: string,
  sportifFirstName: string,
  sportifLastName: string,
  coachId: string,
  coachFirstName: string,
  coachLastName: string,
  specialite: Specialite
): Promise<void> {
  await setDoc(doc(db, "relations", relationId(sportifId, coachId)), {
    sportifId,
    sportifFirstName,
    sportifLastName,
    coachId,
    coachFirstName,
    coachLastName,
    type: "specialiste",
    specialite,
    createdAt: new Date(),
  });
}

export async function removeRelation(sportifId: string, coachId: string): Promise<void> {
  await deleteDoc(doc(db, "relations", relationId(sportifId, coachId)));
}
