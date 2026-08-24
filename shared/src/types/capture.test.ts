import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateCaptureChance } from "./capture";

test("capture chance is clamped between 2% and 95%", () => {
  const min = calculateCaptureChance({ enemyHealthPercent: 1, rarityCaptureModifier: 0.1 });
  const max = calculateCaptureChance({ enemyHealthPercent: 0, rarityCaptureModifier: 1 });
  assert.ok(min >= 0.02, `expected floor of 0.02, got ${min}`);
  assert.ok(max <= 0.95, `expected ceiling of 0.95, got ${max}`);
});

test("lower enemy health means a higher capture chance", () => {
  const low = calculateCaptureChance({ enemyHealthPercent: 0.1, rarityCaptureModifier: 0.5 });
  const high = calculateCaptureChance({ enemyHealthPercent: 0.8, rarityCaptureModifier: 0.5 });
  assert.ok(low > high, `expected low-health chance (${low}) to beat high-health chance (${high})`);
});

test("a better rarity capture modifier means a higher chance at the same health", () => {
  const common = calculateCaptureChance({ enemyHealthPercent: 0.3, rarityCaptureModifier: 1.0 });
  const legendary = calculateCaptureChance({ enemyHealthPercent: 0.3, rarityCaptureModifier: 0.25 });
  assert.ok(common > legendary, `expected common (${common}) to be easier to catch than legendary (${legendary})`);
});
