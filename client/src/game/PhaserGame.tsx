import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { VERDANT_FOREST_MAP } from "@monsterfall/shared";
import { BattleScene } from "./scenes/BattleScene";
import { CELL_SIZE } from "./gridUtils";

export default function PhaserGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      width: VERDANT_FOREST_MAP.cols * CELL_SIZE,
      height: VERDANT_FOREST_MAP.rows * CELL_SIZE,
      parent: containerRef.current,
      backgroundColor: "#141b22",
      scene: [BattleScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="phaser-container" />;
}
