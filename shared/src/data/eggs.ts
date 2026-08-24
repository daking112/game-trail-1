import { EggDefinition, EggType } from "../types/economy";

export const EGGS: Record<EggType, EggDefinition> = {
  [EggType.Basic]: {
    id: EggType.Basic,
    name: "Basic Egg",
    description: "A common egg found throughout Verdant Forest.",
    cost: { gold: 200 },
    hatchPool: [
      { monsterId: "embercub", weight: 20 },
      { monsterId: "mossling", weight: 20 },
      { monsterId: "tidalfin", weight: 20 },
    ],
  },
  [EggType.Rare]: {
    id: EggType.Rare,
    name: "Rare Egg",
    description: "An egg with a noticeably higher chance of rare species.",
    cost: { gold: 600 },
    hatchPool: [
      { monsterId: "voltiger", weight: 15 },
      { monsterId: "stonehorn", weight: 15 },
      { monsterId: "gustling", weight: 15 },
    ],
  },
  [EggType.Ancient]: {
    id: EggType.Ancient,
    name: "Ancient Egg",
    description: "A weathered egg said to hold forgotten bloodlines.",
    cost: { crystals: 150 },
    hatchPool: [
      { monsterId: "frostwing", weight: 10 },
      { monsterId: "shadowkit", weight: 10 },
    ],
  },
  [EggType.Elemental]: {
    id: EggType.Elemental,
    name: "Elemental Egg",
    description: "Hums with elemental energy from a single, unstable source.",
    cost: { crystals: 250 },
    hatchPool: [
      { monsterId: "pyroclaw", weight: 8 },
    ],
  },
  [EggType.Legendary]: {
    id: EggType.Legendary,
    name: "Legendary Egg",
    description: "Extremely rare. Something extraordinary sleeps inside.",
    cost: { crystals: 800 },
    hatchPool: [
      { monsterId: "auroryx", weight: 3 },
    ],
  },
};
