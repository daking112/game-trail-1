export enum Rarity {
  Common = "Common",
  Uncommon = "Uncommon",
  Rare = "Rare",
  Epic = "Epic",
  Legendary = "Legendary",
  Mythic = "Mythic",
}

export interface RarityConfig {
  statMultiplier: number;
  abilityPotential: number;
  evolutionPotential: number;
  captureRateModifier: number;
  color: string;
}

/**
 * Rarity influences stats/abilities/evolution/capture, but is deliberately
 * not the sole driver of usefulness -- traits, elements, and positioning
 * matter just as much in the combat system.
 */
export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  [Rarity.Common]: { statMultiplier: 1.0, abilityPotential: 1.0, evolutionPotential: 1.0, captureRateModifier: 1.0, color: "#b0b0b0" },
  [Rarity.Uncommon]: { statMultiplier: 1.1, abilityPotential: 1.05, evolutionPotential: 1.1, captureRateModifier: 0.85, color: "#4caf50" },
  [Rarity.Rare]: { statMultiplier: 1.25, abilityPotential: 1.15, evolutionPotential: 1.25, captureRateModifier: 0.65, color: "#2196f3" },
  [Rarity.Epic]: { statMultiplier: 1.45, abilityPotential: 1.3, evolutionPotential: 1.45, captureRateModifier: 0.45, color: "#9c27b0" },
  [Rarity.Legendary]: { statMultiplier: 1.7, abilityPotential: 1.5, evolutionPotential: 1.7, captureRateModifier: 0.25, color: "#ff9800" },
  [Rarity.Mythic]: { statMultiplier: 2.0, abilityPotential: 1.75, evolutionPotential: 2.0, captureRateModifier: 0.1, color: "#f44336" },
};

export const RARITY_ORDER: Rarity[] = [
  Rarity.Common,
  Rarity.Uncommon,
  Rarity.Rare,
  Rarity.Epic,
  Rarity.Legendary,
  Rarity.Mythic,
];
