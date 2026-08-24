export interface LobbyPlayer {
  playerId: string;
  username: string;
  ready: boolean;
  isHost: boolean;
}

export interface LobbyState {
  lobbyCode: string;
  players: LobbyPlayer[];
  maxPlayers: number;
  mapId: string;
  started: boolean;
}
