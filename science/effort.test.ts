import assert from "node:assert/strict";
import { test } from "node:test";

import { RULES, SOURCES } from "./data";
import { effortParameters, targetOf } from "./engine/effort";
import { usableRules } from "./repository";
import { ScienceRule } from "./types";

// Pour les tests, on simule une relecture du coach sur les règles de coach
// existantes. Ce n'est PAS une validation réelle : rien n'est écrit sur disque.
const asValidated = (rules: ScienceRule[]): ScienceRule[] =>
  rules.map((r) => ({ ...r, status: "valide" as const, validatedBy: "Test", validatedAt: "2026-11-21" }));

const coachB = RULES.filter((r) => r.id.startsWith("B-coach-"));

test("sans règle validée, le moteur ne renvoie aucune valeur et signale tous les manques", () => {
  const res = effortParameters(usableRules(RULES, SOURCES), { quality: "masse" });
  // Tant que le coach n'a rien validé, aucune valeur ne doit sortir.
  const validated = RULES.filter((r) => r.status === "valide").length;
  if (validated === 0) {
    assert.deepEqual(res.values, {});
    assert.equal(res.gaps.length, 6);
    assert.equal(res.rulesUsed.length, 0);
  }
});

test("avec les règles de coach validées, la masse reprend la fourchette du coach et trace chaque règle", () => {
  const res = effortParameters(usableRules(asValidated(coachB), SOURCES), { quality: "masse" });
  assert.equal(res.values.series?.range.min, 2);
  assert.equal(res.values.series?.range.max, 4);
  assert.equal(res.values.series?.target, 3);
  assert.equal(res.values.repetitions?.target, 8);
  assert.equal(res.values.intensite?.range.max, 80);
  assert.equal(res.values.rpe?.range.min, 9);
  assert.equal(res.gaps.length, 0);
  assert.ok(res.rulesUsed.every((u) => u.ruleId.startsWith("B-coach-masse-")));
  assert.equal(res.rulesUsed.length, 6);
});

test("un paramètre sans règle est un manque, jamais une valeur inventée", () => {
  // La puissance n'a pas de TSTT ni de RPE dans les règles de coach.
  const res = effortParameters(usableRules(asValidated(coachB), SOURCES), { quality: "puissance" });
  assert.ok(res.gaps.includes("tstt"));
  assert.ok(res.gaps.includes("rpe"));
  assert.equal(res.values.tstt, undefined);
  assert.equal(res.values.series?.range.min, 4);
});

test("une qualité inconnue ne produit rien", () => {
  const res = effortParameters(usableRules(asValidated(coachB), SOURCES), { quality: "qualite-inventee" });
  assert.deepEqual(res.values, {});
  assert.equal(res.gaps.length, 6);
});

test("une règle refusée ou en brouillon n'est jamais utilisée", () => {
  const mixed: ScienceRule[] = asValidated(coachB).map((r) =>
    r.id === "B-coach-masse-series" ? { ...r, status: "refuse" as const } : r.id === "B-coach-masse-repos" ? { ...r, status: "brouillon" as const } : r,
  );
  const res = effortParameters(usableRules(mixed, SOURCES), { quality: "masse" });
  assert.ok(res.gaps.includes("series"));
  assert.ok(res.gaps.includes("repos"));
  assert.equal(res.values.repetitions?.target, 8);
});

test("targetOf : recommandée, sinon milieu, sinon la seule borne", () => {
  assert.equal(targetOf({ min: 1, recommended: 3, max: 5 }), 3);
  assert.equal(targetOf({ min: 6, recommended: null, max: 10 }), 8);
  assert.equal(targetOf({ min: 15, recommended: null, max: null }), 15);
  assert.equal(targetOf({ min: null, recommended: null, max: 7 }), 7);
  assert.equal(targetOf({ min: null, recommended: null, max: null }), null);
});
