import { LobbyPlayer, LobbyState } from "@monsterfall/shared";
import { VERDANT_FOREST_MAP } from "@monsterfall/shared";

export const MAX_LOBBY_PLAYERS = 4;

export class Lobby {
  players: LobbyPlayer[] = [];
  started = false;
  mapId = VERDANT_FOREST_MAP.id;
  /** playerId -> chosen monster instance ids for this battle. */
  teams = new Map<string, string[]>();
  /** playerId -> socket id, kept here so the network layer can address players by playerId. */
  socketByPlayer = new Map<string, string>();
  /** playerId -> pending removal timer, so a page refresh doesn't instantly evict the player. */
  private pendingDisconnects = new Map<string, NodeJS.Timeout>();

  constructor(public lobbyCode: string) {}

  addPlayer(playerId: string, username: string, socketId: string): { error?: string } {
    // A reconnecting player (already in this lobby) can always rejoin, even
    // if the lobby is nominally full or the battle already started.
    const existing = this.players.find((p) => p.playerId === playerId);
    if (existing) {
      this.socketByPlayer.set(playerId, socketId);
      this.cancelPendingRemoval(playerId);
      return {};
    }
    if (this.players.length >= MAX_LOBBY_PLAYERS) return { error: "Lobby is full" };
    if (this.started) return { error: "Battle already started" };
    this.players.push({ playerId, username, ready: false, isHost: this.players.length === 0 });
    this.socketByPlayer.set(playerId, socketId);
    return {};
  }

  removePlayer(playerId: string): void {
    this.cancelPendingRemoval(playerId);
    this.players = this.players.filter((p) => p.playerId !== playerId);
    this.socketByPlayer.delete(playerId);
    if (this.players.length > 0 && !this.players.some((p) => p.isHost)) {
      this.players[0].isHost = true;
    }
  }

  /** Delays a disconnect's removal so a same-player reconnect (refresh, brief drop) can cancel it. */
  scheduleRemoval(playerId: string, delayMs: number, onRemoved: () => void): void {
    this.cancelPendingRemoval(playerId);
    const timer = setTimeout(() => {
      this.pendingDisconnects.delete(playerId);
      this.removePlayer(playerId);
      onRemoved();
    }, delayMs);
    this.pendingDisconnects.set(playerId, timer);
  }

  cancelPendingRemoval(playerId: string): void {
    const timer = this.pendingDisconnects.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.pendingDisconnects.delete(playerId);
    }
  }

  setReady(playerId: string, ready: boolean): void {
    const player = this.players.find((p) => p.playerId === playerId);
    if (player) player.ready = ready;
  }

  allReady(): boolean {
    return this.players.length > 0 && this.players.every((p) => p.ready);
  }

  toState(): LobbyState {
    return {
      lobbyCode: this.lobbyCode,
      players: this.players,
      maxPlayers: MAX_LOBBY_PLAYERS,
      mapId: this.mapId,
      started: this.started,
    };
  }
}
