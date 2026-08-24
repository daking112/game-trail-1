import { Element, StatModifier, getElementalMultiplier } from "@monsterfall/shared";

export function computeDamage(
  baseDamage: number,
  attackerElement: Element,
  defenderElement: Element,
  modifiers: StatModifier
): number {
  let dmg = baseDamage * getElementalMultiplier(attackerElement, defenderElement);
  dmg *= 1 + (modifiers.damagePercent ?? 0) / 100;
  return Math.max(1, Math.round(dmg));
}

export function computeIncomingDamage(rawDamage: number, defenderModifiers: StatModifier): number {
  const reduction = (defenderModifiers.defensePercent ?? 0) / 100;
  return Math.max(1, Math.round(rawDamage * (1 - reduction)));
}

export function computeAttackIntervalSeconds(baseAttackSpeed: number, modifiers: StatModifier): number {
  const effectiveSpeed = baseAttackSpeed * (1 + (modifiers.attackSpeedPercent ?? 0) / 100);
  return 1 / Math.max(0.1, effectiveSpeed);
}

export function computeAbilityCooldownSeconds(baseCooldown: number, modifiers: StatModifier): number {
  const scaled = baseCooldown * (1 + (modifiers.abilityCooldownPercent ?? 0) / 100);
  return Math.max(1, scaled);
}
