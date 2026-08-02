import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

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

export async function addReview(
  coachId: string,
  sportifId: string,
  sportifName: string,
  rating: number,
  comment: string
): Promise<void> {
  await addDoc(collection(db, "reviews"), {
    coachId,
    sportifId,
    sportifName,
    rating,
    comment,
    createdAt: new Date(),
  });
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
