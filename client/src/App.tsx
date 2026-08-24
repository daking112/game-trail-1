import { useEffect, useState } from "react";
import { registerNetworkListeners } from "./network/listeners";
import { registerAudioListeners, unlockAudio, playUiClick, setAudioMuted } from "./audio";
import { useGameStore } from "./state/gameStore";
import HomeScreen from "./screens/HomeScreen";
import LobbyScreen from "./screens/LobbyScreen";
import CollectionScreen from "./screens/CollectionScreen";
import MonsterDetailScreen from "./screens/MonsterDetailScreen";
import CodexScreen from "./screens/CodexScreen";
import BattleScreen from "./screens/BattleScreen";
import HatcheryScreen from "./screens/HatcheryScreen";
import "./App.css";

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const connected = useGameStore((s) => s.connected);
  const userId = useGameStore((s) => s.userId);
  const wallet = useGameStore((s) => s.wallet);
  const [muted, setMuted] = useState(() => localStorage.getItem("monsterfall.muted") === "true");

  useEffect(() => {
    registerNetworkListeners();
    registerAudioListeners();
  }, []);

  useEffect(() => {
    setAudioMuted(muted);
    localStorage.setItem("monsterfall.muted", String(muted));
  }, [muted]);

  return (
    <div
      className="app-shell"
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          unlockAudio();
          playUiClick();
        }
      }}
    >
      <header className="app-header">
        <span className="app-title">MONSTERFALL</span>
        <div className="header-right">
          {userId && (
            <div className="header-wallet">
              <span>💰 {wallet.gold}</span>
              <span>💎 {wallet.crystals}</span>
            </div>
          )}
          <button
            className="mute-toggle"
            onClick={() => setMuted((m) => !m)}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <span className={`connection-dot ${connected ? "connected" : ""}`} title={connected ? "Connected" : "Disconnected"} />
        </div>
      </header>
      <main className="app-main">
        {screen === "home" && <HomeScreen />}
        {screen === "lobby" && <LobbyScreen />}
        {screen === "collection" && <CollectionScreen />}
        {screen === "monsterDetail" && <MonsterDetailScreen />}
        {screen === "codex" && <CodexScreen />}
        {screen === "battle" && <BattleScreen />}
        {screen === "hatchery" && <HatcheryScreen />}
      </main>
    </div>
  );
}
