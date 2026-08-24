import { CurrencyWallet, EGGS, EggType } from "@monsterfall/shared";

export interface EggPurchaseCheck {
  canAfford: boolean;
  cost: Partial<CurrencyWallet>;
}

export function checkEggAffordability(eggType: EggType, wallet: CurrencyWallet): EggPurchaseCheck {
  const cost = EGGS[eggType].cost;
  const canAfford = (cost.gold ?? 0) <= wallet.gold && (cost.crystals ?? 0) <= wallet.crystals;
  return { canAfford, cost };
}

/** Rolls a weighted random species from the egg's hatch pool. Server-authoritative -- clients never see the roll. */
export function rollEggHatch(eggType: EggType): string {
  const pool = EGGS[eggType].hatchPool;
  const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.monsterId;
  }
  return pool[pool.length - 1].monsterId;
}
