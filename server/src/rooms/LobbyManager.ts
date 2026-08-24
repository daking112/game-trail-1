import { Lobby } from "./Lobby";

function randomLobbyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export class LobbyManager {
  private lobbies = new Map<string, Lobby>();

  createLobby(): Lobby {
    let code = randomLobbyCode();
    while (this.lobbies.has(code)) code = randomLobbyCode();
    const lobby = new Lobby(code);
    this.lobbies.set(code, lobby);
    return lobby;
  }

  getLobby(code: string): Lobby | undefined {
    return this.lobbies.get(code.toUpperCase());
  }

  removeLobby(code: string): void {
    this.lobbies.delete(code);
  }
}
