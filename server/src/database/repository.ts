import { CodexEntry, CurrencyWallet, MonsterInstance, UserAccount } from "@monsterfall/shared";

/**
 * Persistence boundary. The server never trusts client-provided save data --
 * all mutations go through these methods and are computed server-side.
 */
export interface GameRepository {
  getOrCreateUser(username: string): Promise<UserAccount>;
  getUserById(userId: string): Promise<UserAccount | null>;

  getCollection(userId: string): Promise<MonsterInstance[]>;
  getMonsterInstance(instanceId: string): Promise<MonsterInstance | null>;
  addMonsterToCollection(userId: string, monsterId: string, traitId?: string): Promise<MonsterInstance>;
  addMonsterXp(instanceId: string, xp: number): Promise<MonsterInstance>;
  setMonsterLevel(instanceId: string, level: number, xpRemainder: number): Promise<MonsterInstance>;
  evolveMonster(instanceId: string, newMonsterId: string): Promise<MonsterInstance>;

  getCodex(userId: string): Promise<CodexEntry[]>;
  markCodexSeen(userId: string, monsterId: string): Promise<void>;
  markCodexCaptured(userId: string, monsterId: string): Promise<void>;
  markCodexEvolved(userId: string, monsterId: string): Promise<void>;

  getWallet(userId: string): Promise<CurrencyWallet>;
  addCurrency(userId: string, delta: Partial<CurrencyWallet>): Promise<CurrencyWallet>;
}
