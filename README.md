# Monsterfall

A browser-based multiplayer monster-collection + tower-defense game. Original
creatures, original world, original mechanics.

This is the **MVP**: one battle map (Verdant Forest Trail), 10 waves, a boss,
10 starter monsters (+10 evolutions), monster placement/targeting/abilities/
ultimates, a collection + Codex, and a 1–4 player cooperative lobby with a
server-authoritative battle simulation.

## Architecture

```
/shared   Types, constants, and game-design data shared by client and server
          (elements, rarity, monsters, enemies, waves, abilities, traits, map).
/server   Node/TypeScript + Socket.IO. Owns the authoritative battle
          simulation, lobby management, and persistence.
/client   React + TypeScript + Vite + Phaser. Renders whatever state the
          server sends; never computes damage/health/waves itself.
```

Persistence is behind a `GameRepository` interface (`server/src/database`):
an in-memory implementation is used by default, and a PostgreSQL
implementation (`server/src/database/schema.sql`) is used automatically when
`DATABASE_URL` is set.

## Running locally

```bash
npm install
npm run build:shared      # builds shared/dist (used by the server + typecheck)

# two terminals:
npm run dev:server        # http://localhost:4000
npm run dev:client        # http://localhost:5173
```

Open http://localhost:5173, enter a name, and either **Create Lobby** or
**Join Lobby** with a code. 1–4 players can ready up and start a battle
together.

### Optional: PostgreSQL persistence

```bash
export DATABASE_URL=postgres://user:pass@localhost:5432/monsterfall
psql "$DATABASE_URL" -f server/src/database/schema.sql
npm run dev:server
```

Without `DATABASE_URL`, the server uses in-memory persistence (data resets on
restart) — fine for local play and testing.

## Scripts

- `npm run dev:server` / `npm run dev:client` — run each app in watch mode.
- `npm run build` — typecheck + build shared, server, and client.
- `npm run typecheck` — typecheck all workspaces without emitting.

## Gameplay notes

- Basic attacks and abilities auto-fire based on targeting mode and
  cooldowns; the **ultimate** meter fills from landed attacks and is
  activated manually by clicking your own deployed monster once it's ready.
  Click again (before it's ready) to cycle targeting mode
  (Closest → First → Last → Strongest, shown as a letter on the monster).
- After a non-final wave completes, there's a chance a wild monster
  encounter offers a capture attempt.
- Monster XP/leveling/evolution and gold rewards are applied server-side at
  the end of a battle and pushed back to your Collection/Codex/wallet.
