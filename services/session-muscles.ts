import { NamedExercise } from "../constants/exercise-muscles";
import { Seance } from "./programmes";
import { SessionRecord } from "./tracking";

// "Prochaine séance" = la première séance du programme dont le nom n'apparaît
// pas encore dans l'historique loggé pour ce programme ; si tout a déjà été
// fait, on reboucle sur la première séance (nouveau cycle).
export function getNextSeance(
  programme: { id: string; seances: Seance[] } | null,
  sessions: SessionRecord[]
): Seance | null {
  if (!programme || programme.seances.length === 0) return null;
  const doneNames = new Set(
    sessions.filter((s) => s.programmeId === programme.id).map((s) => s.seanceNom)
  );
  const next = programme.seances.find((s) => !doneNames.has(s.nom));
  return next ?? programme.seances[0];
}

// Liste à plat des exercices d'une séance (tous blocs confondus, nom +
// identifiant catalogue) — c'est cette liste que MuscleMap résout ensuite
// en muscles actifs (voir constants/exercise-muscles.ts). Aucune notion de
// type de séance ("legs"/"push"/...) ici : uniquement les exercices
// réellement présents.
export function getSeanceExerciseNames(seance: Seance | null): NamedExercise[] {
  if (!seance) return [];
  return seance.blocs.flatMap((bloc) =>
    bloc.exercices.map((ex) => ({ name: ex.exerciceNom, id: ex.exerciceId }))
  );
}
