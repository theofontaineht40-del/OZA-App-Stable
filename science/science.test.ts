import assert from "node:assert/strict";
import { test } from "node:test";

import { RULES, SOURCES } from "./data";
import { findRules, mostSpecific, resolveRange, usableRules } from "./repository";
import { ScienceRule, ScienceSource } from "./types";
import { validateAll, validateRule, validateSource } from "./validate";

// Données de TEST uniquement (valeurs sans signification scientifique) : elles
// servent à vérifier les contrôles, pas à prescrire quoi que ce soit.
const src = (over: Partial<ScienceSource> = {}): ScienceSource => ({
  id: "test-source",
  authors: "Test A",
  year: 2020,
  title: "Titre de test",
  journal: "Revue de test",
  doi: "10.1234/test.5678",
  studyType: "meta-analyse",
  population: "adultes de test",
  verified: true,
  verifiedAt: "2026-01-01",
  ...over,
});

const rule = (over: Partial<ScienceRule> = {}): ScienceRule => ({
  id: "A-test-regle",
  category: "A",
  parameter: "paramètre de test",
  unit: "unité",
  value: { min: 1, recommended: 2, max: 3 },
  sportIds: "*",
  target: { kind: "general", id: "test" },
  evidence: "modere",
  sourceIds: ["test-source"],
  limits: "limites de test",
  conditions: "conditions de test",
  status: "valide",
  version: 1,
  validatedBy: "Test",
  validatedAt: "2026-01-02",
  ...over,
});

const map = (...s: ScienceSource[]) => new Map(s.map((x) => [x.id, x]));

test("une règle complète et validée ne produit aucune erreur", () => {
  assert.deepEqual(validateRule(rule(), map(src())).errors, []);
});

test("une source sans DOI ni PMID est refusée", () => {
  const r = validateSource(src({ doi: undefined }));
  assert.ok(r.errors.some((e) => e.includes("DOI ou un PMID")));
});

test("un DOI mal formé est refusé", () => {
  assert.ok(validateSource(src({ doi: "pas-un-doi" })).errors.some((e) => e.includes("DOI mal formé")));
});

test("une règle validée ne peut pas citer une source non vérifiée", () => {
  const s = src({ verified: false, verifiedAt: undefined });
  assert.ok(validateRule(rule(), map(s)).errors.some((e) => e.includes("non vérifiée")));
});

test("une règle validée exige validateur et date", () => {
  const e = validateRule(rule({ validatedBy: undefined, validatedAt: undefined }), map(src())).errors;
  assert.ok(e.some((x) => x.includes("validateur")) && e.some((x) => x.includes("date")));
});

test("min ≤ recommandé ≤ max est contrôlé", () => {
  const e = validateRule(rule({ value: { min: 5, recommended: 2, max: 3 } }), map(src())).errors;
  assert.ok(e.some((x) => x.includes("min ≤ recommandé ≤ max")));
});

test("une règle sans aucune valeur est refusée", () => {
  const e = validateRule(rule({ value: { min: null, recommended: null, max: null } }), map(src())).errors;
  assert.ok(e.some((x) => x.includes("aucune valeur")));
});

test("l'id doit commencer par la catégorie", () => {
  assert.ok(validateRule(rule({ id: "B-test", category: "A" }), map(src())).errors.some((e) => e.includes("commencer par la catégorie")));
});

test("source inconnue et ids en double sont détectés", () => {
  assert.ok(validateRule(rule({ sourceIds: ["absente"] }), map(src())).errors.some((e) => e.includes("source inconnue")));
  const all = validateAll([rule(), rule()], [src()]);
  assert.ok(all.errors.some((e) => e.includes("id en double")));
});

test("preuve forte sans synthèse : simple avertissement", () => {
  const r = validateRule(rule({ evidence: "fort" }), map(src({ studyType: "essai-controle" })));
  assert.deepEqual(r.errors, []);
  assert.ok(r.warnings.some((w) => w.includes("preuve « forte »")));
});

test("le moteur ne voit que les règles valides aux sources vérifiées", () => {
  const ok = rule({ id: "A-ok" });
  const draft = rule({ id: "A-brouillon", status: "brouillon", validatedBy: undefined, validatedAt: undefined });
  const unverified = rule({ id: "A-non-verifiee", sourceIds: ["autre"] });
  const sources = [src(), src({ id: "autre", verified: false, verifiedAt: undefined })];
  assert.deepEqual(usableRules([ok, draft, unverified], sources).map((r) => r.id), ["A-ok"]);
});

test("recherche par sport, poste et cible", () => {
  const general = rule({ id: "A-general" });
  const rugby = rule({ id: "A-rugby", sportIds: ["rugby"] });
  const ailier = rule({ id: "A-ailier", sportIds: ["rugby"], positionIds: ["ailiers"] });
  const all = [general, rugby, ailier];
  assert.deepEqual(findRules(all, { sportId: "football" }).map((r) => r.id), ["A-general"]);
  assert.deepEqual(findRules(all, { sportId: "rugby" }).map((r) => r.id), ["A-general", "A-rugby"]);
  assert.deepEqual(findRules(all, { sportId: "rugby", positionId: "ailiers" }).map((r) => r.id), ["A-general", "A-rugby", "A-ailier"]);
  assert.equal(mostSpecific(all, "ailiers")?.id, "A-ailier");
});

test("la valeur d'un niveau prime sur la valeur générale", () => {
  const r = rule({ byLevel: { debutant: { min: 1, recommended: 1, max: 2 } } });
  assert.equal(resolveRange(r, "debutant").recommended, 1);
  assert.equal(resolveRange(r, "avance").recommended, 2);
});

test("le référentiel livré est cohérent", () => {
  const res = validateAll(RULES, SOURCES);
  assert.deepEqual(res.errors, []);
});
