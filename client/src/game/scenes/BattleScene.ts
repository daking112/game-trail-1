import Phaser from "phaser";
import {
  ENEMIES,
  MapDefinition,
  TargetingMode,
  VERDANT_FOREST_MAP,
  getEnemyPosition,
  getMonsterDefinition,
  isPathTile,
  isPlacementTile,
} from "@monsterfall/shared";
import { useGameStore } from "../../state/gameStore";
import { socket } from "../../network/socket";
import { CELL_SIZE, gridToPixel, pixelToGrid } from "../gridUtils";

const TARGETING_CYCLE: TargetingMode[] = [
  TargetingMode.Closest,
  TargetingMode.First,
  TargetingMode.Last,
  TargetingMode.Strongest,
];

const TARGETING_LABEL: Record<TargetingMode, string> = {
  [TargetingMode.Closest]: "C",
  [TargetingMode.First]: "F",
  [TargetingMode.Last]: "L",
  [TargetingMode.Strongest]: "S",
};

export class BattleScene extends Phaser.Scene {
  private map: MapDefinition = VERDANT_FOREST_MAP;
  private entityLayer!: Phaser.GameObjects.Graphics;
  private hoverTile: { x: number; y: number } | null = null;

  constructor() {
    super("BattleScene");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#141b22");
    this.drawStaticGrid();
    this.entityLayer = this.add.graphics();

    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.hoverTile = pixelToGrid(p.x, p.y);
    });

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const { x, y } = pixelToGrid(p.x, p.y);
      this.handleTileClick(x, y);
    });
  }

  private handleTileClick(x: number, y: number): void {
    const store = useGameStore.getState();
    const snapshot = store.battleSnapshot;
    if (!snapshot) return;

    const myMonsterHere = snapshot.placedMonsters.find(
      (m) => m.x === x && m.y === y && m.ownerId === store.userId
    );
    if (myMonsterHere) {
      if (myMonsterHere.ultimateReady) {
        socket.emit("battle:activateUltimate", { placementId: myMonsterHere.placementId });
      } else {
        const currentIndex = TARGETING_CYCLE.indexOf(myMonsterHere.targetingMode);
        const next = TARGETING_CYCLE[(currentIndex + 1) % TARGETING_CYCLE.length];
        socket.emit("battle:setTargetingMode", { placementId: myMonsterHere.placementId, mode: next });
      }
      return;
    }

    const instanceId = store.selectedForPlacementId;
    if (!instanceId) return;
    if (!isPlacementTile(this.map, x, y)) return;
    const occupied = snapshot.placedMonsters.some((m) => m.x === x && m.y === y);
    if (occupied) return;

    socket.emit("battle:placeMonster", { instanceId, x, y });
    store.setSelectedForPlacementId(null);
  }

  private drawStaticGrid(): void {
    const g = this.add.graphics();
    for (let x = 0; x < this.map.cols; x++) {
      for (let y = 0; y < this.map.rows; y++) {
        const isPath = isPathTile(this.map, x, y);
        const isPlacement = isPlacementTile(this.map, x, y);
        const color = isPath ? 0x3a3120 : isPlacement ? 0x1f2e24 : 0x161c22;
        g.fillStyle(color, 1);
        g.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);
        if (isPlacement) {
          g.lineStyle(1, 0x2f6b46, 0.8);
          g.strokeRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 6, CELL_SIZE - 6);
        }
      }
    }

    // Path direction arrows
    g.fillStyle(0x6b5a33, 1);
    for (let i = 0; i < this.map.path.length - 1; i++) {
      const a = this.map.path[i];
      const b = this.map.path[i + 1];
      const { px: ax, py: ay } = gridToPixel(a.x, a.y);
      const { px: bx, py: by } = gridToPixel(b.x, b.y);
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      g.fillCircle(mx, my, 2);
    }

    const core = this.map.path[this.map.path.length - 1];
    const { px, py } = gridToPixel(core.x, core.y);
    g.fillStyle(0xffb648, 1);
    g.fillCircle(px, py, CELL_SIZE * 0.28);

    const spawn = this.map.path[0];
    const spawnPx = gridToPixel(spawn.x, spawn.y);
    g.lineStyle(2, 0xff5d5d, 0.8);
    g.strokeCircle(spawnPx.px, spawnPx.py, CELL_SIZE * 0.3);
  }

  update(): void {
    const store = useGameStore.getState();
    const snapshot = store.battleSnapshot;
    const g = this.entityLayer;
    g.clear();

    if (store.selectedForPlacementId && this.hoverTile) {
      const valid =
        isPlacementTile(this.map, this.hoverTile.x, this.hoverTile.y) &&
        !(snapshot?.placedMonsters.some((m) => m.x === this.hoverTile!.x && m.y === this.hoverTile!.y) ?? false);
      const { px, py } = gridToPixel(this.hoverTile.x, this.hoverTile.y);
      g.lineStyle(2, valid ? 0x4fd1a5 : 0xff5d5d, 1);
      g.strokeRect(px - CELL_SIZE / 2 + 3, py - CELL_SIZE / 2 + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    }

    if (!snapshot) return;

    for (const enemy of snapshot.enemies) {
      const pos = getEnemyPosition(enemy, this.map);
      const { px, py } = gridToPixel(pos.x, pos.y);
      const def = ENEMIES[enemy.enemyId];
      const radius = enemy.isBoss ? 20 : 11;
      g.fillStyle(Phaser.Display.Color.HexStringToColor(def.sprite.color).color, 1);
      g.fillCircle(px, py, radius);
      if (enemy.tauntedByPlacementId) {
        g.lineStyle(2, 0xffb648, 1);
        g.strokeCircle(px, py, radius + 3);
      }
      if (enemy.slowUntil > 0) {
        g.lineStyle(1, 0x80deea, 0.8);
        g.strokeCircle(px, py, radius + 5);
      }
      drawHealthBar(g, px, py - radius - 8, enemy.currentHealth / enemy.maxHealth, enemy.isBoss ? 0xff5d5d : 0xe0704b);
    }

    for (const monster of snapshot.placedMonsters) {
      const { px, py } = gridToPixel(monster.x, monster.y);
      const def = getMonsterDefinition(monster.monsterId);
      const isMine = monster.ownerId === store.userId;
      g.fillStyle(Phaser.Display.Color.HexStringToColor(def.sprite.color).color, 1);
      g.fillRoundedRect(px - 18, py - 18, 36, 36, 6);
      g.lineStyle(isMine ? 2 : 1, isMine ? 0xffffff : 0x888888, isMine ? 0.9 : 0.5);
      g.strokeRoundedRect(px - 18, py - 18, 36, 36, 6);

      drawHealthBar(g, px, py - 26, monster.currentHealth / monster.maxHealth, 0x4fd1a5);

      // Range indicator only for own monsters, subtle
      if (isMine) {
        g.lineStyle(1, 0xffffff, 0.08);
        g.strokeCircle(px, py, monster.range * CELL_SIZE);
      }

      // Ultimate charge ring
      const angle = (monster.ultimateCharge / 100) * Math.PI * 2;
      g.lineStyle(3, monster.ultimateReady ? 0xffd600 : 0x556270, 1);
      g.beginPath();
      g.arc(px, py, 24, -Math.PI / 2, -Math.PI / 2 + angle, false);
      g.strokePath();
    }

    this.drawLabels(snapshot);
  }

  private labelTexts: Phaser.GameObjects.Text[] = [];

  private drawLabels(snapshot: NonNullable<ReturnType<typeof useGameStore.getState>["battleSnapshot"]>): void {
    for (const t of this.labelTexts) t.destroy();
    this.labelTexts = [];
    for (const monster of snapshot.placedMonsters) {
      const { px, py } = gridToPixel(monster.x, monster.y);
      const label = this.add.text(px, py, TARGETING_LABEL[monster.targetingMode], {
        fontSize: "11px",
        color: "#0a0d10",
        fontStyle: "bold",
      });
      label.setOrigin(0.5);
      this.labelTexts.push(label);
    }
  }
}

function drawHealthBar(g: Phaser.GameObjects.Graphics, cx: number, cy: number, ratio: number, color: number): void {
  const width = 30;
  const height = 4;
  g.fillStyle(0x000000, 0.5);
  g.fillRect(cx - width / 2, cy, width, height);
  g.fillStyle(color, 1);
  g.fillRect(cx - width / 2, cy, width * Math.max(0, Math.min(1, ratio)), height);
}
