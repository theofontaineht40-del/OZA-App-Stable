import assert from "node:assert/strict";
import { test } from "node:test";

import type { MuscleGroup } from "../constants/muscle-groups";
import { computeMuscleRecovery, daysBetween, daysLabel, stateFor } from "./muscle-recovery";

const resolve = (name: string): MuscleGroup[] =>
  ({ Squat: ["quadriceps", "glutes"], "Développé couché": ["chest", "triceps"] } as Record<string, MuscleGroup[]>)[name] ?? [];

const log = (exerciceNom: string, seriesReelles = "3", complete = true) => ({ exerciceNom, seriesReelles, complete });

test("jours entre deux dates, mois et années compris", () => {
  assert.equal(daysBetween("2026-11-20", "2026-11-22"), 2);
  assert.equal(daysBetween("2026-10-30", "2026-11-02"), 3);
  assert.equal(daysBetween("2025-12-31", "2026-01-01"), 1);
});

test("états selon les jours écoulés", () => {
  assert.equal(stateFor(0), "sollicite");
  assert.equal(stateFor(1), "sollicite");
  assert.equal(stateFor(2), "recuperation");
  assert.equal(stateFor(3), "frais");
  assert.equal(stateFor(14), "frais");
  assert.equal(stateFor(15), "oublie");
  assert.equal(stateFor(null), "oublie");
});

test("chaque muscle prend la date de sa dernière séance", () => {
  const res = computeMuscleRecovery(
    [
      { date: "2026-11-15", exerciseLogs: [log("Squat")] },
      { date: "2026-11-20", exerciseLogs: [log("Développé couché")] },
    ],
    resolve,
    "2026-11-22",
  );
  const by = Object.fromEntries(res.map((r) => [r.group, r]));
  assert.equal(by.chest.daysSince, 2);
  assert.equal(by.chest.state, "recuperation");
  assert.equal(by.quadriceps.daysSince, 7);
  assert.equal(by.quadriceps.state, "frais");
  assert.equal(by.glutes.lastDate, "2026-11-15");
  // Le plus récemment travaillé vient en premier.
  assert.equal(res[0].daysSince, 2);
});

test("un exercice seulement prévu (aucune série faite) ne compte pas", () => {
  const res = computeMuscleRecovery([{ date: "2026-11-21", exerciseLogs: [log("Squat", "0", false)] }], resolve, "2026-11-22");
  assert.equal(res.length, 0);
});

test("exercice inconnu, séance sans exercices et séance future sont ignorés", () => {
  const res = computeMuscleRecovery(
    [
      { date: "2026-11-21", exerciseLogs: [log("Exercice inventé")] },
      { date: "2026-11-21", exerciseLogs: null },
      { date: "2026-11-25", exerciseLogs: [log("Squat")] },
    ],
    resolve,
    "2026-11-22",
  );
  assert.equal(res.length, 0);
});

test("séances des 14 derniers jours comptées une fois par jour", () => {
  const res = computeMuscleRecovery(
    [
      { date: "2026-11-20", exerciseLogs: [log("Squat"), log("Squat")] },
      { date: "2026-11-18", exerciseLogs: [log("Squat")] },
      { date: "2026-10-01", exerciseLogs: [log("Squat")] },
    ],
    resolve,
    "2026-11-22",
  );
  assert.equal(res.find((r) => r.group === "quadriceps")!.sessions14, 2);
});

test("libellés de durée", () => {
  assert.equal(daysLabel(0), "aujourd'hui");
  assert.equal(daysLabel(1), "hier");
  assert.equal(daysLabel(4), "il y a 4 j");
});
