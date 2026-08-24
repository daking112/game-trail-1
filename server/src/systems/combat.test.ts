import { test } from "node:test";
import assert from "node:assert/strict";
import { Element } from "@monsterfall/shared";
import { computeAbilityCooldownSeconds, computeAttackIntervalSeconds, computeDamage } from "./combat";

test("computeDamage applies the elemental advantage multiplier", () => {
  const neutral = computeDamage(100, Element.Fire, Element.Electric, {});
  const advantage = computeDamage(100, Element.Fire, Element.Nature, {});
  const disadvantage = computeDamage(100, Element.Fire, Element.Water, {});
  assert.equal(neutral, 100);
  assert.equal(advantage, 150);
  assert.equal(disadvantage, 67);
});

test("computeDamage applies trait damage modifiers on top of the elemental multiplier", () => {
  const boosted = computeDamage(100, Element.Fire, Element.Electric, { damagePercent: 12 });
  assert.equal(boosted, 112);
});

test("computeDamage never rounds down to zero", () => {
  const dmg = computeDamage(1, Element.Shadow, Element.Fire, { damagePercent: -90 });
  assert.ok(dmg >= 1);
});

test("computeAttackIntervalSeconds is the inverse of attack speed", () => {
  assert.equal(computeAttackIntervalSeconds(1, {}), 1);
  assert.equal(computeAttackIntervalSeconds(2, {}), 0.5);
});

test("attack speed trait modifiers shorten the interval", () => {
  const base = computeAttackIntervalSeconds(1, {});
  const faster = computeAttackIntervalSeconds(1, { attackSpeedPercent: 25 });
  assert.ok(faster < base);
});

test("ability cooldown reduction traits shorten the cooldown but never below 1s", () => {
  const reduced = computeAbilityCooldownSeconds(10, { abilityCooldownPercent: -20 });
  assert.equal(reduced, 8);
  const floored = computeAbilityCooldownSeconds(1, { abilityCooldownPercent: -99 });
  assert.ok(floored >= 1);
});
