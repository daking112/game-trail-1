import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  MonsterInstance,
  ServerToClientEvents,
  STARTER_MONSTER_IDS,
} from "@monsterfall/shared";
import { GameRepository } from "../database/repository";
import { LobbyManager } from "../rooms/LobbyManager";
import { BattleRoom } from "../game/BattleRoom";
import { checkEggAffordability, rollEggHatch } from "../systems/shop";

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const STARTER_GRANT_COUNT = 3;
const RECONNECT_GRACE_MS = 20_000;

async function ensureStarterMonsters(repository: GameRepository, userId: string): Promise<MonsterInstance[]> {
  let collection = await repository.getCollection(userId);
  if (collection.length === 0) {
    const shuffled = [...STARTER_MONSTER_IDS].sort(() => Math.random() - 0.5).slice(0, STARTER_GRANT_COUNT);
    for (const monsterId of shuffled) {
      await repository.addMonsterToCollection(userId, monsterId);
      await repository.markCodexCaptured(userId, monsterId);
    }
    collection = await repository.getCollection(userId);
  }
  return collection;
}

export function registerSocketHandlers(io: AppServer, repository: GameRepository): void {
  const lobbyManager = new LobbyManager();
  const battleRooms = new Map<string, BattleRoom>();

  function broadcastLobby(lobbyCode: string): void {
    const lobby = lobbyManager.getLobby(lobbyCode);
    if (lobby) io.to(lobbyCode).emit("lobby:update", { lobby: lobby.toState() });
  }

  io.on("connection", (socket: AppSocket) => {
    let playerId: string | null = null;
    let lobbyCode: string | null = null;

    async function identify(username: string): Promise<string> {
      const user = await repository.getOrCreateUser(username);
      playerId = user.userId;
      socket.join(user.userId);
      socket.emit("self:identify", { userId: user.userId, username: user.username });
      const collection = await ensureStarterMonsters(repository, user.userId);
      socket.emit("collection:update", { monsters: collection });
      socket.emit("codex:update", { entries: await repository.getCodex(user.userId) });
      socket.emit("wallet:update", { wallet: await repository.getWallet(user.userId) });
      return user.userId;
    }

    socket.on("player:identify", async ({ username }) => {
      if (playerId) return;
      await identify(username);
    });

    socket.on("lobby:create", async ({ username }) => {
      const uid = await identify(username);
      const lobby = lobbyManager.createLobby();
      lobby.addPlayer(uid, username, socket.id);
      lobbyCode = lobby.lobbyCode;
      socket.join(lobbyCode);
      broadcastLobby(lobbyCode);
    });

    socket.on("lobby:join", async ({ lobbyCode: code, username }) => {
      const uid = await identify(username);
      const lobby = lobbyManager.getLobby(code);
      if (!lobby) {
        socket.emit("lobby:error", { message: "Lobby not found" });
        return;
      }
      const result = lobby.addPlayer(uid, username, socket.id);
      if (result.error) {
        socket.emit("lobby:error", { message: result.error });
        return;
      }
      lobbyCode = lobby.lobbyCode;
      socket.join(lobbyCode);
      broadcastLobby(lobbyCode);
    });

    socket.on("lobby:ready", ({ ready }) => {
      if (!lobbyCode || !playerId) return;
      const lobby = lobbyManager.getLobby(lobbyCode);
      if (!lobby) return;
      lobby.setReady(playerId, ready);
      broadcastLobby(lobbyCode);
    });

    socket.on("lobby:selectTeam", ({ instanceIds }) => {
      if (!lobbyCode || !playerId) return;
      const lobby = lobbyManager.getLobby(lobbyCode);
      if (!lobby) return;
      lobby.teams.set(playerId, instanceIds);
    });

    socket.on("lobby:start", () => {
      if (!lobbyCode) return;
      const lobby = lobbyManager.getLobby(lobbyCode);
      if (!lobby) return;
      if (!lobby.allReady()) {
        socket.emit("lobby:error", { message: "Not all players are ready" });
        return;
      }
      lobby.started = true;
      broadcastLobby(lobbyCode);
      const room = new BattleRoom(lobbyCode, io, repository);
      battleRooms.set(lobbyCode, room);
      room.start();
    });

    socket.on("battle:placeMonster", async ({ instanceId, x, y }) => {
      if (!lobbyCode || !playerId) return;
      const room = battleRooms.get(lobbyCode);
      if (!room) return;
      const instance = await repository.getMonsterInstance(instanceId);
      if (!instance || instance.ownerId !== playerId) {
        socket.emit("lobby:error", { message: "You do not own that monster" });
        return;
      }
      const result = room.placeMonster(playerId, instanceId, instance.monsterId, instance.level, instance.traitId, x, y);
      if ("error" in result) {
        socket.emit("lobby:error", { message: result.error });
      }
    });

    socket.on("battle:setTargetingMode", ({ placementId, mode }) => {
      if (!lobbyCode) return;
      battleRooms.get(lobbyCode)?.setTargetingMode(placementId, mode);
    });

    socket.on("battle:activateAbility", ({ placementId }) => {
      if (!lobbyCode) return;
      battleRooms.get(lobbyCode)?.activateAbility(placementId);
    });

    socket.on("battle:activateUltimate", ({ placementId }) => {
      if (!lobbyCode) return;
      battleRooms.get(lobbyCode)?.activateUltimate(placementId);
    });

    socket.on("battle:capture", async ({ encounterId }) => {
      if (!lobbyCode || !playerId) return;
      const room = battleRooms.get(lobbyCode);
      if (!room) return;
      await room.resolveCapture(playerId, encounterId);
      const monsters = await repository.getCollection(playerId);
      socket.emit("collection:update", { monsters });
      socket.emit("codex:update", { entries: await repository.getCodex(playerId) });
    });

    socket.on("shop:purchaseEgg", async ({ eggType }) => {
      if (!playerId) return;
      const wallet = await repository.getWallet(playerId);
      const { canAfford, cost } = checkEggAffordability(eggType, wallet);
      if (!canAfford) {
        socket.emit("shop:eggResult", { success: false, eggType, message: "Not enough currency" });
        return;
      }
      await repository.addCurrency(playerId, { gold: -(cost.gold ?? 0), crystals: -(cost.crystals ?? 0) });
      const monsterId = rollEggHatch(eggType);
      const instance = await repository.addMonsterToCollection(playerId, monsterId);
      await repository.markCodexCaptured(playerId, monsterId);

      socket.emit("shop:eggResult", { success: true, eggType, monsterId, instanceId: instance.instanceId });
      socket.emit("wallet:update", { wallet: await repository.getWallet(playerId) });
      socket.emit("collection:update", { monsters: await repository.getCollection(playerId) });
      socket.emit("codex:update", { entries: await repository.getCodex(playerId) });
    });

    socket.on("lobby:leave", () => {
      if (!lobbyCode || !playerId) return;
      const lobby = lobbyManager.getLobby(lobbyCode);
      if (!lobby) return;
      lobby.removePlayer(playerId);
      cleanupIfEmpty(lobbyCode, lobby);
      lobbyCode = null;
    });

    socket.on("disconnect", () => {
      if (!lobbyCode || !playerId) return;
      const lobby = lobbyManager.getLobby(lobbyCode);
      if (!lobby) return;
      const code = lobbyCode;
      const pid = playerId;
      // Grace period so a page refresh or brief network drop doesn't evict
      // the player -- if they reconnect and rejoin before this fires, the
      // removal is cancelled inside Lobby.addPlayer.
      lobby.scheduleRemoval(pid, RECONNECT_GRACE_MS, () => cleanupIfEmpty(code, lobby));
    });

    function cleanupIfEmpty(code: string, lobby: ReturnType<LobbyManager["getLobby"]>) {
      if (!lobby) return;
      if (lobby.players.length === 0) {
        battleRooms.get(code)?.stop();
        battleRooms.delete(code);
        lobbyManager.removeLobby(code);
      } else {
        broadcastLobby(code);
      }
    }
  });
}
