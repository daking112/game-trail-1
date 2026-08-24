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

  constructor(public lobbyCode: string) {}

  addPlayer(playerId: string, username: string, socketId: string): { error?: string } {
    if (this.players.length >= MAX_LOBBY_PLAYERS) return { error: "Lobby is full" };
    if (this.started) return { error: "Battle already started" };
    const existing = this.players.find((p) => p.playerId === playerId);
    if (existing) {
      this.socketByPlayer.set(playerId, socketId);
      return {};
    }
    this.players.push({ playerId, username, ready: false, isHost: this.players.length === 0 });
    this.socketByPlayer.set(playerId, socketId);
    return {};
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter((p) => p.playerId !== playerId);
    this.socketByPlayer.delete(playerId);
    if (this.players.length > 0 && !this.players.some((p) => p.isHost)) {
      this.players[0].isHost = true;
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
