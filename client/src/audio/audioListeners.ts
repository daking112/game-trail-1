import { socket } from "../network/socket";
import { audioManager } from "./AudioManager";

let registered = false;

/** Wires server events to placeholder sound effects. Call once at startup. */
export function registerAudioListeners(): void {
  if (registered) return;
  registered = true;

  socket.on("battle:event", (event) => {
    switch (event.type) {
      case "attack":
        audioManager.play("monsterAttack");
        break;
      case "ability":
      case "ultimate":
        audioManager.play("abilityActivate");
        break;
      case "death":
        audioManager.play("enemyDeath");
        break;
      case "coreHit":
        audioManager.play("coreHit");
        break;
      case "bossSpawn":
        audioManager.play("bossSpawn");
        break;
    }
  });

  socket.on("battle:waveStart", () => audioManager.play("waveStart"));
  socket.on("battle:victory", () => audioManager.play("victory"));
  socket.on("battle:defeat", () => audioManager.play("defeat"));
  socket.on("battle:captureResult", (result) => audioManager.play(result.success ? "captureSuccess" : "captureFail"));
}
