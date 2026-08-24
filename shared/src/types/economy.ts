export interface CurrencyWallet {
  gold: number;
  crystals: number;
}

export enum EggType {
  Basic = "Basic",
  Rare = "Rare",
  Ancient = "Ancient",
  Elemental = "Elemental",
  Legendary = "Legendary",
}

export interface EggDefinition {
  id: EggType;
  name: string;
  description: string;
  cost: Partial<CurrencyWallet>;
  /** Species ids and relative weight in the hatch pool. */
  hatchPool: { monsterId: string; weight: number }[];
}
