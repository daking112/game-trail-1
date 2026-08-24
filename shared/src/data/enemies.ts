import { Element } from "../types/element";
import { EnemyDefinition } from "../types/enemy";

export const ENEMIES: Record<string, EnemyDefinition> = {
  grunt: {
    id: "grunt",
    name: "Grunt",
    description: "A basic forest raider. Fast, but fragile.",
    element: Element.Earth,
    baseHealth: 90,
    baseDamage: 8,
    movementSpeed: 1.6,
    goldReward: 5,
    xpReward: 4,
    sprite: { shape: "circle", color: "#8d6e63" },
  },
  brute: {
    id: "brute",
    name: "Brute",
    description: "A slow, hulking enemy that soaks up damage.",
    element: Element.Earth,
    baseHealth: 340,
    baseDamage: 20,
    movementSpeed: 0.8,
    goldReward: 12,
    xpReward: 10,
    sprite: { shape: "square", color: "#5d4037" },
  },
  runner: {
    id: "runner",
    name: "Runner",
    description: "A quick skirmisher that slips past slow defenses.",
    element: Element.Wind,
    baseHealth: 55,
    baseDamage: 6,
    movementSpeed: 2.6,
    goldReward: 6,
    xpReward: 5,
    sprite: { shape: "triangle", color: "#aed581" },
  },
  boss: {
    id: "boss",
    name: "Bramblemaw",
    description: "The apex predator of Verdant Forest. Immense and relentless.",
    element: Element.Nature,
    baseHealth: 4200,
    baseDamage: 60,
    movementSpeed: 0.6,
    goldReward: 200,
    xpReward: 150,
    isBoss: true,
    sprite: { shape: "hexagon", color: "#33691e" },
  },
};

export function getEnemyDefinition(enemyId: string) {
  const def = ENEMIES[enemyId];
  if (!def) throw new Error(`Unknown enemy id: ${enemyId}`);
  return def;
}
