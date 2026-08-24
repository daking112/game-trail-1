import { v4 as uuid } from "uuid";
import {
  ABILITIES,
  AbilityDefinition,
  AbilityEffectType,
  BattleStateSnapshot,
  CombatEvent,
  CoreState,
  EnemyState,
  GameState,
  MapDefinition,
  MonsterDefinition,
  PlacedMonsterState,
  RARITY_CONFIG,
  TargetingMode,
  WaveDefinition,
  getEnemyDefinition,
  getMonsterDefinition,
  statAtLevel,
} from "@monsterfall/shared";
import { findEnemiesInRange, getEnemyPosition, selectTarget } from "../systems/targeting";
import { computeAbilityCooldownSeconds, computeAttackIntervalSeconds, computeDamage } from "../systems/combat";
import { getEffectiveModifiers } from "../systems/traitModifiers";

const ULTIMATE_POWER_MULTIPLIER = 2.5;
const NEAR_ALLY_RADIUS = 1.6;
const KILL_BUFF_DURATION_SECONDS = 5;
const WAVE_COMPLETE_PAUSE_SECONDS = 2.5;
const CORE_MAX_HEALTH = 100;
const STARTING_GOLD = 100;

interface PoisonStack {
  dps: number;
  until: number;
}

export interface PlaceMonsterParams {
  ownerId: string;
  instanceId: string;
  monsterId: string;
  level: number;
  traitId: string;
  x: number;
  y: number;
}

export interface BattleSimulationCallbacks {
  onEvent: (event: CombatEvent) => void;
  onWaveStart: (wave: number, totalWaves: number) => void;
  onWaveComplete: (wave: number) => void;
  onVictory: (goldEarned: number, xpAwarded: Record<string, number>) => void;
  onDefeat: (xpAwarded: Record<string, number>) => void;
}

/**
 * Server-authoritative tick simulation for a single tower-defense battle.
 * Clients never compute damage, health, or wave state themselves -- they
 * only render whatever snapshot this class produces.
 */
export class BattleSimulation {
  readonly battleId = uuid();
  private gameState: GameState = GameState.BattlePreparation;
  private currentWave = 1;
  private waveTimer: number;
  private placedMonsters: PlacedMonsterState[] = [];
  private enemies: EnemyState[] = [];
  private core: CoreState = { currentHealth: CORE_MAX_HEALTH, maxHealth: CORE_MAX_HEALTH };
  private gold = STARTING_GOLD;
  private serverTick = 0;

  private spawnSchedule: { enemyId: string; at: number }[] = [];
  private waveSpawnElapsed = 0;
  private spawnCursor = 0;

  private poisonStacks = new Map<string, PoisonStack[]>();
  private killBuffUntil = new Map<string, number>();
  private xpAccumulator = new Map<string, number>();
  private simulatedSeconds = 0;
  private running = true;

  constructor(
    private map: MapDefinition,
    private waves: WaveDefinition[],
    private callbacks: BattleSimulationCallbacks
  ) {
    this.waveTimer = waves[0].prepSeconds;
  }

  getSnapshot(): BattleStateSnapshot {
    return {
      battleId: this.battleId,
      gameState: this.gameState,
      currentWave: this.currentWave,
      totalWaves: this.waves.length,
      waveTimer: Math.max(0, this.waveTimer),
      placedMonsters: this.placedMonsters,
      enemies: this.enemies,
      core: this.core,
      gold: this.gold,
      serverTick: this.serverTick,
      serverTime: Date.now(),
    };
  }

  placeMonster(params: PlaceMonsterParams): PlacedMonsterState | { error: string } {
    if (this.gameState !== GameState.BattlePreparation && this.gameState !== GameState.WaveActive) {
      return { error: "Cannot place monsters right now" };
    }
    if (!this.map.placementTiles.some((t) => t.x === params.x && t.y === params.y)) {
      return { error: "Invalid placement tile" };
    }
    if (this.placedMonsters.some((m) => m.x === params.x && m.y === params.y)) {
      return { error: "Tile already occupied" };
    }
    const def = getMonsterDefinition(params.monsterId);
    const rarityMult = RARITY_CONFIG[def.rarity].statMultiplier;
    const maxHealth = Math.round(statAtLevel(def.baseHealth, params.level) * rarityMult);
    const placed: PlacedMonsterState = {
      placementId: uuid(),
      ownerId: params.ownerId,
      instanceId: params.instanceId,
      monsterId: params.monsterId,
      x: params.x,
      y: params.y,
      level: params.level,
      traitId: params.traitId,
      currentHealth: maxHealth,
      maxHealth,
      damage: Math.round(statAtLevel(def.baseDamage, params.level) * rarityMult),
      attackSpeed: def.attackSpeed,
      range: def.range,
      targetingMode: TargetingMode.Closest,
      abilityCooldownRemaining: 0,
      ultimateCharge: 0,
      ultimateReady: false,
      attackCooldownRemaining: 0,
    };
    this.placedMonsters.push(placed);
    return placed;
  }

  setTargetingMode(placementId: string, mode: TargetingMode): void {
    const monster = this.placedMonsters.find((m) => m.placementId === placementId);
    if (monster) monster.targetingMode = mode;
  }

  activateUltimate(placementId: string): boolean {
    const monster = this.placedMonsters.find((m) => m.placementId === placementId);
    if (!monster || !monster.ultimateReady) return false;
    const def = getMonsterDefinition(monster.monsterId);
    const ability = ABILITIES[def.abilityId];
    this.applyAbilityEffect(monster, def, ability, ULTIMATE_POWER_MULTIPLIER);
    monster.ultimateCharge = 0;
    monster.ultimateReady = false;
    this.callbacks.onEvent({ type: "ultimate", sourceId: monster.placementId, x: monster.x, y: monster.y });
    return true;
  }

  tick(dtSeconds: number): void {
    if (!this.running) return;
    this.serverTick += 1;
    this.simulatedSeconds += dtSeconds;

    if (this.gameState === GameState.BattlePreparation) {
      this.waveTimer -= dtSeconds;
      if (this.waveTimer <= 0) {
        this.beginWave();
      }
      return;
    }

    if (this.gameState === GameState.WaveComplete) {
      this.waveTimer -= dtSeconds;
      if (this.waveTimer <= 0) {
        if (this.currentWave >= this.waves.length) {
          this.gameState = GameState.BattleVictory;
          this.running = false;
          this.callbacks.onVictory(this.gold, this.flushXp());
        } else {
          this.currentWave += 1;
          this.gameState = GameState.BattlePreparation;
          this.waveTimer = this.waves[this.currentWave - 1].prepSeconds;
        }
      }
      return;
    }

    if (this.gameState !== GameState.WaveActive) return;

    this.updateSpawning(dtSeconds);
    this.updateEnemies(dtSeconds);
    this.updatePoison(dtSeconds);
    this.updateMonsters(dtSeconds);

    if (this.core.currentHealth <= 0) {
      this.core.currentHealth = 0;
      this.gameState = GameState.BattleDefeat;
      this.running = false;
      this.callbacks.onDefeat(this.flushXp());
      return;
    }

    const waveFullySpawned = this.spawnCursor >= this.spawnSchedule.length;
    if (waveFullySpawned && this.enemies.length === 0) {
      this.callbacks.onWaveComplete(this.currentWave);
      this.gameState = GameState.WaveComplete;
      this.waveTimer = WAVE_COMPLETE_PAUSE_SECONDS;
    }
  }

  private flushXp(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [instanceId, xp] of this.xpAccumulator.entries()) result[instanceId] = xp;
    this.xpAccumulator.clear();
    return result;
  }

  private beginWave(): void {
    this.gameState = GameState.WaveActive;
    const wave = this.waves[this.currentWave - 1];
    this.spawnSchedule = buildSpawnSchedule(wave);
    this.waveSpawnElapsed = 0;
    this.spawnCursor = 0;
    this.callbacks.onWaveStart(this.currentWave, this.waves.length);
  }

  private updateSpawning(dt: number): void {
    this.waveSpawnElapsed += dt;
    const waveMultiplier = 1 + (this.currentWave - 1) * 0.12;
    const damageMultiplier = 1 + (this.currentWave - 1) * 0.06;
    while (
      this.spawnCursor < this.spawnSchedule.length &&
      this.spawnSchedule[this.spawnCursor].at <= this.waveSpawnElapsed
    ) {
      const entry = this.spawnSchedule[this.spawnCursor];
      this.spawnCursor += 1;
      const def = getEnemyDefinition(entry.enemyId);
      const maxHealth = Math.round(def.baseHealth * waveMultiplier);
      const spawned: EnemyState = {
        enemyInstanceId: uuid(),
        enemyId: def.id,
        pathIndex: 0,
        pathProgress: 0,
        currentHealth: maxHealth,
        maxHealth,
        damage: Math.round(def.baseDamage * damageMultiplier),
        movementSpeed: def.movementSpeed,
        slowUntil: 0,
        slowPercent: 0,
        isBoss: !!def.isBoss,
      };
      this.enemies.push(spawned);
      if (spawned.isBoss) {
        const pos = this.map.path[0];
        this.callbacks.onEvent({ type: "bossSpawn", targetId: spawned.enemyInstanceId, x: pos.x, y: pos.y });
      }
    }
  }

  private updateEnemies(dt: number): void {
    const now = this.simulatedSeconds;
    const survivors: EnemyState[] = [];
    for (const enemy of this.enemies) {
      if (enemy.tauntedByPlacementId && enemy.tauntUntil && enemy.tauntUntil > now) {
        const target = this.placedMonsters.find((m) => m.placementId === enemy.tauntedByPlacementId);
        if (target && target.currentHealth > 0) {
          target.currentHealth = Math.max(0, target.currentHealth - enemy.damage * dt);
          survivors.push(enemy);
          continue;
        }
      } else if (enemy.tauntedByPlacementId) {
        enemy.tauntedByPlacementId = undefined;
        enemy.tauntUntil = undefined;
      }

      const slowMultiplier = enemy.slowUntil > now ? 1 - enemy.slowPercent / 100 : 1;
      const progressDelta = enemy.movementSpeed * Math.max(0.1, slowMultiplier) * dt;
      enemy.pathProgress += progressDelta;
      while (enemy.pathProgress >= 1 && enemy.pathIndex < this.map.path.length - 1) {
        enemy.pathProgress -= 1;
        enemy.pathIndex += 1;
      }

      if (enemy.pathIndex >= this.map.path.length - 1 && enemy.pathProgress >= 1) {
        this.core.currentHealth = Math.max(0, this.core.currentHealth - enemy.damage);
        this.callbacks.onEvent({ type: "coreHit", targetId: enemy.enemyInstanceId, damage: enemy.damage });
        continue;
      }
      survivors.push(enemy);
    }
    this.enemies = survivors;
  }

  private updatePoison(dt: number): void {
    const now = this.simulatedSeconds;
    for (const enemy of this.enemies) {
      const stacks = this.poisonStacks.get(enemy.enemyInstanceId);
      if (!stacks || stacks.length === 0) continue;
      const active = stacks.filter((s) => s.until > now);
      this.poisonStacks.set(enemy.enemyInstanceId, active);
      for (const stack of active) {
        this.damageEnemy(enemy, stack.dps * dt, undefined);
      }
    }
  }

  private updateMonsters(dt: number): void {
    const now = this.simulatedSeconds;
    for (const monster of this.placedMonsters) {
      if (monster.currentHealth <= 0) continue;
      const def = getMonsterDefinition(monster.monsterId);
      const nearAllies = this.placedMonsters.some(
        (other) =>
          other.placementId !== monster.placementId &&
          other.currentHealth > 0 &&
          Math.hypot(other.x - monster.x, other.y - monster.y) <= NEAR_ALLY_RADIUS
      );
      const killBuffUntil = this.killBuffUntil.get(monster.placementId) ?? 0;
      const modifiers = getEffectiveModifiers(monster.traitId, {
        nearAllies,
        recentKillBuffActive: killBuffUntil > now,
      });

      monster.attackCooldownRemaining -= dt;
      if (monster.attackCooldownRemaining <= 0) {
        const candidates = findEnemiesInRange({ x: monster.x, y: monster.y }, monster.range, this.enemies, this.map);
        const target = selectTarget(candidates, monster.targetingMode);
        if (target) {
          const dmg = computeDamage(monster.damage, def.element, getEnemyDefinition(target.enemy.enemyId).element, modifiers);
          this.damageEnemy(target.enemy, dmg, monster.placementId);
          monster.ultimateCharge = Math.min(100, monster.ultimateCharge + def.ultimateChargePerAttack);
          monster.ultimateReady = monster.ultimateCharge >= 100;
          monster.attackCooldownRemaining = computeAttackIntervalSeconds(monster.attackSpeed, modifiers);
          this.callbacks.onEvent({
            type: "attack",
            sourceId: monster.placementId,
            targetId: target.enemy.enemyInstanceId,
            damage: dmg,
          });
        } else {
          monster.attackCooldownRemaining = 0.1;
        }
      }

      monster.abilityCooldownRemaining -= dt;
      if (monster.abilityCooldownRemaining <= 0) {
        const ability = ABILITIES[def.abilityId];
        const didCast = this.tryAutoCastAbility(monster, def, ability);
        if (didCast) {
          monster.abilityCooldownRemaining = computeAbilityCooldownSeconds(ability.cooldownSeconds, modifiers);
          this.callbacks.onEvent({ type: "ability", sourceId: monster.placementId, x: monster.x, y: monster.y });
        } else {
          monster.abilityCooldownRemaining = 0.1;
        }
      }
    }
    this.placedMonsters = this.placedMonsters.filter((m) => m.currentHealth > 0);
  }

  private tryAutoCastAbility(monster: PlacedMonsterState, def: MonsterDefinition, ability: AbilityDefinition): boolean {
    const radius = ability.radius ?? monster.range;
    if (ability.effectType === AbilityEffectType.Heal) {
      const injuredAlly = this.placedMonsters.find(
        (m) => Math.hypot(m.x - monster.x, m.y - monster.y) <= radius && m.currentHealth < m.maxHealth
      );
      if (!injuredAlly) return false;
      this.applyAbilityEffect(monster, def, ability, 1);
      return true;
    }
    const candidates = findEnemiesInRange({ x: monster.x, y: monster.y }, radius, this.enemies, this.map);
    if (candidates.length === 0) return false;
    this.applyAbilityEffect(monster, def, ability, 1);
    return true;
  }

  private applyAbilityEffect(
    monster: PlacedMonsterState,
    def: MonsterDefinition,
    ability: AbilityDefinition,
    powerMultiplier: number
  ): void {
    const now = this.simulatedSeconds;
    const radius = ability.radius ?? monster.range;
    const modifiers = getEffectiveModifiers(monster.traitId, { nearAllies: false, recentKillBuffActive: false });

    switch (ability.effectType) {
      case AbilityEffectType.AoeDamage: {
        const targets = findEnemiesInRange({ x: monster.x, y: monster.y }, radius, this.enemies, this.map);
        for (const t of targets) {
          const dmg = computeDamage(ability.power * powerMultiplier, def.element, getEnemyDefinition(t.enemy.enemyId).element, modifiers);
          this.damageEnemy(t.enemy, dmg, monster.placementId);
        }
        break;
      }
      case AbilityEffectType.ChainDamage: {
        const pool = findEnemiesInRange({ x: monster.x, y: monster.y }, monster.range * 2, this.enemies, this.map);
        const sorted = pool.sort((a, b) => a.distance - b.distance).slice(0, ability.chainCount ?? 1);
        for (const t of sorted) {
          const dmg = computeDamage(ability.power * powerMultiplier, def.element, getEnemyDefinition(t.enemy.enemyId).element, modifiers);
          this.damageEnemy(t.enemy, dmg, monster.placementId);
        }
        break;
      }
      case AbilityEffectType.Slow: {
        const targets = findEnemiesInRange({ x: monster.x, y: monster.y }, radius, this.enemies, this.map);
        for (const t of targets) {
          t.enemy.slowPercent = ability.power;
          t.enemy.slowUntil = now + (ability.durationSeconds ?? 2);
        }
        break;
      }
      case AbilityEffectType.Heal: {
        const allies = this.placedMonsters.filter((m) => Math.hypot(m.x - monster.x, m.y - monster.y) <= radius);
        for (const ally of allies) {
          ally.currentHealth = Math.min(ally.maxHealth, ally.currentHealth + ability.power * powerMultiplier);
        }
        break;
      }
      case AbilityEffectType.Taunt: {
        const targets = findEnemiesInRange({ x: monster.x, y: monster.y }, radius, this.enemies, this.map);
        for (const t of targets) {
          t.enemy.tauntedByPlacementId = monster.placementId;
          t.enemy.tauntUntil = now + (ability.durationSeconds ?? 3);
        }
        break;
      }
      case AbilityEffectType.PoisonCloud: {
        const targets = findEnemiesInRange({ x: monster.x, y: monster.y }, radius, this.enemies, this.map);
        for (const t of targets) {
          const stacks = this.poisonStacks.get(t.enemy.enemyInstanceId) ?? [];
          stacks.push({ dps: ability.power * powerMultiplier, until: now + (ability.durationSeconds ?? 3) });
          this.poisonStacks.set(t.enemy.enemyInstanceId, stacks);
        }
        break;
      }
    }
  }

  private damageEnemy(enemy: EnemyState, dmg: number, sourcePlacementId: string | undefined): void {
    enemy.currentHealth -= dmg;
    if (enemy.currentHealth <= 0 && this.enemies.includes(enemy)) {
      this.onEnemyKilled(enemy, sourcePlacementId);
    }
  }

  private onEnemyKilled(enemy: EnemyState, sourcePlacementId: string | undefined): void {
    const def = getEnemyDefinition(enemy.enemyId);
    this.gold += def.goldReward;
    this.enemies = this.enemies.filter((e) => e.enemyInstanceId !== enemy.enemyInstanceId);

    if (sourcePlacementId) {
      const killer = this.placedMonsters.find((m) => m.placementId === sourcePlacementId);
      if (killer) {
        this.xpAccumulator.set(killer.instanceId, (this.xpAccumulator.get(killer.instanceId) ?? 0) + def.xpReward);
        this.killBuffUntil.set(killer.placementId, this.simulatedSeconds + KILL_BUFF_DURATION_SECONDS);
      }
    }
    this.callbacks.onEvent({ type: "death", targetId: enemy.enemyInstanceId, x: getEnemyPosition(enemy, this.map).x, y: getEnemyPosition(enemy, this.map).y });
  }
}

function buildSpawnSchedule(wave: WaveDefinition): { enemyId: string; at: number }[] {
  const schedule: { enemyId: string; at: number }[] = [];
  let t = 0;
  for (const group of wave.enemies) {
    for (let i = 0; i < group.count; i++) {
      schedule.push({ enemyId: group.enemyId, at: t });
      t += group.spawnIntervalSeconds;
    }
  }
  return schedule;
}
