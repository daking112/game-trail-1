import { test } from "node:test";
import assert from "node:assert/strict";
import { EnemyState, TargetingMode } from "@monsterfall/shared";
import { TargetableEnemy, selectTarget } from "./targeting";

function makeEnemy(overrides: Partial<EnemyState>): EnemyState {
  return {
    enemyInstanceId: "e",
    enemyId: "grunt",
    pathIndex: 0,
    pathProgress: 0,
    currentHealth: 100,
    maxHealth: 100,
    damage: 5,
    movementSpeed: 1,
    slowUntil: 0,
    slowPercent: 0,
    isBoss: false,
    ...overrides,
  };
}

function candidate(id: string, overrides: Partial<EnemyState>, distance: number): TargetableEnemy {
  return { enemy: makeEnemy({ enemyInstanceId: id, ...overrides }), position: { x: 0, y: 0 }, distance };
}

test("selectTarget returns null when there are no candidates", () => {
  assert.equal(selectTarget([], TargetingMode.Closest), null);
});

test("Closest picks the smallest distance", () => {
  const candidates = [candidate("far", {}, 5), candidate("near", {}, 1), candidate("mid", {}, 3)];
  assert.equal(selectTarget(candidates, TargetingMode.Closest)?.enemy.enemyInstanceId, "near");
});

test("Strongest picks the highest current health", () => {
  const candidates = [
    candidate("weak", { currentHealth: 10 }, 1),
    candidate("strong", { currentHealth: 90 }, 1),
    candidate("mid", { currentHealth: 50 }, 1),
  ];
  assert.equal(selectTarget(candidates, TargetingMode.Strongest)?.enemy.enemyInstanceId, "strong");
});

test("First picks the enemy furthest along the path", () => {
  const candidates = [
    candidate("behind", { pathIndex: 1, pathProgress: 0 }, 1),
    candidate("ahead", { pathIndex: 5, pathProgress: 0.5 }, 1),
  ];
  assert.equal(selectTarget(candidates, TargetingMode.First)?.enemy.enemyInstanceId, "ahead");
});

test("Last picks the enemy least far along the path", () => {
  const candidates = [
    candidate("behind", { pathIndex: 1, pathProgress: 0 }, 1),
    candidate("ahead", { pathIndex: 5, pathProgress: 0.5 }, 1),
  ];
  assert.equal(selectTarget(candidates, TargetingMode.Last)?.enemy.enemyInstanceId, "behind");
});
