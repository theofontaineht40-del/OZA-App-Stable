import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

import { db } from "../firebase";
import { TestCategory } from "../constants/test-types";
import { todayKey } from "./load";

export type TestResult = {
  id: string;
  category: TestCategory;
  testKey: string;
  date: string;
  value: number | null;
  valueLeft: number | null;
  valueRight: number | null;
  notes: string;
};

export async function addTestResult(
  sportifId: string,
  entry: Omit<TestResult, "id" | "date">
): Promise<void> {
  await addDoc(collection(db, "testResults", sportifId, "entries"), {
    ...entry,
    date: todayKey(),
    createdAt: new Date(),
  });
}

export async function getTestResults(
  sportifId: string,
  category: TestCategory
): Promise<TestResult[]> {
  const q = query(
    collection(db, "testResults", sportifId, "entries"),
    where("category", "==", category)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<TestResult, "id">) }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
