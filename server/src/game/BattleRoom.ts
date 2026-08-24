import { v4 as uuid } from "uuid";
import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  STARTER_MONSTER_IDS,
  TargetingMode,
  VERDANT_FOREST_MAP,
  VERDANT_FOREST_WAVES,
  getMonsterDefinition,
} from "@monsterfall/shared";
import { BattleSimulation } from "./BattleSimulation";
import { GameRepository } from "../database/repository";
import { attemptCapture } from "../systems/capture";
import { applyXpGain, checkEvolutionEligibility } from "../systems/xp";

const TICK_RATE_MS = 100;
const CAPTURE_ENCOUNTER_CHANCE = 0.6;

interface PendingCapture {
  monsterId: string;
  enemyHealthPercent: number;
  chance: number;
}

/**
 * Owns one active battle: the authoritative simulation, its broadcast loop,
 * and the meta-mechanics (capture offers, post-battle reward persistence)
 * that sit above the tick-precise combat simulation.
 */
export class BattleRoom {
  readonly simulation: BattleSimulation;
  private interval: NodeJS.Timeout | null = null;
  private instanceOwner = new Map<string, string>();
  private pendingCaptures = new Map<string, PendingCapture>();

  constructor(
    private roomId: string,
    private io: Server<ClientToServerEvents, ServerToClientEvents>,
    private repository: GameRepository
  ) {
    this.simulation = new BattleSimulation(VERDANT_FOREST_MAP, VERDANT_FOREST_WAVES, {
      onEvent: (event) => this.io.to(this.roomId).emit("battle:event", event),
      onWaveStart: (wave, totalWaves) => this.io.to(this.roomId).emit("battle:waveStart", { wave, totalWaves }),
      onWaveComplete: (wave) => this.handleWaveComplete(wave),
      onVictory: (gold, xp) => this.handleBattleEnd(true, gold, xp),
      onDefeat: (xp) => this.handleBattleEnd(false, 0, xp),
    });
  }

  start(): void {
    this.io.to(this.roomId).emit("battle:start", { battleId: this.simulation.battleId, mapId: VERDANT_FOREST_MAP.id });
    this.interval = setInterval(() => {
      this.simulation.tick(TICK_RATE_MS / 1000);
      this.io.to(this.roomId).emit("battle:state", this.simulation.getSnapshot());
    }, TICK_RATE_MS);
  }

  stop(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  placeMonster(ownerId: string, instanceId: string, monsterId: string, level: number, traitId: string, x: number, y: number) {
    const result = this.simulation.placeMonster({ ownerId, instanceId, monsterId, level, traitId, x, y });
    if (!("error" in result)) this.instanceOwner.set(instanceId, ownerId);
    return result;
  }

  setTargetingMode(placementId: string, mode: TargetingMode): void {
    this.simulation.setTargetingMode(placementId, mode);
  }

  activateAbility(_placementId: string): void {
    // Basic abilities auto-cast on cooldown; this hook is reserved for
    // future manual-activation abilities without changing the network contract.
  }

  activateUltimate(placementId: string): void {
    this.simulation.activateUltimate(placementId);
  }

  private handleWaveComplete(wave: number): void {
    this.io.to(this.roomId).emit("battle:waveComplete", { wave });
    if (wave >= VERDANT_FOREST_WAVES.length) return;
    if (Math.random() > CAPTURE_ENCOUNTER_CHANCE) return;

    const monsterId = STARTER_MONSTER_IDS[Math.floor(Math.random() * STARTER_MONSTER_IDS.length)];
    const enemyHealthPercent = 0.05 + Math.random() * 0.35;
    const { chance } = attemptCapture(monsterId, enemyHealthPercent);
    const encounterId = uuid();
    this.pendingCaptures.set(encounterId, { monsterId, enemyHealthPercent, chance });
    this.io.to(this.roomId).emit("battle:captureOffer", {
      encounterId,
      monsterId,
      enemyHealthPercent,
      captureChance: chance,
    });
  }

  async resolveCapture(playerId: string, encounterId: string): Promise<void> {
    const pending = this.pendingCaptures.get(encounterId);
    if (!pending) return;
    this.pendingCaptures.delete(encounterId);

    const success = Math.random() < pending.chance;
    let instanceId: string | undefined;
    if (success) {
      const instance = await this.repository.addMonsterToCollection(playerId, pending.monsterId);
      instanceId = instance.instanceId;
      await this.repository.markCodexCaptured(playerId, pending.monsterId);
    } else {
      await this.repository.markCodexSeen(playerId, pending.monsterId);
    }
    this.io.to(this.roomId).emit("battle:captureResult", { success, monsterId: pending.monsterId, instanceId });
  }

  private async handleBattleEnd(victory: boolean, goldEarned: number, xpAwarded: Record<string, number>): Promise<void> {
    this.stop();

    // Every player who placed at least one monster shares the gold reward
    // equally, regardless of whether their monster happened to land a kill.
    const participantIds = new Set(this.instanceOwner.values());
    const goldPerPlayer = victory ? Math.floor(goldEarned / Math.max(1, participantIds.size)) : 0;

    for (const [instanceId, xp] of Object.entries(xpAwarded)) {
      const ownerId = this.instanceOwner.get(instanceId);
      if (!ownerId) continue;

      const instance = await this.repository.getMonsterInstance(instanceId);
      if (!instance) continue;
      const { level, xp: xpRemainder } = applyXpGain({ level: instance.level, xp: instance.xp }, xp);
      await this.repository.setMonsterLevel(instanceId, level, xpRemainder);

      const def = getMonsterDefinition(instance.monsterId);
      const evolveTo = checkEvolutionEligibility(def, level);
      if (evolveTo) {
        await this.repository.evolveMonster(instanceId, evolveTo);
        await this.repository.markCodexEvolved(ownerId, evolveTo);
      }
    }

    for (const ownerId of participantIds) {
      const wallet = await this.repository.addCurrency(ownerId, { gold: goldPerPlayer });
      this.io.to(ownerId).emit("wallet:update", { wallet });
      this.io.to(ownerId).emit("collection:update", { monsters: await this.repository.getCollection(ownerId) });
      this.io.to(ownerId).emit("codex:update", { entries: await this.repository.getCodex(ownerId) });
    }

    if (victory) {
      this.io.to(this.roomId).emit("battle:victory", { goldEarned, xpAwarded });
    } else {
      this.io.to(this.roomId).emit("battle:defeat");
    }
  }
}
