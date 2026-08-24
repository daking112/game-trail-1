import { Pool } from "pg";
import { GameRepository } from "./repository";
import { MemoryGameRepository } from "./memoryRepository";
import { PostgresGameRepository } from "./postgresRepository";

export * from "./repository";

export function createRepository(): GameRepository {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const pool = new Pool({ connectionString });
    console.log("[database] Using PostgreSQL persistence");
    return new PostgresGameRepository(pool);
  }
  console.log("[database] DATABASE_URL not set, using in-memory persistence");
  return new MemoryGameRepository();
}
