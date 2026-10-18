import { soundEngine } from "./sound-engine";

export type FeedbackKind = "tap" | "discover" | "correct" | "incorrect";
export interface FeedbackOptions {
  sound?: boolean;
  haptics?: boolean;
}

let audioContext: AudioContext | null = null;
type AmbientPreset = "hydro" | "ember" | "solar" | "breeze";
let ambientPreset: AmbientPreset = "hydro";
const ambientFrequencies: Record<AmbientPreset, readonly [number, number]> = {
  hydro: [130.81, 196],
  ember: [110, 164.81],
  solar: [164.81, 246.94],
  breeze: [146.83, 220],
};
let ambient: { oscillators: OscillatorNode[]; gain: GainNode; modulation: GainNode } | null = null;
function audioVisibility() {
  if (!audioContext || audioContext.state === "closed") return;
  if (document.hidden) void audioContext.suspend().catch(() => {});
  else if (ambient) void audioContext.resume().catch(() => {});
}
export function setAmbientPreset(preset: AmbientPreset) {
  ambientPreset = preset;
  const context = audioContext;
  if (!context || !ambient) return;
  ambient.oscillators.slice(0, 2).forEach((oscillator, index) => {
    oscillator.frequency.setTargetAtTime(
      ambientFrequencies[preset][index],
      context.currentTime,
      0.8,
    );
  });
}

function contextFromGesture() {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  if (document.hidden) return null;
  if (navigator.userActivation && !navigator.userActivation.isActive) return null;
  if (!audioContext || audioContext.state === "closed") audioContext = new AudioContext();
  return audioContext;
}

/** Optional, locally hosted feedback. Call directly from a user action. */
export function feedback(
  kind: FeedbackKind,
  { sound = false, haptics = false }: FeedbackOptions = {},
) {
  if (typeof window === "undefined" || document.hidden) return;
  if (
    haptics &&
    (!navigator.userActivation || navigator.userActivation.isActive) &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    try {
      navigator.vibrate?.(
        kind === "incorrect" ? [12, 35, 12] : kind === "discover" ? [10, 30, 16] : 8,
      );
    } catch {
      // Unsupported devices and embedded browsers can silently omit haptics.
    }
  }
  soundEngine.isMuted = !sound;
  if (!sound) return;
  try {
    soundEngine.playFeedback(kind);
  } catch {
    // Audio must never prevent navigation or learning.
  }
}

/** A quiet optional ambient tone; enabling requires an explicit user action. */
export function setAmbientAudio(enabled: boolean) {
  if (!enabled) {
    if (ambient) {
      try {
        ambient.oscillators.forEach((oscillator) => oscillator.stop());
      } catch {
        // A browser can refuse to start audio; stopping remains harmless.
      }
      ambient.oscillators.forEach((oscillator) => oscillator.disconnect());
      ambient.modulation.disconnect();
      document.removeEventListener("visibilitychange", audioVisibility);
      ambient.gain.disconnect();
      ambient = null;
    }
    return;
  }
  if (ambient) return;
  try {
    const context = contextFromGesture();
    if (!context) return;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.006, context.currentTime + 1.5);
    gain.connect(context.destination);
    const tones = ambientFrequencies[ambientPreset].map((frequency) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start();
      return oscillator;
    });
    const lfo = context.createOscillator();
    const modulation = context.createGain();
    lfo.frequency.value = 0.09;
    modulation.gain.value = 0.001;
    lfo.connect(modulation).connect(gain.gain);
    lfo.start();
    ambient = { oscillators: [...tones, lfo], gain, modulation };
    document.addEventListener("visibilitychange", audioVisibility);
    void context.resume().catch(() => {
      setAmbientAudio(false);
    });
  } catch {
    setAmbientAudio(false);
  }
}

export function cleanupFeedback() {
  soundEngine.dispose();
  setAmbientAudio(false);
  const context = audioContext;
  audioContext = null;
  if (context && context.state !== "closed") void context.close().catch(() => {});
}
