export type FeedbackKind = "tap" | "discover" | "correct" | "incorrect";
export interface FeedbackOptions {
  sound?: boolean;
  haptics?: boolean;
}

let audioContext: AudioContext | null = null;
let ambient: { oscillator: OscillatorNode; gain: GainNode } | null = null;

function contextFromGesture() {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  if (navigator.userActivation && !navigator.userActivation.isActive) return null;
  if (!audioContext || audioContext.state === "closed") audioContext = new AudioContext();
  return audioContext;
}

/** Optional, locally generated feedback. Call directly from a user action. */
export function feedback(
  kind: FeedbackKind,
  { sound = false, haptics = false }: FeedbackOptions = {},
) {
  if (typeof window === "undefined") return;
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
  if (!sound) return;
  try {
    const context = contextFromGesture();
    if (!context) return;
    const notes: Record<FeedbackKind, number[]> = {
      tap: [440],
      discover: [523.25, 659.25, 783.99],
      correct: [659.25, 783.99],
      incorrect: [220, 196],
    };
    void context
      .resume()
      .then(() => {
        if (context.state === "closed") return;
        notes[kind].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const start = context.currentTime + index * 0.065;
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.035, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
          oscillator.connect(gain).connect(context.destination);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
          oscillator.start(start);
          oscillator.stop(start + 0.16);
        });
      })
      .catch(() => {
        /* Browser audio permission is optional. */
      });
  } catch {
    // Audio must never prevent navigation or learning.
  }
}

/** A quiet optional ambient tone; enabling requires an explicit user action. */
export function setAmbientAudio(enabled: boolean) {
  if (!enabled) {
    if (ambient) {
      try {
        ambient.oscillator.stop();
      } catch {
        // A browser can refuse to start audio; stopping remains harmless.
      }
      ambient.oscillator.disconnect();
      ambient.gain.disconnect();
      ambient = null;
    }
    return;
  }
  if (ambient) return;
  try {
    const context = contextFromGesture();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 130.81;
    gain.gain.value = 0.008;
    oscillator.connect(gain).connect(context.destination);
    ambient = { oscillator, gain };
    oscillator.start();
    void context.resume().catch(() => {
      setAmbientAudio(false);
    });
  } catch {
    setAmbientAudio(false);
  }
}

export function cleanupFeedback() {
  setAmbientAudio(false);
  const context = audioContext;
  audioContext = null;
  if (context && context.state !== "closed") void context.close().catch(() => {});
}
