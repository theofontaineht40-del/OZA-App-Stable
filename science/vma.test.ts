import assert from "node:assert/strict";
import { test } from "node:test";

import { distanceForDuration, formatMinSec, intermittentDistances, pctForTime, secondsPerKm, speedAtPct, timeForDistance } from "./engine/vma";

// Valeurs de contrôle tirées du tableur du coach (VMA de référence 14,75 km/h).
const VMA = 14.75;

test("vitesse à un pourcentage de VMA (cellule U7 du tableur : 16 km/h à 75 % = 12 km/h)", () => {
  assert.equal(speedAtPct(16, 75), 12);
});

test("distance sur une durée : 45 s à 100 % = 184 m (10 × 45\"/15\")", () => {
  assert.equal(Math.round(distanceForDuration(VMA, 100, 45)), 184);
});

test("temps sur une distance : 300 m à 98 % = 1 min 15, 400 m à 98 % = 1 min 40", () => {
  assert.equal(formatMinSec(timeForDistance(VMA, 98, 300)), "1 min 15");
  assert.equal(formatMinSec(timeForDistance(VMA, 98, 400)), "1 min 40");
});

test("temps sur une distance : 500 m à 95 % = 2 min 08, 600 m à 95 % = 2 min 34", () => {
  assert.equal(formatMinSec(timeForDistance(VMA, 95, 500)), "2 min 08");
  assert.equal(formatMinSec(timeForDistance(VMA, 95, 600)), "2 min 34");
});

test("tableau de gauche du tableur : 2 300 m à 90 % de VMA 13 km/h ≈ 11 min 48", () => {
  // Le tableur tronque les secondes (INT : 11 min 47) ; ici on arrondit à la seconde la plus proche.
  const t = timeForDistance(13, 90, 2300);
  assert.equal(Math.floor(t), 707);
  assert.equal(formatMinSec(t), "11 min 48");
});

test("pourcentage de VMA déduit d'un temps (réciproque)", () => {
  assert.ok(Math.abs(pctForTime(VMA, 300, timeForDistance(VMA, 98, 300)) - 98) < 1e-9);
});

test("30\"/30\" : environ 130 m rapides et 65 m lents autour de la VMA du tableur", () => {
  const d = intermittentDistances(VMA, { fastSeconds: 30, fastPct: 105, slowSeconds: 30, slowPct: 50 });
  assert.ok(Math.abs(d.fastMeters - 129) < 2);
  assert.ok(Math.abs(d.slowMeters - 61.5) < 4);
});

test("temps au kilomètre et mise en forme", () => {
  assert.equal(formatMinSec(secondsPerKm(15, 100)), "4 min");
  assert.equal(formatMinSec(45), "45 s");
});
