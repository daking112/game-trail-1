import { test } from "node:test";
import assert from "node:assert/strict";
import { attemptCapture } from "./capture";

test("attemptCapture succeeds when the roll lands under the computed chance", () => {
  const original = Math.random;
  Math.random = () => 0; // always "wins" against any positive chance
  try {
    const { success, chance } = attemptCapture("embercub", 0.1);
    assert.ok(chance > 0);
    assert.equal(success, true);
  } finally {
    Math.random = original;
  }
});

test("attemptCapture fails when the roll lands above the computed chance", () => {
  const original = Math.random;
  Math.random = () => 0.999999;
  try {
    const { success } = attemptCapture("embercub", 0.9);
    assert.equal(success, false);
  } finally {
    Math.random = original;
  }
});

test("attemptCapture throws for an unknown monster id", () => {
  assert.throws(() => attemptCapture("not-a-real-monster", 0.5));
});
