import { TargetingMode } from "./ability";
import { BattleStateSnapshot, CombatEvent } from "./battle";
import { CodexEntry } from "./codex";
import { CurrencyWallet, EggType } from "./economy";
import { LobbyState } from "./lobby";
import { MonsterInstance } from "./monster";

export interface ClientToServerEvents {
  "player:identify": (payload: { username: string }) => void;
  "lobby:create": (payload: { username: string }) => void;
  "lobby:join": (payload: { lobbyCode: string; username: string }) => void;
  "lobby:ready": (payload: { ready: boolean }) => void;
  "lobby:selectTeam": (payload: { instanceIds: string[] }) => void;
  "lobby:start": () => void;

  "battle:placeMonster": (payload: { instanceId: string; x: number; y: number }) => void;
  "battle:setTargetingMode": (payload: { placementId: string; mode: TargetingMode }) => void;
  "battle:activateAbility": (payload: { placementId: string }) => void;
  "battle:activateUltimate": (payload: { placementId: string }) => void;
  "battle:capture": (payload: { encounterId: string }) => void;

  "shop:purchaseEgg": (payload: { eggType: EggType }) => void;
}

export interface ServerToClientEvents {
  "self:identify": (payload: { userId: string; username: string }) => void;
  "lobby:update": (payload: { lobby: LobbyState }) => void;
  "lobby:error": (payload: { message: string }) => void;
  "collection:update": (payload: { monsters: MonsterInstance[] }) => void;
  "codex:update": (payload: { entries: CodexEntry[] }) => void;
  "wallet:update": (payload: { wallet: CurrencyWallet }) => void;

  "battle:start": (payload: { battleId: string; mapId: string }) => void;
  "battle:state": (payload: BattleStateSnapshot) => void;
  "battle:event": (payload: CombatEvent) => void;
  "battle:waveStart": (payload: { wave: number; totalWaves: number }) => void;
  "battle:waveComplete": (payload: { wave: number }) => void;
  "battle:victory": (payload: { goldEarned: number; xpAwarded: Record<string, number> }) => void;
  "battle:defeat": () => void;
  "battle:captureOffer": (payload: {
    encounterId: string;
    monsterId: string;
    enemyHealthPercent: number;
    captureChance: number;
  }) => void;
  "battle:captureResult": (payload: { success: boolean; monsterId: string; instanceId?: string }) => void;

  "shop:eggResult": (payload: {
    success: boolean;
    message?: string;
    eggType: EggType;
    monsterId?: string;
    instanceId?: string;
  }) => void;
}
