import { EnemyState } from "../types/battle";
import { GridCoord, MapDefinition } from "../types/map";

/** Interpolated enemy position along the map path. Shared so client rendering and server combat agree. */
export function getEnemyPosition(enemy: EnemyState, map: MapDefinition): GridCoord {
  const a = map.path[enemy.pathIndex];
  const b = map.path[Math.min(enemy.pathIndex + 1, map.path.length - 1)];
  return {
    x: a.x + (b.x - a.x) * enemy.pathProgress,
    y: a.y + (b.y - a.y) * enemy.pathProgress,
  };
}

export function distance(a: GridCoord, b: GridCoord): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
