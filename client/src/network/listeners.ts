import { socket } from "./socket";
import { useGameStore } from "../state/gameStore";

let registered = false;

/** Wires socket.io events into the zustand store. Call once at app startup. */
export function registerNetworkListeners(): void {
  if (registered) return;
  registered = true;

  const store = useGameStore.getState;

  socket.on("connect", () => useGameStore.setState({ connected: true }));
  socket.on("disconnect", () => useGameStore.setState({ connected: false }));

  socket.on("self:identify", ({ userId, username }) => store().setSelf(userId, username));
  socket.on("lobby:update", ({ lobby }) => {
    store().setLobby(lobby);
    if (lobby.started) store().setScreen("battle");
  });
  socket.on("lobby:error", ({ message }) => store().setLobbyError(message));
  socket.on("collection:update", ({ monsters }) => store().setCollection(monsters));
  socket.on("codex:update", ({ entries }) => store().setCodex(entries));
  socket.on("wallet:update", ({ wallet }) => store().setWallet(wallet));

  socket.on("battle:start", () => store().resetBattle());
  socket.on("battle:state", (snapshot) => store().setBattleSnapshot(snapshot));
  socket.on("battle:event", (event) => store().pushCombatEvent(event));
  socket.on("battle:waveComplete", () => {});
  socket.on("battle:victory", ({ goldEarned, xpAwarded }) =>
    store().setBattleResult({ type: "victory", goldEarned, xpAwarded })
  );
  socket.on("battle:defeat", () => store().setBattleResult({ type: "defeat" }));
  socket.on("battle:captureOffer", (offer) => store().setCaptureOffer(offer));
  socket.on("battle:captureResult", (result) => {
    store().setCaptureResult(result);
    store().setCaptureOffer(null);
  });

  socket.on("shop:eggResult", (result) => store().setEggResult(result));

  socket.connect();
}
