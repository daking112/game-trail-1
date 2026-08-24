export interface CaptureAttemptResult {
  success: boolean;
  monsterId: string;
  captureChance: number;
  instanceId?: string;
}

/**
 * Modular capture-chance calculation so it can later grow into a full
 * encounter mechanic without touching callers.
 */
export function calculateCaptureChance(params: {
  enemyHealthPercent: number;
  rarityCaptureModifier: number;
}): number {
  const { enemyHealthPercent, rarityCaptureModifier } = params;
  const base = 1 - enemyHealthPercent;
  const chance = base * rarityCaptureModifier * 1.1 + 0.05;
  return Math.max(0.02, Math.min(0.95, chance));
}
