import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";

import { db } from "../firebase";

export type Review = {
  id: string;
  coachId: string;
  sportifId: string;
  sportifName: string;
  rating: number;
  comment: string;
  createdAt: unknown;
};

function reviewId(coachId: string, sportifId: string): string {
  return `${coachId}_${sportifId}`;
}

// Un seul avis par sportif et par coach : ré-envoyer met à jour l'avis existant
// plutôt que d'en créer un doublon.
export async function addReview(
  coachId: string,
  sportifId: string,
  sportifName: string,
  rating: number,
  comment: string
): Promise<void> {
  await setDoc(doc(db, "reviews", reviewId(coachId, sportifId)), {
    coachId,
    sportifId,
    sportifName,
    rating,
    comment,
    createdAt: new Date(),
  });
}

export async function getMyReview(coachId: string, sportifId: string): Promise<Review | null> {
  const snap = await getDoc(doc(db, "reviews", reviewId(coachId, sportifId)));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Review, "id">) };
}

export async function getReviewsForCoach(coachId: string): Promise<Review[]> {
  const q = query(collection(db, "reviews"), where("coachId", "==", coachId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));
}

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
