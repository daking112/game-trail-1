import { socket } from "../network/socket";
import { clearSavedLobbyCode } from "../network/session";
import { useGameStore } from "../state/gameStore";

export default function LobbyScreen() {
  const lobby = useGameStore((s) => s.lobby);
  const lobbyError = useGameStore((s) => s.lobbyError);
  const userId = useGameStore((s) => s.userId);
  const setScreen = useGameStore((s) => s.setScreen);
  const collection = useGameStore((s) => s.collection);

  function leave() {
    socket.emit("lobby:leave");
    clearSavedLobbyCode();
    setScreen("home");
  }

  if (!lobby) {
    return (
      <div className="screen screen-center">
        <div className="panel">
          <p>{lobbyError ?? "Connecting to lobby..."}</p>
          <button onClick={() => setScreen("home")}>BACK</button>
        </div>
      </div>
    );
  }

  const self = lobby.players.find((p) => p.playerId === userId);
  const allReady = lobby.players.length > 0 && lobby.players.every((p) => p.ready);
  const emptySlots = Math.max(0, lobby.maxPlayers - lobby.players.length);

  return (
    <div className="screen screen-center">
      <div className="panel" style={{ width: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 6, color: "var(--text-dim)", fontSize: 12, letterSpacing: "0.08em" }}>
          LOBBY CODE
        </div>
        <div style={{ textAlign: "center", fontSize: 32, fontWeight: 800, letterSpacing: "0.15em", color: "var(--accent)", marginBottom: 20 }}>
          {lobby.lobbyCode}
        </div>

        <div style={{ fontSize: 12, letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: 10 }}>
          PLAYERS ({lobby.players.length}/{lobby.maxPlayers})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {lobby.players.map((p) => (
            <div
              key={p.playerId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--bg-panel-light)",
                borderRadius: 6,
                border: "1px solid var(--border)",
              }}
            >
              <span>
                {p.username}
                {p.isHost && <span style={{ color: "var(--accent)", fontSize: 11, marginLeft: 6 }}>HOST</span>}
                {p.playerId === userId && <span style={{ color: "var(--text-dim)", fontSize: 11, marginLeft: 6 }}>(you)</span>}
              </span>
              <span style={{ color: p.ready ? "var(--success)" : "var(--text-dim)", fontWeight: 700, fontSize: 12 }}>
                {p.ready ? "READY" : "NOT READY"}
              </span>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{ padding: "10px 14px", borderRadius: 6, border: "1px dashed var(--border)", color: "var(--text-dim)" }}
            >
              --
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>
          Collection: {collection.length} monster{collection.length === 1 ? "" : "s"} available
        </div>

        <div className="button-row">
          <button
            className={self?.ready ? "" : "primary"}
            style={{ flex: 1 }}
            onClick={() => socket.emit("lobby:ready", { ready: !self?.ready })}
          >
            {self?.ready ? "UNREADY" : "READY"}
          </button>
          {self?.isHost && (
            <button className="primary" style={{ flex: 1 }} disabled={!allReady} onClick={() => socket.emit("lobby:start")}>
              START
            </button>
          )}
        </div>
        {lobbyError && <div style={{ color: "var(--danger)", marginTop: 10, fontSize: 13 }}>{lobbyError}</div>}
        <button style={{ width: "100%", marginTop: 14 }} onClick={leave}>
          LEAVE
        </button>
      </div>
    </div>
  );
}
