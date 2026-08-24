export enum TargetingMode {
  First = "First",
  Last = "Last",
  Strongest = "Strongest",
  Closest = "Closest",
}

export enum AbilityEffectType {
  AoeDamage = "AoeDamage",
  Slow = "Slow",
  Heal = "Heal",
  Taunt = "Taunt",
  ChainDamage = "ChainDamage",
  PoisonCloud = "PoisonCloud",
}

export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  effectType: AbilityEffectType;
  cooldownSeconds: number;
  /** Radius in grid cells for area effects. */
  radius?: number;
  /** Base power used by the effect resolver (damage amount, heal amount, slow %, etc). */
  power: number;
  /** Duration in seconds for effects like slow/dot/taunt. */
  durationSeconds?: number;
  /** Number of extra targets for chain-style abilities. */
  chainCount?: number;
}

export const ABILITIES: Record<string, AbilityDefinition> = {
  fireball: {
    id: "fireball",
    name: "Fireball",
    description: "Deals AoE fire damage to enemies in range.",
    effectType: AbilityEffectType.AoeDamage,
    cooldownSeconds: 8,
    radius: 1.5,
    power: 60,
  },
  freeze: {
    id: "freeze",
    name: "Freeze",
    description: "Slows enemies in range for several seconds.",
    effectType: AbilityEffectType.Slow,
    cooldownSeconds: 10,
    radius: 1.5,
    power: 50,
    durationSeconds: 3,
  },
  heal: {
    id: "heal",
    name: "Heal",
    description: "Restores HP to nearby allied monsters.",
    effectType: AbilityEffectType.Heal,
    cooldownSeconds: 12,
    radius: 2,
    power: 80,
  },
  taunt: {
    id: "taunt",
    name: "Taunt",
    description: "Forces nearby enemies to target this monster.",
    effectType: AbilityEffectType.Taunt,
    cooldownSeconds: 14,
    radius: 2,
    power: 0,
    durationSeconds: 4,
  },
  chainLightning: {
    id: "chainLightning",
    name: "Chain Lightning",
    description: "Hits multiple enemies with a bouncing bolt.",
    effectType: AbilityEffectType.ChainDamage,
    cooldownSeconds: 9,
    power: 45,
    chainCount: 3,
  },
  poisonCloud: {
    id: "poisonCloud",
    name: "Poison Cloud",
    description: "Creates a damage-over-time cloud in an area.",
    effectType: AbilityEffectType.PoisonCloud,
    cooldownSeconds: 11,
    radius: 1.5,
    power: 15,
    durationSeconds: 4,
  },
};
