export type SoundName =
  | "monsterAttack"
  | "enemyHit"
  | "enemyDeath"
  | "abilityActivate"
  | "coreHit"
  | "waveStart"
  | "bossSpawn"
  | "victory"
  | "defeat"
  | "captureSuccess"
  | "captureFail"
  | "uiClick";

interface ToneStep {
  type: OscillatorType;
  freqStart: number;
  freqEnd?: number;
  duration: number;
  gain: number;
  delay?: number;
}

/**
 * Placeholder sound effects synthesized with the Web Audio API -- no binary
 * assets required. Each entry can be swapped for a real sample later by
 * changing AudioManager.play() without touching any call site.
 */
const SOUND_DEFS: Record<SoundName, ToneStep[]> = {
  monsterAttack: [{ type: "square", freqStart: 520, freqEnd: 380, duration: 0.06, gain: 0.05 }],
  enemyHit: [{ type: "triangle", freqStart: 220, freqEnd: 160, duration: 0.05, gain: 0.05 }],
  enemyDeath: [
    { type: "sawtooth", freqStart: 300, freqEnd: 60, duration: 0.18, gain: 0.06 },
  ],
  abilityActivate: [
    { type: "sine", freqStart: 440, freqEnd: 880, duration: 0.14, gain: 0.06 },
  ],
  coreHit: [{ type: "square", freqStart: 140, freqEnd: 80, duration: 0.15, gain: 0.08 }],
  waveStart: [
    { type: "sine", freqStart: 330, duration: 0.1, gain: 0.06 },
    { type: "sine", freqStart: 440, duration: 0.14, gain: 0.06, delay: 0.12 },
  ],
  bossSpawn: [
    { type: "sawtooth", freqStart: 80, freqEnd: 60, duration: 0.4, gain: 0.09 },
    { type: "sawtooth", freqStart: 70, freqEnd: 50, duration: 0.4, gain: 0.09, delay: 0.2 },
  ],
  victory: [
    { type: "sine", freqStart: 523, duration: 0.12, gain: 0.07 },
    { type: "sine", freqStart: 659, duration: 0.12, gain: 0.07, delay: 0.12 },
    { type: "sine", freqStart: 784, duration: 0.22, gain: 0.07, delay: 0.24 },
  ],
  defeat: [
    { type: "sawtooth", freqStart: 300, freqEnd: 100, duration: 0.5, gain: 0.07 },
  ],
  captureSuccess: [
    { type: "sine", freqStart: 600, freqEnd: 900, duration: 0.1, gain: 0.07 },
    { type: "sine", freqStart: 900, freqEnd: 1200, duration: 0.14, gain: 0.07, delay: 0.1 },
  ],
  captureFail: [{ type: "triangle", freqStart: 260, freqEnd: 140, duration: 0.25, gain: 0.06 }],
  uiClick: [{ type: "square", freqStart: 700, duration: 0.02, gain: 0.03 }],
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private muted = false;

  /** Must be called from within a user gesture handler to satisfy browser autoplay policy. */
  unlock(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    }
    this.ctx?.resume().catch(() => {});
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  play(name: SoundName): void {
    if (this.muted || !this.ctx) return;
    const steps = SOUND_DEFS[name];
    const now = this.ctx.currentTime;
    for (const step of steps) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = step.type;
      const startAt = now + (step.delay ?? 0);
      osc.frequency.setValueAtTime(step.freqStart, startAt);
      if (step.freqEnd !== undefined) {
        osc.frequency.linearRampToValueAtTime(step.freqEnd, startAt + step.duration);
      }
      gainNode.gain.setValueAtTime(step.gain, startAt);
      gainNode.gain.linearRampToValueAtTime(0, startAt + step.duration);
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + step.duration + 0.02);
    }
  }
}

export const audioManager = new AudioManager();
