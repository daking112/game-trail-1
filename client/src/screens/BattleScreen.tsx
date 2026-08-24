import { getMonsterDefinition } from "@monsterfall/shared";
import { useGameStore } from "../state/gameStore";
import { socket } from "../network/socket";
import PhaserGame from "../game/PhaserGame";
import MonsterSprite from "../components/MonsterSprite";
import "./BattleScreen.css";

export default function BattleScreen() {
  const snapshot = useGameStore((s) => s.battleSnapshot);
  const collection = useGameStore((s) => s.collection);
  const userId = useGameStore((s) => s.userId);
  const selectedForPlacementId = useGameStore((s) => s.selectedForPlacementId);
  const setSelectedForPlacementId = useGameStore((s) => s.setSelectedForPlacementId);
  const captureOffer = useGameStore((s) => s.captureOffer);
  const captureResult = useGameStore((s) => s.captureResult);
  const battleResult = useGameStore((s) => s.battleResult);
  const setScreen = useGameStore((s) => s.setScreen);
  const setCaptureResult = useGameStore((s) => s.setCaptureResult);

  const placedInstanceIds = new Set(snapshot?.placedMonsters.filter((m) => m.ownerId === userId).map((m) => m.instanceId));
  const bench = collection.filter((m) => !placedInstanceIds.has(m.instanceId));
  const myMonsters = snapshot?.placedMonsters.filter((m) => m.ownerId === userId) ?? [];

  return (
    <div className="battle-layout">
      <div className="battle-canvas-wrap">
        <PhaserGame />
        {snapshot && (
          <div className="wave-banner">
            {snapshot.gameState === "BATTLE_PREPARATION" && `PREPARE — WAVE ${snapshot.currentWave} / ${snapshot.totalWaves} (${Math.ceil(snapshot.waveTimer)}s)`}
            {snapshot.gameState === "WAVE_ACTIVE" && `WAVE ${snapshot.currentWave} / ${snapshot.totalWaves}`}
            {snapshot.gameState === "WAVE_COMPLETE" && `WAVE ${snapshot.currentWave} COMPLETE`}
          </div>
        )}
      </div>

      <aside className="battle-sidebar panel">
        {snapshot && (
          <>
            <div className="stat-row">
              <span>CORE</span>
              <div className="bar">
                <div className="bar-fill core" style={{ width: `${(snapshot.core.currentHealth / snapshot.core.maxHealth) * 100}%` }} />
              </div>
              <span>{snapshot.core.currentHealth}/{snapshot.core.maxHealth}</span>
            </div>
            <div className="stat-row">
              <span>GOLD</span>
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>{snapshot.gold}</span>
            </div>
          </>
        )}

        <div className="sidebar-section-title">YOUR TEAM</div>
        <div className="team-list">
          {myMonsters.map((m) => (
            <div key={m.placementId} className="team-row">
              <span>{getMonsterDefinition(m.monsterId).name}</span>
              <span style={{ color: "var(--text-dim)", fontSize: 11 }}>
                {Math.round((m.currentHealth / m.maxHealth) * 100)}% HP {m.ultimateReady ? "★ ULT READY" : ""}
              </span>
            </div>
          ))}
          {myMonsters.length === 0 && <div className="team-row-empty">No monsters deployed yet</div>}
        </div>

        <div className="sidebar-section-title">DEPLOY (tap monster, then a green tile)</div>
        <div className="bench-grid">
          {bench.map((instance) => {
            const def = getMonsterDefinition(instance.monsterId);
            const selected = selectedForPlacementId === instance.instanceId;
            return (
              <button
                key={instance.instanceId}
                className="bench-item"
                style={{ borderColor: selected ? "var(--accent)" : undefined }}
                onClick={() => setSelectedForPlacementId(selected ? null : instance.instanceId)}
              >
                <MonsterSprite def={def} size={32} />
                <span style={{ fontSize: 11 }}>{def.name}</span>
                <span style={{ fontSize: 10, color: "var(--text-dim)" }}>Lv.{instance.level}</span>
              </button>
            );
          })}
          {bench.length === 0 && <div className="team-row-empty">All monsters deployed</div>}
        </div>
      </aside>

      {captureOffer && (
        <div className="modal-overlay">
          <div className="panel modal">
            <div style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.08em" }}>WILD MONSTER DEFEATED</div>
            <MonsterSprite def={getMonsterDefinition(captureOffer.monsterId)} size={72} />
            <div style={{ fontSize: 20, fontWeight: 800 }}>{getMonsterDefinition(captureOffer.monsterId).name}</div>
            <div>HP: {Math.round(captureOffer.enemyHealthPercent * 100)}%</div>
            <div>Capture Chance: {Math.round(captureOffer.captureChance * 100)}%</div>
            <button
              className="primary"
              onClick={() => socket.emit("battle:capture", { encounterId: captureOffer.encounterId })}
            >
              CAPTURE
            </button>
          </div>
        </div>
      )}

      {captureResult && !captureOffer && (
        <div className="modal-overlay" onClick={() => setCaptureResult(null)}>
          <div className="panel modal">
            {captureResult.success ? (
              <>
                <div style={{ color: "var(--success)", fontWeight: 800, fontSize: 18 }}>CAPTURE SUCCESS!</div>
                <div>{getMonsterDefinition(captureResult.monsterId).name} joined your collection!</div>
              </>
            ) : (
              <div style={{ color: "var(--danger)" }}>{getMonsterDefinition(captureResult.monsterId).name} escaped!</div>
            )}
            <button onClick={() => setCaptureResult(null)}>OK</button>
          </div>
        </div>
      )}

      {battleResult && (
        <div className="modal-overlay">
          <div className="panel modal">
            {battleResult.type === "victory" ? (
              <>
                <div style={{ color: "var(--success)", fontWeight: 800, fontSize: 24 }}>VICTORY!</div>
                <div>Gold earned: {battleResult.goldEarned}</div>
              </>
            ) : (
              <div style={{ color: "var(--danger)", fontWeight: 800, fontSize: 24 }}>DEFEAT</div>
            )}
            <button className="primary" onClick={() => setScreen("home")}>
              RETURN HOME
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
