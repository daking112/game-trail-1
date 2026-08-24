export interface StatModifier {
  damagePercent?: number;
  defensePercent?: number;
  attackSpeedPercent?: number;
  movementSpeedPercent?: number;
  abilityCooldownPercent?: number;
}

export interface TraitDefinition {
  id: string;
  name: string;
  description: string;
  /** Static modifiers applied at all times. */
  modifiers: StatModifier;
  /** Conditional/triggered modifiers are handled by id in the combat system. */
  triggerId?: "onKill" | "nearAllies";
  triggerModifiers?: StatModifier;
}

export const TRAITS: Record<string, TraitDefinition> = {
  reckless: {
    id: "reckless",
    name: "Reckless",
    description: "+12% damage, -8% defense",
    modifiers: { damagePercent: 12, defensePercent: -8 },
  },
  guardian: {
    id: "guardian",
    name: "Guardian",
    description: "+20% defense near allied monsters",
    modifiers: {},
    triggerId: "nearAllies",
    triggerModifiers: { defensePercent: 20 },
  },
  bloodthirsty: {
    id: "bloodthirsty",
    name: "Bloodthirsty",
    description: "Gain attack speed after killing an enemy",
    modifiers: {},
    triggerId: "onKill",
    triggerModifiers: { attackSpeedPercent: 25 },
  },
  strategist: {
    id: "strategist",
    name: "Strategist",
    description: "Reduced ability cooldown",
    modifiers: { abilityCooldownPercent: -20 },
  },
  swift: {
    id: "swift",
    name: "Swift",
    description: "+15% attack speed, -5% damage",
    modifiers: { attackSpeedPercent: 15, damagePercent: -5 },
  },
  stalwart: {
    id: "stalwart",
    name: "Stalwart",
    description: "+18% defense, -10% attack speed",
    modifiers: { defensePercent: 18, attackSpeedPercent: -10 },
  },
};

export const TRAIT_IDS = Object.keys(TRAITS);
