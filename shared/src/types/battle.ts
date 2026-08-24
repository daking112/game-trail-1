import { TargetingMode } from "./ability";

export enum GameState {
  Lobby = "LOBBY",
  TeamSelect = "TEAM_SELECT",
  BattlePreparation = "BATTLE_PREPARATION",
  WaveActive = "WAVE_ACTIVE",
  WaveComplete = "WAVE_COMPLETE",
  BattleVictory = "BATTLE_VICTORY",
  BattleDefeat = "BATTLE_DEFEAT",
}

export interface PlacedMonsterState {
  placementId: string;
  ownerId: string;
  instanceId: string;
  monsterId: string;
  x: number;
  y: number;
  level: number;
  traitId: string;
  currentHealth: number;
  maxHealth: number;
  damage: number;
  attackSpeed: number;
  range: number;
  targetingMode: TargetingMode;
  abilityCooldownRemaining: number;
  ultimateCharge: number;
  ultimateReady: boolean;
  attackCooldownRemaining: number;
}

export interface EnemyState {
  enemyInstanceId: string;
  enemyId: string;
  pathIndex: number;
  /** Fractional progress toward the next path node, 0..1. */
  pathProgress: number;
  currentHealth: number;
  maxHealth: number;
  damage: number;
  movementSpeed: number;
  slowUntil: number;
  slowPercent: number;
  isBoss: boolean;
  tauntedByPlacementId?: string;
  tauntUntil?: number;
}

export interface CoreState {
  currentHealth: number;
  maxHealth: number;
}

export interface BattleStateSnapshot {
  battleId: string;
  gameState: GameState;
  currentWave: number;
  totalWaves: number;
  waveTimer: number;
  placedMonsters: PlacedMonsterState[];
  enemies: EnemyState[];
  core: CoreState;
  gold: number;
  serverTick: number;
  serverTime: number;
}

export interface CombatEvent {
  type: "attack" | "ability" | "ultimate" | "death" | "coreHit" | "capture" | "bossSpawn";
  sourceId?: string;
  targetId?: string;
  damage?: number;
  x?: number;
  y?: number;
}
