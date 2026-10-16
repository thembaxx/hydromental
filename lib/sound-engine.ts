/** Gesture-only, locally synthesized feedback. Importing this module is SSR-safe. */
export class ElementalSoundEngine {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private muted = true;
  private lastTick = -Infinity;
  public haptics = true;

  public get isMuted() {
    return this.muted;
  }

  public set isMuted(value: boolean) {
    this.muted = value;
    if (this.context && this.output) {
      this.output.gain.setTargetAtTime(value ? 0 : 0.55, this.context.currentTime, 0.01);
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined" || this.muted || document.hidden) return null;
    if (navigator.userActivation && !navigator.userActivation.isActive) return null;
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtor) return null;
      if (!this.context || this.context.state === "closed") {
        this.context = new AudioCtor();
        this.output = this.context.createGain();
        this.output.gain.value = 0.55;
        this.output.connect(this.context.destination);
      }
      if (this.context.state === "suspended") void this.context.resume().catch(() => {});
      return this.context;
    } catch {
      return null;
    }
  }

  private vibrate(pattern: number | number[]) {
    if (
      typeof window === "undefined" ||
      !this.haptics ||
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* Feedback is optional. */
    }
  }

  private tone(
    context: AudioContext,
    frequency: number,
    duration: number,
    volume: number,
    delay = 0,
    endFrequency = frequency,
    type: OscillatorType = "sine",
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.output!);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }

  public playScrubTick(atomicNumber = 1) {
    // Bound both audio voices and vibration while dragging across 118 elements.
    if (typeof window === "undefined") return;
    const now = performance.now();
    if (now - this.lastTick < 35) return;
    this.lastTick = now;
    this.vibrate(4);
    const context = this.ensureContext();
    if (context) this.tone(context, 300 + atomicNumber * 5.2, 0.035, 0.075, 0, 130);
  }

  public playElementResonance(atomicNumber = 1, shellCount = 3) {
    const context = this.ensureContext();
    if (!context) return;
    const base = 210 + (atomicNumber % 24) * 16;
    [1, 1.25, 1.5, 2].slice(0, Math.max(2, shellCount)).forEach((ratio, index) => {
      this.tone(context, base * ratio, 0.6, 0.055 / (index + 1), index * 0.025);
    });
  }

  public playExcitePulse(atomicNumber = 1) {
    this.vibrate([8, 20, 12]);
    const context = this.ensureContext();
    const base = 160 + (atomicNumber % 36) * 8;
    if (context) this.tone(context, base, 0.22, 0.09, 0, base * 2.2, "triangle");
  }

  public dispose() {
    if (this.context && this.context.state !== "closed") void this.context.close().catch(() => {});
    this.context = null;
    this.output = null;
    this.lastTick = -Infinity;
  }
}

export const soundEngine = new ElementalSoundEngine();
