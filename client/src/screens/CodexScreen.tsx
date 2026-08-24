import { MONSTERS, STARTER_MONSTER_IDS } from "@monsterfall/shared";
import { useGameStore } from "../state/gameStore";
import MonsterSprite from "../components/MonsterSprite";

export default function CodexScreen() {
  const codex = useGameStore((s) => s.codex);
  const setScreen = useGameStore((s) => s.setScreen);

  const entryFor = (monsterId: string) => codex.find((c) => c.monsterId === monsterId);

  return (
    <div className="screen">
      <div className="nav-tabs">
        <button onClick={() => setScreen("home")}>← HOME</button>
        <button onClick={() => setScreen("collection")}>MY MONSTERS</button>
        <button className="active">CODEX</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {STARTER_MONSTER_IDS.map((monsterId) => {
          const def = MONSTERS[monsterId];
          const entry = entryFor(monsterId);
          const discovered = !!entry?.seen;

          if (!discovered) {
            return (
              <div key={monsterId} className="panel" style={{ display: "flex", gap: 12, alignItems: "center", opacity: 0.6 }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, background: "var(--bg-panel-light)", border: "1px dashed var(--border)" }} />
                <div>
                  <div style={{ fontWeight: 700 }}>???</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Unknown creature</div>
                </div>
              </div>
            );
          }

          return (
            <div key={monsterId} className="panel" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <MonsterSprite def={def} size={56} />
              <div>
                <div style={{ fontWeight: 700 }}>{def.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{def.element} &middot; {def.rarity}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", margin: "4px 0" }}>{def.description}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Habitat: {def.habitat}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {entry?.captured && <Badge label="CAPTURED" color="var(--success)" />}
                  {entry?.evolved && <Badge label="EVOLVED" color="var(--accent)" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 4, padding: "2px 6px" }}>
      {label}
    </span>
  );
}
