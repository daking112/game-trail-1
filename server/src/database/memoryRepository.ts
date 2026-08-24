import { v4 as uuid } from "uuid";
import { CodexEntry, CurrencyWallet, MonsterInstance, TRAIT_IDS, UserAccount } from "@monsterfall/shared";
import { GameRepository } from "./repository";

interface MemoryUser {
  account: UserAccount;
  collection: Map<string, MonsterInstance>;
  codex: Map<string, CodexEntry>;
}

/**
 * Default in-memory persistence used when no DATABASE_URL is configured.
 * Implements the same GameRepository contract as the Postgres-backed
 * implementation so callers never know the difference.
 */
export class MemoryGameRepository implements GameRepository {
  private usersByName = new Map<string, MemoryUser>();
  private usersById = new Map<string, MemoryUser>();
  private instanceIndex = new Map<string, string>(); // instanceId -> userId

  async getOrCreateUser(username: string): Promise<UserAccount> {
    const existing = this.usersByName.get(username);
    if (existing) return existing.account;

    const account: UserAccount = {
      userId: uuid(),
      username,
      wallet: { gold: 500, crystals: 20 },
      createdAt: new Date().toISOString(),
    };
    const record: MemoryUser = { account, collection: new Map(), codex: new Map() };
    this.usersByName.set(username, record);
    this.usersById.set(account.userId, record);
    return account;
  }

  async getUserById(userId: string): Promise<UserAccount | null> {
    return this.usersById.get(userId)?.account ?? null;
  }

  async getCollection(userId: string): Promise<MonsterInstance[]> {
    const user = this.usersById.get(userId);
    return user ? Array.from(user.collection.values()) : [];
  }

  async getMonsterInstance(instanceId: string): Promise<MonsterInstance | null> {
    const userId = this.instanceIndex.get(instanceId);
    if (!userId) return null;
    return this.usersById.get(userId)?.collection.get(instanceId) ?? null;
  }

  async addMonsterToCollection(userId: string, monsterId: string, traitId?: string): Promise<MonsterInstance> {
    const user = this.usersById.get(userId);
    if (!user) throw new Error("Unknown user");
    const instance: MonsterInstance = {
      instanceId: uuid(),
      monsterId,
      ownerId: userId,
      level: 1,
      xp: 0,
      traitId: traitId ?? TRAIT_IDS[Math.floor(Math.random() * TRAIT_IDS.length)],
      capturedAt: new Date().toISOString(),
    };
    user.collection.set(instance.instanceId, instance);
    this.instanceIndex.set(instance.instanceId, userId);
    return instance;
  }

  async addMonsterXp(instanceId: string, xp: number): Promise<MonsterInstance> {
    const instance = await this.getMonsterInstance(instanceId);
    if (!instance) throw new Error("Unknown monster instance");
    instance.xp += xp;
    return instance;
  }

  async setMonsterLevel(instanceId: string, level: number, xpRemainder: number): Promise<MonsterInstance> {
    const instance = await this.getMonsterInstance(instanceId);
    if (!instance) throw new Error("Unknown monster instance");
    instance.level = level;
    instance.xp = xpRemainder;
    return instance;
  }

  async evolveMonster(instanceId: string, newMonsterId: string): Promise<MonsterInstance> {
    const instance = await this.getMonsterInstance(instanceId);
    if (!instance) throw new Error("Unknown monster instance");
    instance.monsterId = newMonsterId;
    return instance;
  }

  async getCodex(userId: string): Promise<CodexEntry[]> {
    const user = this.usersById.get(userId);
    return user ? Array.from(user.codex.values()) : [];
  }

  private getOrCreateCodexEntry(user: MemoryUser, monsterId: string): CodexEntry {
    let entry = user.codex.get(monsterId);
    if (!entry) {
      entry = { monsterId, seen: false, captured: false, evolved: false, variants: [] };
      user.codex.set(monsterId, entry);
    }
    return entry;
  }

  async markCodexSeen(userId: string, monsterId: string): Promise<void> {
    const user = this.usersById.get(userId);
    if (!user) return;
    this.getOrCreateCodexEntry(user, monsterId).seen = true;
  }

  async markCodexCaptured(userId: string, monsterId: string): Promise<void> {
    const user = this.usersById.get(userId);
    if (!user) return;
    const entry = this.getOrCreateCodexEntry(user, monsterId);
    entry.seen = true;
    entry.captured = true;
  }

  async markCodexEvolved(userId: string, monsterId: string): Promise<void> {
    const user = this.usersById.get(userId);
    if (!user) return;
    this.getOrCreateCodexEntry(user, monsterId).evolved = true;
  }

  async getWallet(userId: string): Promise<CurrencyWallet> {
    const user = this.usersById.get(userId);
    if (!user) throw new Error("Unknown user");
    return user.account.wallet;
  }

  async addCurrency(userId: string, delta: Partial<CurrencyWallet>): Promise<CurrencyWallet> {
    const user = this.usersById.get(userId);
    if (!user) throw new Error("Unknown user");
    user.account.wallet.gold += delta.gold ?? 0;
    user.account.wallet.crystals += delta.crystals ?? 0;
    return user.account.wallet;
  }
}
