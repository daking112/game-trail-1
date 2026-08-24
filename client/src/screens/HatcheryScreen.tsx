import { EGGS, EggType, getMonsterDefinition } from "@monsterfall/shared";
import { useGameStore } from "../state/gameStore";
import { socket } from "../network/socket";
import MonsterSprite from "../components/MonsterSprite";
import "./HatcheryScreen.css";

const EGG_ORDER = [EggType.Basic, EggType.Rare, EggType.Ancient, EggType.Elemental, EggType.Legendary];

export default function HatcheryScreen() {
  const wallet = useGameStore((s) => s.wallet);
  const eggResult = useGameStore((s) => s.eggResult);
  const setEggResult = useGameStore((s) => s.setEggResult);
  const setScreen = useGameStore((s) => s.setScreen);

  function canAfford(eggType: EggType): boolean {
    const cost = EGGS[eggType].cost;
    return (cost.gold ?? 0) <= wallet.gold && (cost.crystals ?? 0) <= wallet.crystals;
  }

  return (
    <div className="screen">
      <div className="nav-tabs">
        <button onClick={() => setScreen("home")}>← HOME</button>
        <button onClick={() => setScreen("collection")}>MY MONSTERS</button>
        <button className="active">HATCHERY</button>
      </div>

      <div className="wallet-row">
        <span>💰 {wallet.gold} Gold</span>
        <span>💎 {wallet.crystals} Crystals</span>
      </div>

      <div className="egg-grid">
        {EGG_ORDER.map((eggType) => {
          const egg = EGGS[eggType];
          const affordable = canAfford(eggType);
          return (
            <div key={eggType} className="panel egg-card">
              <div className="egg-icon">🥚</div>
              <div style={{ fontWeight: 700 }}>{egg.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", minHeight: 34 }}>{egg.description}</div>
              <div style={{ fontSize: 12 }}>
                {egg.cost.gold ? `💰 ${egg.cost.gold}` : ""} {egg.cost.crystals ? `💎 ${egg.cost.crystals}` : ""}
              </div>
              <button
                className="primary"
                disabled={!affordable}
                onClick={() => socket.emit("shop:purchaseEgg", { eggType })}
              >
                HATCH
              </button>
            </div>
          );
        })}
      </div>

      {eggResult && (
        <div className="modal-overlay" onClick={() => setEggResult(null)}>
          <div className="panel modal">
            {eggResult.success && eggResult.monsterId ? (
              <>
                <div style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.08em" }}>IT HATCHED!</div>
                <MonsterSprite def={getMonsterDefinition(eggResult.monsterId)} size={80} />
                <div style={{ fontSize: 20, fontWeight: 800 }}>{getMonsterDefinition(eggResult.monsterId).name}</div>
                <div style={{ color: "var(--success)" }}>Joined your collection!</div>
              </>
            ) : (
              <div style={{ color: "var(--danger)" }}>{eggResult.message ?? "The egg didn't hatch."}</div>
            )}
            <button onClick={() => setEggResult(null)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
