import { RARITY_CONFIG, RARITY_ORDER, TRAITS, getMonsterDefinition, statAtLevel } from "@monsterfall/shared";
import { useGameStore } from "../state/gameStore";
import MonsterSprite from "../components/MonsterSprite";

const ELEMENT_ICON: Record<string, string> = {
  Fire: "\u{1F525}",
  Water: "\u{1F4A7}",
  Nature: "\u{1F343}",
  Electric: "\u{26A1}",
  Earth: "\u{1FAA8}",
  Wind: "\u{1F32C}️",
  Ice: "\u{2744}️",
  Shadow: "\u{1F311}",
};

export default function MonsterDetailScreen() {
  const collection = useGameStore((s) => s.collection);
  const selectedInstanceId = useGameStore((s) => s.selectedInstanceId);
  const setScreen = useGameStore((s) => s.setScreen);

  const instance = collection.find((m) => m.instanceId === selectedInstanceId);
  if (!instance) {
    return (
      <div className="screen screen-center">
        <p>Monster not found.</p>
        <button onClick={() => setScreen("collection")}>BACK</button>
      </div>
    );
  }

  const def = getMonsterDefinition(instance.monsterId);
  const rarityConfig = RARITY_CONFIG[def.rarity];
  const stars = RARITY_ORDER.indexOf(def.rarity) + 1;
  const trait = TRAITS[instance.traitId];
  const health = Math.round(statAtLevel(def.baseHealth, instance.level) * rarityConfig.statMultiplier);
  const damage = Math.round(statAtLevel(def.baseDamage, instance.level) * rarityConfig.statMultiplier);
  const nextEvolution = def.evolutions[0] ? getMonsterDefinition(def.evolutions[0].monsterId) : null;

  return (
    <div className="screen">
      <div className="nav-tabs">
        <button onClick={() => setScreen("collection")}>← MY MONSTERS</button>
      </div>

      <div className="panel" style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <MonsterSprite def={def} size={96} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{def.name}</div>
            <div style={{ color: "var(--text-dim)", fontSize: 13, margin: "4px 0" }}>
              {ELEMENT_ICON[def.element]} {def.element.toUpperCase()}
            </div>
            <div style={{ color: rarityConfig.color, letterSpacing: "0.1em" }}>
              {"★".repeat(stars)}
              <span style={{ color: "var(--border)" }}>{"★".repeat(6 - stars)}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: "var(--text-dim)" }}>{def.description}</div>

        <div style={{ fontWeight: 700 }}>Level {instance.level}</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Stat label="HP" value={health} />
          <Stat label="DAMAGE" value={damage} />
          <Stat label="RANGE" value={def.range} />
          <Stat label="SPEED" value={def.attackSpeed.toFixed(1)} />
        </div>

        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em" }}>TRAIT</div>
          <div style={{ fontWeight: 700 }}>{trait?.name.toUpperCase()}</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{trait?.description}</div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em" }}>PASSIVE</div>
          <div style={{ fontSize: 12 }}>{def.passiveDescription}</div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em" }}>EVOLUTION</div>
          {nextEvolution ? (
            <div style={{ fontSize: 13 }}>
              Evolves into <strong>{nextEvolution.name}</strong> at level {def.evolutions[0].requiredLevel}
              {instance.level >= def.evolutions[0].requiredLevel ? " (ready!)" : ""}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Final form</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "var(--bg-panel-light)", borderRadius: 6, padding: "8px 12px", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
