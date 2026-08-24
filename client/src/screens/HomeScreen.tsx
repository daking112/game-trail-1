import { useState } from "react";
import { socket } from "../network/socket";
import { useGameStore } from "../state/gameStore";

const USERNAME_KEY = "monsterfall.username";

export default function HomeScreen() {
  const [username, setUsername] = useState(() => localStorage.getItem(USERNAME_KEY) ?? "");
  const [joinCode, setJoinCode] = useState("");
  const setScreen = useGameStore((s) => s.setScreen);
  const lobbyError = useGameStore((s) => s.lobbyError);
  const setLobbyError = useGameStore((s) => s.setLobbyError);

  function persistUsername(name: string) {
    setUsername(name);
    localStorage.setItem(USERNAME_KEY, name);
  }

  function identifyAndGo(target: "collection" | "codex" | "hatchery") {
    if (username.trim()) socket.emit("player:identify", { username: username.trim() });
    setScreen(target);
  }

  function handleCreate() {
    if (!username.trim()) return;
    setLobbyError(null);
    socket.emit("lobby:create", { username: username.trim() });
    setScreen("lobby");
  }

  function handleJoin() {
    if (!username.trim() || !joinCode.trim()) return;
    setLobbyError(null);
    socket.emit("lobby:join", { lobbyCode: joinCode.trim().toUpperCase(), username: username.trim() });
    setScreen("lobby");
  }

  return (
    <div className="screen screen-center">
      <h1 style={{ fontSize: 42, letterSpacing: "0.15em", color: "var(--accent)", margin: 0 }}>MONSTERFALL</h1>
      <p style={{ color: "var(--text-dim)", maxWidth: 420 }}>
        Collect original monsters, build a team, and defend the core through waves of Verdant Forest raiders.
      </p>

      <div className="panel" style={{ width: 340 }}>
        <input
          placeholder="Your name"
          value={username}
          onChange={(e) => persistUsername(e.target.value)}
          style={{ width: "100%", marginBottom: 14 }}
        />
        <div className="button-row" style={{ marginBottom: 14 }}>
          <button className="primary" style={{ flex: 1 }} onClick={() => identifyAndGo("collection")} disabled={!username.trim()}>
            COLLECTION
          </button>
          <button style={{ flex: 1 }} onClick={() => identifyAndGo("codex")} disabled={!username.trim()}>
            CODEX
          </button>
        </div>
        <button style={{ width: "100%", marginBottom: 14 }} onClick={() => identifyAndGo("hatchery")} disabled={!username.trim()}>
          🥚 HATCHERY
        </button>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />

        <div style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: 8 }}>
          MULTIPLAYER
        </div>
        <button className="primary" style={{ width: "100%", marginBottom: 10 }} onClick={handleCreate} disabled={!username.trim()}>
          CREATE LOBBY
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Lobby Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ flex: 1 }}
          />
          <button onClick={handleJoin} disabled={!username.trim() || !joinCode.trim()}>
            JOIN
          </button>
        </div>
        {lobbyError && <div style={{ color: "var(--danger)", marginTop: 10, fontSize: 13 }}>{lobbyError}</div>}
      </div>
    </div>
  );
}
