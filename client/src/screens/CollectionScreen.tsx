import { getMonsterDefinition } from "@monsterfall/shared";
import { useGameStore } from "../state/gameStore";
import MonsterSprite from "../components/MonsterSprite";

const MAX_INVENTORY = 100;

export default function CollectionScreen() {
  const collection = useGameStore((s) => s.collection);
  const setScreen = useGameStore((s) => s.setScreen);
  const setSelectedInstanceId = useGameStore((s) => s.setSelectedInstanceId);

  return (
    <div className="screen">
      <div className="nav-tabs">
        <button onClick={() => setScreen("home")}>← HOME</button>
        <button className="active">MY MONSTERS</button>
        <button onClick={() => setScreen("codex")}>CODEX</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {collection.map((instance) => {
          const def = getMonsterDefinition(instance.monsterId);
          return (
            <button
              key={instance.instanceId}
              className="panel"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 16 }}
              onClick={() => {
                setSelectedInstanceId(instance.instanceId);
                setScreen("monsterDetail");
              }}
            >
              <MonsterSprite def={def} size={56} />
              <div style={{ fontWeight: 700, fontSize: 13 }}>{def.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Lv. {instance.level}</div>
            </button>
          );
        })}
        {collection.length === 0 && (
          <div style={{ color: "var(--text-dim)", gridColumn: "1 / -1", textAlign: "center", padding: 40 }}>
            No monsters yet. Join a battle to start capturing!
          </div>
        )}
      </div>

      <div style={{ color: "var(--text-dim)", fontSize: 13 }}>
        Inventory: {collection.length} / {MAX_INVENTORY}
      </div>
    </div>
  );
}
