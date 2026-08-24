export enum Element {
  Fire = "Fire",
  Water = "Water",
  Nature = "Nature",
  Electric = "Electric",
  Earth = "Earth",
  Wind = "Wind",
  Ice = "Ice",
  Shadow = "Shadow",
}

/**
 * Centralized elemental effectiveness config. Every combat calculation
 * must read from this table rather than special-casing elements inline.
 * Value is the damage multiplier applied when the attacker's element
 * is the key and the defender's element is in the value list.
 */
export const ELEMENT_ADVANTAGES: Record<Element, Element[]> = {
  [Element.Fire]: [Element.Nature, Element.Ice],
  [Element.Water]: [Element.Fire, Element.Earth],
  [Element.Nature]: [Element.Water, Element.Earth],
  [Element.Electric]: [Element.Water, Element.Wind],
  [Element.Earth]: [Element.Electric, Element.Fire],
  [Element.Wind]: [Element.Earth, Element.Nature],
  [Element.Ice]: [Element.Wind, Element.Shadow],
  [Element.Shadow]: [Element.Ice, Element.Electric],
};

export const ELEMENT_ADVANTAGE_MULTIPLIER = 1.5;
export const ELEMENT_DISADVANTAGE_MULTIPLIER = 0.67;

export function getElementalMultiplier(attacker: Element, defender: Element): number {
  if (ELEMENT_ADVANTAGES[attacker]?.includes(defender)) {
    return ELEMENT_ADVANTAGE_MULTIPLIER;
  }
  if (ELEMENT_ADVANTAGES[defender]?.includes(attacker)) {
    return ELEMENT_DISADVANTAGE_MULTIPLIER;
  }
  return 1;
}
