import { MonsterDefinition, xpToNextLevel } from "@monsterfall/shared";

export interface LevelState {
  level: number;
  xp: number;
}

export function applyXpGain(state: LevelState, xpGained: number): LevelState {
  let { level, xp } = state;
  xp += xpGained;
  let threshold = xpToNextLevel(level);
  while (xp >= threshold) {
    xp -= threshold;
    level += 1;
    threshold = xpToNextLevel(level);
  }
  return { level, xp };
}

/** Returns the monster id to evolve into, if the given level qualifies for the next stage. */
export function checkEvolutionEligibility(def: MonsterDefinition, level: number): string | null {
  const next = def.evolutions[0];
  if (next && level >= next.requiredLevel) {
    return next.monsterId;
  }
  return null;
}
