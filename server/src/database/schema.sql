-- Monsterfall persistence schema (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  gold INTEGER NOT NULL DEFAULT 500,
  crystals INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monster_instances (
  instance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  monster_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  trait_id TEXT NOT NULL,
  nickname TEXT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monster_instances_owner ON monster_instances(owner_id);

CREATE TABLE IF NOT EXISTS codex_entries (
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  monster_id TEXT NOT NULL,
  seen BOOLEAN NOT NULL DEFAULT false,
  captured BOOLEAN NOT NULL DEFAULT false,
  evolved BOOLEAN NOT NULL DEFAULT false,
  variants TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (user_id, monster_id)
);
