import { EnemyState, GridCoord, MapDefinition, TargetingMode, distance, getEnemyPosition } from "@monsterfall/shared";

export { getEnemyPosition, distance };

export function pathProgressValue(enemy: EnemyState): number {
  return enemy.pathIndex + enemy.pathProgress;
}

export interface TargetableEnemy {
  enemy: EnemyState;
  position: GridCoord;
  distance: number;
}

export function findEnemiesInRange(
  origin: GridCoord,
  range: number,
  enemies: EnemyState[],
  map: MapDefinition
): TargetableEnemy[] {
  return enemies
    .map((enemy) => {
      const position = getEnemyPosition(enemy, map);
      return { enemy, position, distance: distance(origin, position) };
    })
    .filter((e) => e.distance <= range);
}

export function selectTarget(
  candidates: TargetableEnemy[],
  mode: TargetingMode
): TargetableEnemy | null {
  if (candidates.length === 0) return null;
  switch (mode) {
    case TargetingMode.Closest:
      return candidates.reduce((best, c) => (c.distance < best.distance ? c : best));
    case TargetingMode.Strongest:
      return candidates.reduce((best, c) => (c.enemy.currentHealth > best.enemy.currentHealth ? c : best));
    case TargetingMode.First:
      return candidates.reduce((best, c) =>
        pathProgressValue(c.enemy) > pathProgressValue(best.enemy) ? c : best
      );
    case TargetingMode.Last:
      return candidates.reduce((best, c) =>
        pathProgressValue(c.enemy) < pathProgressValue(best.enemy) ? c : best
      );
    default:
      return candidates[0];
  }
}
