/** Sound Lab exports, loaded only after opt-in. Procedural cues cover loading/offline failures. */
const clips = {
  tap: "felt",
  scrub: "notch",
  resonance: "halo",
  excite: "dew",
  correct: "bloom",
  incorrect: "shrug",
  discover: "crest",
} as const;
type Clip = keyof typeof clips;

/** Gesture-only feedback. Importing this module is SSR-safe. */
export class ElementalSoundEngine {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private muted = true;
  private lastTick = -Infinity;
  private lastResonance = -Infinity;
  private buffers = new Map<Clip, AudioBuffer>();
  private loading: AbortController | null = null;
  private voices = new Set<AudioScheduledSourceNode>();
  public haptics = true;

  public get isMuted() {
    return this.muted;
  }

  public set isMuted(value: boolean) {
    this.muted = value;
    if (this.context && this.output) {
      this.output.gain.setTargetAtTime(value ? 0 : 0.55, this.context.currentTime, 0.01);
    }
    if (value) this.stopVoices();
  }

  private stopVoices() {
    for (const voice of this.voices) {
      try {
        voice.stop();
      } catch {
        // A voice may already have finished while the tab was suspended.
      }
    }
    this.voices.clear();
  }

  private visibilityChanged = () => {
    if (!document.hidden) return;
    this.stopVoices();
    if (this.context?.state === "running") void this.context.suspend().catch(() => {});
  };

  private loadClips(context: AudioContext) {
    this.loading?.abort();
    const controller = new AbortController();
    this.loading = controller;
    this.buffers.clear();
    for (const [kind, file] of Object.entries(clips)) {
      void fetch(`/sounds/${file}.wav`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Optional sound unavailable");
          return response.arrayBuffer();
        })
        .then((data) => context.decodeAudioData(data))
        .then((buffer) => {
          if (this.context === context && !controller.signal.aborted)
            this.buffers.set(kind as Clip, buffer);
        })
        .catch(() => {
          // Keep immediate local feedback if a download or decoder is unavailable.
        });
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
        this.context = new AudioCtor({ latencyHint: "interactive" });
        this.output = this.context.createGain();
        this.output.gain.value = 0.55;
        this.output.connect(this.context.destination);
        document.addEventListener("visibilitychange", this.visibilityChanged);
        this.loadClips(this.context);
      }
      if (this.context.state === "suspended") void this.context.resume().catch(() => {});
      return this.context;
    } catch {
      return null;
    }
  }

  private playClip(context: AudioContext, clip: Clip, semitones = 0) {
    const buffer = this.buffers.get(clip);
    if (!buffer) return false;
    // Scrubbing and repeated taps must not build an unbounded stack of tails.
    if (this.voices.size >= 12) return true;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 2 ** (semitones / 12);
    source.connect(this.output!);
    this.voices.add(source);
    source.onended = () => {
      source.disconnect();
      this.voices.delete(source);
    };
    source.start();
    return true;
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
    if (this.voices.size >= 12) return;
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
      this.voices.delete(oscillator);
    };
    this.voices.add(oscillator);
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
    const pitch = ((Math.max(1, Math.min(118, atomicNumber)) - 1) / 117) * 4 - 2;
    if (context && !this.playClip(context, "scrub", pitch))
      this.tone(context, 300 + atomicNumber * 5.2, 0.035, 0.075, 0, 130);
  }

  public playElementResonance(atomicNumber = 1, shellCount = 3) {
    const context = this.ensureContext();
    if (!context) return;
    const now = performance.now();
    if (now - this.lastResonance < 80) return;
    this.lastResonance = now;
    if (this.playClip(context, "resonance", (atomicNumber % 5) - 2)) return;
    const base = 210 + (atomicNumber % 24) * 16;
    [1, 1.25, 1.5, 2].slice(0, Math.max(2, shellCount)).forEach((ratio, index) => {
      this.tone(context, base * ratio, 0.6, 0.055 / (index + 1), index * 0.025);
    });
  }

  public playExcitePulse(atomicNumber = 1) {
    this.vibrate([8, 20, 12]);
    const context = this.ensureContext();
    const base = 160 + (atomicNumber % 36) * 8;
    if (context && !this.playClip(context, "excite", (atomicNumber % 5) - 2))
      this.tone(context, base, 0.22, 0.09, 0, base * 2.2, "triangle");
  }

  public playFeedback(kind: "tap" | "discover" | "correct" | "incorrect") {
    const context = this.ensureContext();
    if (!context || this.playClip(context, kind)) return;
    const notes = {
      tap: [440],
      discover: [523.25, 659.25, 783.99],
      correct: [659.25, 783.99],
      incorrect: [220, 196],
    };
    notes[kind].forEach((frequency, index) => {
      this.tone(context, frequency, 0.15, 0.06, index * 0.065);
    });
  }

  public dispose() {
    this.stopVoices();
    this.loading?.abort();
    this.loading = null;
    this.buffers.clear();
    if (typeof document !== "undefined")
      document.removeEventListener("visibilitychange", this.visibilityChanged);
    if (this.context && this.context.state !== "closed") void this.context.close().catch(() => {});
    this.context = null;
    this.output = null;
    this.lastTick = -Infinity;
    this.lastResonance = -Infinity;
    this.muted = true;
  }
}

export const soundEngine = new ElementalSoundEngine();
