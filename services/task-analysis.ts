import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "../firebase";
import { getSport, QUALITES, QualiteKey, SportRadar } from "../constants/sports-radar";

export type TaskAnalysis = {
  sportKey: string | null;
  sportRadar: SportRadar | null;
  athleteRadar: SportRadar | null;
};

export async function getTaskAnalysis(sportifId: string): Promise<TaskAnalysis> {
  const snap = await getDoc(doc(db, "taskAnalysis", sportifId));
  if (!snap.exists()) {
    return { sportKey: null, sportRadar: null, athleteRadar: null };
  }
  const data = snap.data();
  return {
    sportKey: data.sportKey ?? null,
    sportRadar: data.sportRadar ?? null,
    athleteRadar: data.athleteRadar ?? null,
  };
}

export async function saveTaskAnalysis(
  sportifId: string,
  analysis: TaskAnalysis
): Promise<void> {
  await setDoc(doc(db, "taskAnalysis", sportifId), {
    ...analysis,
    updatedAt: new Date(),
  });
}

export type PriorityLevel = "1" | "2" | "3" | "none";

export type QualityGap = {
  key: QualiteKey;
  label: string;
  sportValue: number;
  athleteValue: number;
  ecart: number;
  priority: PriorityLevel;
  explanation: string;
};

export function priorityForGap(ecart: number): PriorityLevel {
  if (ecart >= 4) return "1";
  if (ecart >= 2) return "2";
  if (ecart > 0) return "3";
  return "none";
}

// Compare le radar du sport à celui de l'athlète et classe les écarts par priorité.
// Règle déterministe (pas d'invention) : écart = exigence du sport - niveau de l'athlète.
export function compareRadars(
  sportKey: string,
  sportRadar: SportRadar,
  athleteRadar: SportRadar
): QualityGap[] {
  const sport = getSport(sportKey);
  const sportLabel = sport?.label ?? sportKey;

  return QUALITES.map((q) => {
    const sportValue = sportRadar[q.key] ?? 0;
    const athleteValue = athleteRadar[q.key] ?? 0;
    const ecart = sportValue - athleteValue;
    const priority = priorityForGap(ecart);

    let explanation = "";
    if (priority === "none") {
      explanation = `Niveau suffisant par rapport aux exigences du ${sportLabel}.`;
    } else {
      explanation = `${sportLabel} exige ${sportValue}/10 en ${q.label.toLowerCase()}, l'athlète est à ${athleteValue}/10 → écart de ${ecart} point${ecart > 1 ? "s" : ""}.`;
    }

    return {
      key: q.key,
      label: q.label,
      sportValue,
      athleteValue,
      ecart,
      priority,
      explanation,
    };
  }).sort((a, b) => b.ecart - a.ecart);
}
