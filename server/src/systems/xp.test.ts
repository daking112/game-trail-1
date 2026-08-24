import { test } from "node:test";
import assert from "node:assert/strict";
import { Element, MonsterDefinition, Rarity, xpToNextLevel } from "@monsterfall/shared";
import { applyXpGain, checkEvolutionEligibility } from "./xp";

test("applyXpGain accumulates xp without leveling up when below the threshold", () => {
  const result = applyXpGain({ level: 1, xp: 0 }, 5);
  assert.equal(result.level, 1);
  assert.equal(result.xp, 5);
});

test("applyXpGain levels up and carries the remainder forward", () => {
  const threshold = xpToNextLevel(1);
  const result = applyXpGain({ level: 1, xp: 0 }, threshold + 10);
  assert.equal(result.level, 2);
  assert.equal(result.xp, 10);
});

test("applyXpGain can cascade through multiple levels from one large reward", () => {
  const bigReward = xpToNextLevel(1) + xpToNextLevel(2) + xpToNextLevel(3) + 1;
  const result = applyXpGain({ level: 1, xp: 0 }, bigReward);
  assert.equal(result.level, 4);
  assert.equal(result.xp, 1);
});

function makeDef(overrides: Partial<MonsterDefinition> = {}): MonsterDefinition {
  return {
    id: "test",
    name: "Test",
    description: "",
    element: Element.Fire,
    rarity: Rarity.Common,
    baseHealth: 100,
    baseDamage: 10,
    attackSpeed: 1,
    range: 1,
    movementSpeed: 1,
    abilityId: "fireball",
    passiveDescription: "",
    ultimateChargePerAttack: 10,
    evolutions: [{ monsterId: "evolved", requiredLevel: 10 }],
    habitat: "",
    sprite: { shape: "circle", color: "#fff" },
    ...overrides,
  };
}

test("checkEvolutionEligibility returns null below the required level", () => {
  const def = makeDef();
  assert.equal(checkEvolutionEligibility(def, 9), null);
});

test("checkEvolutionEligibility returns the next species at or above the required level", () => {
  const def = makeDef();
  assert.equal(checkEvolutionEligibility(def, 10), "evolved");
  assert.equal(checkEvolutionEligibility(def, 15), "evolved");
});

test("checkEvolutionEligibility returns null for a final-form monster", () => {
  const def = makeDef({ evolutions: [] });
  assert.equal(checkEvolutionEligibility(def, 99), null);
});
