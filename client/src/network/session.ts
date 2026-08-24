const USERNAME_KEY = "monsterfall.username";
const LOBBY_CODE_KEY = "monsterfall.lobbyCode";

export function getSavedUsername(): string {
  return localStorage.getItem(USERNAME_KEY) ?? "";
}

export function saveUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
}

export function getSavedLobbyCode(): string | null {
  return sessionStorage.getItem(LOBBY_CODE_KEY);
}

export function saveLobbyCode(lobbyCode: string): void {
  sessionStorage.setItem(LOBBY_CODE_KEY, lobbyCode);
}

export function clearSavedLobbyCode(): void {
  sessionStorage.removeItem(LOBBY_CODE_KEY);
}
