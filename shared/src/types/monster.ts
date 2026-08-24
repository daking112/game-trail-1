import { Element } from "./element";
import { Rarity } from "./rarity";

export interface EvolutionStage {
  monsterId: string;
  requiredLevel: number;
}

export interface MonsterDefinition {
  id: string;
  name: string;
  description: string;
  element: Element;
  rarity: Rarity;
  baseHealth: number;
  baseDamage: number;
  /** Attacks per second. */
  attackSpeed: number;
  /** Range in grid cells. */
  range: number;
  /** Used for future overworld movement; battlefield monsters are stationary. */
  movementSpeed: number;
  abilityId: string;
  passiveDescription: string;
  /** Ultimate charge gained per basic attack landed (percent of meter, 0-100). */
  ultimateChargePerAttack: number;
  /** Next evolution stage, if any. Architecture supports multiple future branches. */
  evolutions: EvolutionStage[];
  /** Habitat shown in the Codex. */
  habitat: string;
  /** Placeholder visual representation until final art exists. */
  sprite: {
    shape: "circle" | "triangle" | "square" | "diamond" | "hexagon";
    color: string;
  };
}

export interface MonsterInstance {
  /** Unique id of this owned specimen (not the species id). */
  instanceId: string;
  monsterId: string;
  ownerId: string;
  level: number;
  xp: number;
  traitId: string;
  nickname?: string;
  capturedAt: string;
}

export function xpToNextLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}

export function statAtLevel(base: number, level: number): number {
  return Math.floor(base * (1 + (level - 1) * 0.08));
}
