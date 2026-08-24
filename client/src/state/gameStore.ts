import { create } from "zustand";
import {
  BattleStateSnapshot,
  CodexEntry,
  CombatEvent,
  CurrencyWallet,
  EggType,
  LobbyState,
  MonsterInstance,
} from "@monsterfall/shared";

export type Screen = "home" | "lobby" | "collection" | "monsterDetail" | "codex" | "battle" | "hatchery";

export interface CaptureOffer {
  encounterId: string;
  monsterId: string;
  enemyHealthPercent: number;
  captureChance: number;
}

export interface CaptureResultPayload {
  success: boolean;
  monsterId: string;
  instanceId?: string;
}

export interface EggResultPayload {
  success: boolean;
  eggType: EggType;
  message?: string;
  monsterId?: string;
  instanceId?: string;
}

interface GameStoreState {
  screen: Screen;
  connected: boolean;
  userId: string | null;
  username: string | null;
  lobby: LobbyState | null;
  lobbyError: string | null;
  collection: MonsterInstance[];
  codex: CodexEntry[];
  wallet: CurrencyWallet;
  selectedInstanceId: string | null;
  selectedForPlacementId: string | null;
  battleSnapshot: BattleStateSnapshot | null;
  combatLog: CombatEvent[];
  captureOffer: CaptureOffer | null;
  captureResult: CaptureResultPayload | null;
  battleResult: { type: "victory" | "defeat"; goldEarned?: number; xpAwarded?: Record<string, number> } | null;
  eggResult: EggResultPayload | null;

  setScreen: (screen: Screen) => void;
  setConnected: (connected: boolean) => void;
  setSelf: (userId: string, username: string) => void;
  setLobby: (lobby: LobbyState) => void;
  setLobbyError: (message: string | null) => void;
  setCollection: (monsters: MonsterInstance[]) => void;
  setCodex: (entries: CodexEntry[]) => void;
  setWallet: (wallet: CurrencyWallet) => void;
  setSelectedInstanceId: (id: string | null) => void;
  setSelectedForPlacementId: (id: string | null) => void;
  setBattleSnapshot: (snapshot: BattleStateSnapshot) => void;
  pushCombatEvent: (event: CombatEvent) => void;
  setCaptureOffer: (offer: CaptureOffer | null) => void;
  setCaptureResult: (result: CaptureResultPayload | null) => void;
  setBattleResult: (result: GameStoreState["battleResult"]) => void;
  setEggResult: (result: EggResultPayload | null) => void;
  resetBattle: () => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  screen: "home",
  connected: false,
  userId: null,
  username: null,
  lobby: null,
  lobbyError: null,
  collection: [],
  codex: [],
  wallet: { gold: 0, crystals: 0 },
  selectedInstanceId: null,
  selectedForPlacementId: null,
  battleSnapshot: null,
  combatLog: [],
  captureOffer: null,
  captureResult: null,
  battleResult: null,
  eggResult: null,

  setScreen: (screen) => set({ screen }),
  setConnected: (connected) => set({ connected }),
  setSelf: (userId, username) => set({ userId, username }),
  setLobby: (lobby) => set({ lobby, lobbyError: null }),
  setLobbyError: (lobbyError) => set({ lobbyError }),
  setCollection: (collection) => set({ collection }),
  setCodex: (codex) => set({ codex }),
  setWallet: (wallet) => set({ wallet }),
  setSelectedInstanceId: (selectedInstanceId) => set({ selectedInstanceId }),
  setSelectedForPlacementId: (selectedForPlacementId) => set({ selectedForPlacementId }),
  setBattleSnapshot: (battleSnapshot) => set({ battleSnapshot }),
  pushCombatEvent: (event) =>
    set((state) => ({ combatLog: [...state.combatLog.slice(-49), event] })),
  setCaptureOffer: (captureOffer) => set({ captureOffer }),
  setCaptureResult: (captureResult) => set({ captureResult }),
  setBattleResult: (battleResult) => set({ battleResult }),
  setEggResult: (eggResult) => set({ eggResult }),
  resetBattle: () =>
    set({
      battleSnapshot: null,
      combatLog: [],
      captureOffer: null,
      captureResult: null,
      battleResult: null,
      selectedForPlacementId: null,
    }),
}));
