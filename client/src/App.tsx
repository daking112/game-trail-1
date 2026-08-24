import { useEffect } from "react";
import { registerNetworkListeners } from "./network/listeners";
import { useGameStore } from "./state/gameStore";
import HomeScreen from "./screens/HomeScreen";
import LobbyScreen from "./screens/LobbyScreen";
import CollectionScreen from "./screens/CollectionScreen";
import MonsterDetailScreen from "./screens/MonsterDetailScreen";
import CodexScreen from "./screens/CodexScreen";
import BattleScreen from "./screens/BattleScreen";
import "./App.css";

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const connected = useGameStore((s) => s.connected);

  useEffect(() => {
    registerNetworkListeners();
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">MONSTERFALL</span>
        <span className={`connection-dot ${connected ? "connected" : ""}`} title={connected ? "Connected" : "Disconnected"} />
      </header>
      <main className="app-main">
        {screen === "home" && <HomeScreen />}
        {screen === "lobby" && <LobbyScreen />}
        {screen === "collection" && <CollectionScreen />}
        {screen === "monsterDetail" && <MonsterDetailScreen />}
        {screen === "codex" && <CodexScreen />}
        {screen === "battle" && <BattleScreen />}
      </main>
    </div>
  );
}
