import { RARITY_CONFIG, calculateCaptureChance, getMonsterDefinition } from "@monsterfall/shared";

/** Server rolls the dice -- clients only ever see the result, never the roll. */
export function attemptCapture(monsterId: string, enemyHealthPercent: number): { success: boolean; chance: number } {
  const def = getMonsterDefinition(monsterId);
  const chance = calculateCaptureChance({
    enemyHealthPercent,
    rarityCaptureModifier: RARITY_CONFIG[def.rarity].captureRateModifier,
  });
  return { success: Math.random() < chance, chance };
}
