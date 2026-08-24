export interface WaveEnemyGroup {
  enemyId: string;
  count: number;
  /** Seconds between individual enemy spawns within the group. */
  spawnIntervalSeconds: number;
}

export interface WaveDefinition {
  wave: number;
  enemies: WaveEnemyGroup[];
  /** Seconds of preparation time before this wave begins spawning. */
  prepSeconds: number;
}

const grunt = (count: number): WaveEnemyGroup => ({ enemyId: "grunt", count, spawnIntervalSeconds: 0.8 });
const brute = (count: number): WaveEnemyGroup => ({ enemyId: "brute", count, spawnIntervalSeconds: 1.4 });
const runner = (count: number): WaveEnemyGroup => ({ enemyId: "runner", count, spawnIntervalSeconds: 0.5 });
const boss = (count: number): WaveEnemyGroup => ({ enemyId: "boss", count, spawnIntervalSeconds: 1 });

export const VERDANT_FOREST_WAVES: WaveDefinition[] = [
  { wave: 1, prepSeconds: 10, enemies: [grunt(5)] },
  { wave: 2, prepSeconds: 12, enemies: [grunt(7)] },
  { wave: 3, prepSeconds: 12, enemies: [grunt(6), runner(3)] },
  { wave: 4, prepSeconds: 14, enemies: [grunt(6), brute(2)] },
  { wave: 5, prepSeconds: 14, enemies: [runner(6), brute(2)] },
  { wave: 6, prepSeconds: 15, enemies: [grunt(8), runner(4)] },
  { wave: 7, prepSeconds: 15, enemies: [brute(4), runner(4)] },
  { wave: 8, prepSeconds: 16, enemies: [grunt(10), brute(3), runner(3)] },
  { wave: 9, prepSeconds: 18, enemies: [brute(5), runner(6)] },
  { wave: 10, prepSeconds: 20, enemies: [grunt(6), brute(2), boss(1)] },
];
