import { Pool } from "pg";
import { CodexEntry, CurrencyWallet, MonsterInstance, TRAIT_IDS, UserAccount } from "@monsterfall/shared";
import { GameRepository } from "./repository";

/** Postgres-backed persistence. Selected automatically when DATABASE_URL is set. */
export class PostgresGameRepository implements GameRepository {
  constructor(private pool: Pool) {}

  private toAccount(row: any): UserAccount {
    return {
      userId: row.user_id,
      username: row.username,
      wallet: { gold: row.gold, crystals: row.crystals },
      createdAt: row.created_at.toISOString ? row.created_at.toISOString() : row.created_at,
    };
  }

  private toInstance(row: any): MonsterInstance {
    return {
      instanceId: row.instance_id,
      monsterId: row.monster_id,
      ownerId: row.owner_id,
      level: row.level,
      xp: row.xp,
      traitId: row.trait_id,
      nickname: row.nickname ?? undefined,
      capturedAt: row.captured_at.toISOString ? row.captured_at.toISOString() : row.captured_at,
    };
  }

  async getOrCreateUser(username: string): Promise<UserAccount> {
    const existing = await this.pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (existing.rows[0]) return this.toAccount(existing.rows[0]);
    const inserted = await this.pool.query(
      "INSERT INTO users (username) VALUES ($1) RETURNING *",
      [username]
    );
    return this.toAccount(inserted.rows[0]);
  }

  async getUserById(userId: string): Promise<UserAccount | null> {
    const res = await this.pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
    return res.rows[0] ? this.toAccount(res.rows[0]) : null;
  }

  async getCollection(userId: string): Promise<MonsterInstance[]> {
    const res = await this.pool.query("SELECT * FROM monster_instances WHERE owner_id = $1", [userId]);
    return res.rows.map((r) => this.toInstance(r));
  }

  async getMonsterInstance(instanceId: string): Promise<MonsterInstance | null> {
    const res = await this.pool.query("SELECT * FROM monster_instances WHERE instance_id = $1", [instanceId]);
    return res.rows[0] ? this.toInstance(res.rows[0]) : null;
  }

  async addMonsterToCollection(userId: string, monsterId: string, traitId?: string): Promise<MonsterInstance> {
    const trait = traitId ?? TRAIT_IDS[Math.floor(Math.random() * TRAIT_IDS.length)];
    const res = await this.pool.query(
      "INSERT INTO monster_instances (owner_id, monster_id, trait_id) VALUES ($1, $2, $3) RETURNING *",
      [userId, monsterId, trait]
    );
    return this.toInstance(res.rows[0]);
  }

  async addMonsterXp(instanceId: string, xp: number): Promise<MonsterInstance> {
    const res = await this.pool.query(
      "UPDATE monster_instances SET xp = xp + $2 WHERE instance_id = $1 RETURNING *",
      [instanceId, xp]
    );
    return this.toInstance(res.rows[0]);
  }

  async setMonsterLevel(instanceId: string, level: number, xpRemainder: number): Promise<MonsterInstance> {
    const res = await this.pool.query(
      "UPDATE monster_instances SET level = $2, xp = $3 WHERE instance_id = $1 RETURNING *",
      [instanceId, level, xpRemainder]
    );
    return this.toInstance(res.rows[0]);
  }

  async evolveMonster(instanceId: string, newMonsterId: string): Promise<MonsterInstance> {
    const res = await this.pool.query(
      "UPDATE monster_instances SET monster_id = $2 WHERE instance_id = $1 RETURNING *",
      [instanceId, newMonsterId]
    );
    return this.toInstance(res.rows[0]);
  }

  async getCodex(userId: string): Promise<CodexEntry[]> {
    const res = await this.pool.query("SELECT * FROM codex_entries WHERE user_id = $1", [userId]);
    return res.rows.map((r) => ({
      monsterId: r.monster_id,
      seen: r.seen,
      captured: r.captured,
      evolved: r.evolved,
      variants: r.variants,
    }));
  }

  private async upsertCodex(userId: string, monsterId: string, fields: Partial<CodexEntry>) {
    await this.pool.query(
      `INSERT INTO codex_entries (user_id, monster_id, seen, captured, evolved)
       VALUES ($1, $2, COALESCE($3, false), COALESCE($4, false), COALESCE($5, false))
       ON CONFLICT (user_id, monster_id) DO UPDATE SET
         seen = codex_entries.seen OR COALESCE($3, false),
         captured = codex_entries.captured OR COALESCE($4, false),
         evolved = codex_entries.evolved OR COALESCE($5, false)`,
      [userId, monsterId, fields.seen ?? null, fields.captured ?? null, fields.evolved ?? null]
    );
  }

  async markCodexSeen(userId: string, monsterId: string): Promise<void> {
    await this.upsertCodex(userId, monsterId, { seen: true });
  }

  async markCodexCaptured(userId: string, monsterId: string): Promise<void> {
    await this.upsertCodex(userId, monsterId, { seen: true, captured: true });
  }

  async markCodexEvolved(userId: string, monsterId: string): Promise<void> {
    await this.upsertCodex(userId, monsterId, { evolved: true });
  }

  async getWallet(userId: string): Promise<CurrencyWallet> {
    const res = await this.pool.query("SELECT gold, crystals FROM users WHERE user_id = $1", [userId]);
    if (!res.rows[0]) throw new Error("Unknown user");
    return { gold: res.rows[0].gold, crystals: res.rows[0].crystals };
  }

  async addCurrency(userId: string, delta: Partial<CurrencyWallet>): Promise<CurrencyWallet> {
    const res = await this.pool.query(
      "UPDATE users SET gold = gold + $2, crystals = crystals + $3 WHERE user_id = $1 RETURNING gold, crystals",
      [userId, delta.gold ?? 0, delta.crystals ?? 0]
    );
    return { gold: res.rows[0].gold, crystals: res.rows[0].crystals };
  }
}
