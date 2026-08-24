import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ELEMENT_ADVANTAGES,
  ELEMENT_ADVANTAGE_MULTIPLIER,
  ELEMENT_DISADVANTAGE_MULTIPLIER,
  Element,
  getElementalMultiplier,
} from "./element";

test("attacker gets the advantage multiplier against a weak-to element", () => {
  assert.equal(getElementalMultiplier(Element.Fire, Element.Nature), ELEMENT_ADVANTAGE_MULTIPLIER);
  assert.equal(getElementalMultiplier(Element.Water, Element.Fire), ELEMENT_ADVANTAGE_MULTIPLIER);
});

test("attacker gets the disadvantage multiplier against a strong-to element", () => {
  assert.equal(getElementalMultiplier(Element.Nature, Element.Fire), ELEMENT_DISADVANTAGE_MULTIPLIER);
  assert.equal(getElementalMultiplier(Element.Earth, Element.Water), ELEMENT_DISADVANTAGE_MULTIPLIER);
});

test("same or unrelated elements are neutral", () => {
  assert.equal(getElementalMultiplier(Element.Fire, Element.Fire), 1);
  assert.equal(getElementalMultiplier(Element.Fire, Element.Electric), 1);
});

test("every element has at least one advantage defined", () => {
  for (const element of Object.values(Element)) {
    assert.ok(ELEMENT_ADVANTAGES[element].length > 0, `${element} has no advantages configured`);
  }
});
