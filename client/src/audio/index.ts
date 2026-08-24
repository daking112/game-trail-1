import { audioManager } from "./AudioManager";

export { registerAudioListeners } from "./audioListeners";

/** Unlocks the AudioContext -- must run inside a user-gesture handler. */
export function unlockAudio(): void {
  audioManager.unlock();
}

export function playUiClick(): void {
  audioManager.play("uiClick");
}
