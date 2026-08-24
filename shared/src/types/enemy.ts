import { Element } from "./element";

export interface EnemyDefinition {
  id: string;
  name: string;
  description: string;
  element: Element;
  baseHealth: number;
  baseDamage: number;
  movementSpeed: number;
  /** Gold + currency reward on death. */
  goldReward: number;
  xpReward: number;
  isBoss?: boolean;
  sprite: {
    shape: "circle" | "triangle" | "square" | "diamond" | "hexagon";
    color: string;
  };
}
