import { StatModifier, TRAITS } from "@monsterfall/shared";

export interface TraitContext {
  nearAllies: boolean;
  recentKillBuffActive: boolean;
}

function combine(a: StatModifier, b: StatModifier): StatModifier {
  return {
    damagePercent: (a.damagePercent ?? 0) + (b.damagePercent ?? 0),
    defensePercent: (a.defensePercent ?? 0) + (b.defensePercent ?? 0),
    attackSpeedPercent: (a.attackSpeedPercent ?? 0) + (b.attackSpeedPercent ?? 0),
    movementSpeedPercent: (a.movementSpeedPercent ?? 0) + (b.movementSpeedPercent ?? 0),
    abilityCooldownPercent: (a.abilityCooldownPercent ?? 0) + (b.abilityCooldownPercent ?? 0),
  };
}

/** Resolves a trait's static + conditionally-triggered modifiers into one effective set. */
export function getEffectiveModifiers(traitId: string, ctx: TraitContext): StatModifier {
  const trait = TRAITS[traitId];
  if (!trait) return {};
  let result = trait.modifiers;
  if (trait.triggerId === "nearAllies" && ctx.nearAllies && trait.triggerModifiers) {
    result = combine(result, trait.triggerModifiers);
  }
  if (trait.triggerId === "onKill" && ctx.recentKillBuffActive && trait.triggerModifiers) {
    result = combine(result, trait.triggerModifiers);
  }
  return result;
}
