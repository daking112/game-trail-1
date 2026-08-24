import { test } from "node:test";
import assert from "node:assert/strict";
import { statAtLevel, xpToNextLevel } from "./monster";

test("xp requirement increases with level", () => {
  const lvl1 = xpToNextLevel(1);
  const lvl5 = xpToNextLevel(5);
  const lvl10 = xpToNextLevel(10);
  assert.ok(lvl5 > lvl1);
  assert.ok(lvl10 > lvl5);
});

test("statAtLevel returns the base stat at level 1", () => {
  assert.equal(statAtLevel(100, 1), 100);
});

test("statAtLevel scales up with level", () => {
  const level1 = statAtLevel(100, 1);
  const level10 = statAtLevel(100, 10);
  assert.ok(level10 > level1);
});
