import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ElementalSoundEngine } from "../lib/sound-engine.ts";

function browserAudio(t, { downloadFails = false } = {}) {
  const contexts = [];
  const requests = [];
  const document = new EventTarget();
  document.hidden = false;
  const activation = { isActive: true };
  const parameter = () => ({
    value: 0,
    setValueAtTime() {},
    setTargetAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  });
  class Context {
    currentTime = 0;
    state = "running";
    sources = [];
    oscillators = [];
    destination = {};
    constructor() {
      contexts.push(this);
    }
    createGain() {
      return { gain: parameter(), connect() {}, disconnect() {} };
    }
    source(list) {
      const source = {
        frequency: parameter(),
        playbackRate: parameter(),
        started: false,
        stopped: false,
        connect() {},
        disconnect() {},
        start() {
          this.started = true;
        },
        stop(when) {
          // Scheduled oscillator endings are distinct from a mute/visibility stop.
          if (when === undefined) this.stopped = true;
        },
      };
      list.push(source);
      return source;
    }
    createOscillator() {
      return this.source(this.oscillators);
    }
    createBufferSource() {
      return this.source(this.sources);
    }
    async decodeAudioData() {
      return { duration: 0.25 };
    }
    async resume() {
      this.state = "running";
    }
    async suspend() {
      this.state = "suspended";
    }
    async close() {
      this.state = "closed";
    }
  }
  const values = {
    window: { AudioContext: Context },
    document,
    navigator: { userActivation: activation },
    fetch: async (url, options) => {
      requests.push({ url, signal: options.signal });
      if (downloadFails) throw new Error("offline");
      return new Response(new Uint8Array([1]));
    },
  };
  for (const [name, value] of Object.entries(values)) {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    });
  }
  const engine = new ElementalSoundEngine();
  engine.haptics = false;
  t.after(() => engine.dispose());
  return { engine, contexts, requests, document, activation };
}
const loaded = () => new Promise((resolve) => setImmediate(resolve));

test("sound needs both opt-in and a current gesture before creating or loading audio", (t) => {
  const { engine, contexts, requests, activation } = browserAudio(t);
  engine.playFeedback("tap");
  engine.playExcitePulse();
  assert.equal(contexts.length, 0);
  engine.isMuted = false;
  activation.isActive = false;
  engine.playFeedback("correct");
  assert.equal(contexts.length, 0);
  assert.equal(requests.length, 0);
});

test("exports replace the immediate fallback, mute stops current clips, and loading never autoplays", async (t) => {
  const { engine, contexts, requests } = browserAudio(t);
  engine.isMuted = false;
  engine.playFeedback("tap");
  const context = contexts[0];
  assert.equal(context.oscillators.length, 1);
  assert.equal(requests.length, 7);
  await loaded();
  assert.equal(context.sources.length, 0);
  engine.playFeedback("correct");
  engine.playElementResonance(8, 2);
  assert.equal(context.sources.length, 2);
  assert(context.sources.every((source) => source.started));
  engine.isMuted = true;
  assert(context.sources.every((source) => source.stopped));
  assert(context.oscillators.every((source) => source.stopped));
  engine.playFeedback("incorrect");
  assert.equal(context.sources.length, 2);
});

test("hidden tabs stop voices and stay silent until another visible gesture", async (t) => {
  const { engine, contexts, document, activation } = browserAudio(t);
  engine.isMuted = false;
  engine.playFeedback("tap");
  await loaded();
  engine.playFeedback("discover");
  const context = contexts[0];
  document.hidden = true;
  document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(context.state, "suspended");
  assert(context.sources.every((source) => source.stopped));
  engine.playFeedback("correct");
  assert.equal(context.sources.length, 1);
  document.hidden = false;
  activation.isActive = false;
  document.dispatchEvent(new Event("visibilitychange"));
  engine.playFeedback("tap");
  assert.equal(context.state, "suspended");
  activation.isActive = true;
  engine.playFeedback("tap");
  assert.equal(context.state, "running");
  assert.equal(context.sources.length, 2);
});

test("failed sound downloads preserve local feedback; disposal aborts requests and resets opt-in", async (t) => {
  const { engine, contexts, requests } = browserAudio(t, { downloadFails: true });
  engine.isMuted = false;
  engine.playFeedback("tap");
  await loaded();
  engine.playFeedback("correct");
  assert.equal(contexts[0].oscillators.length, 3);
  assert.equal(contexts[0].sources.length, 0);
  engine.dispose();
  assert(requests.every((request) => request.signal.aborted));
  assert.equal(contexts[0].state, "closed");
  assert.equal(engine.isMuted, true);
});

test("repeated interactions have a bounded number of simultaneous voices", async (t) => {
  const { engine, contexts } = browserAudio(t);
  engine.isMuted = false;
  engine.playFeedback("tap");
  await loaded();
  for (let i = 0; i < 100; i++) engine.playFeedback("tap");
  assert.equal(contexts[0].sources.length, 11);
});

test("the sound palette is small, mono PCM with audible samples and no clipping", async () => {
  let total = 0;
  for (const name of ["felt", "notch", "halo", "dew", "bloom", "shrug", "crest"]) {
    const file = await readFile(new URL(`../public/sounds/${name}.wav`, import.meta.url));
    total += file.length;
    assert.equal(file.toString("ascii", 0, 4), "RIFF");
    assert.equal(file.toString("ascii", 8, 12), "WAVE");
    let peak = 0;
    for (let offset = 12; offset + 8 <= file.length;) {
      const size = file.readUInt32LE(offset + 4);
      const chunk = file.toString("ascii", offset, offset + 4);
      const start = offset + 8;
      if (chunk === "fmt ") {
        assert.equal(file.readUInt16LE(start), 1);
        assert.equal(file.readUInt16LE(start + 2), 1);
        assert.equal(file.readUInt32LE(start + 4), 24_000);
        assert.equal(file.readUInt16LE(start + 14), 16);
      }
      if (chunk === "data")
        for (let i = start; i < start + size; i += 2)
          peak = Math.max(peak, Math.abs(file.readInt16LE(i)) / 32768);
      offset = start + size + (size % 2);
    }
    assert(peak > 0.01 && peak < 0.95, `${name}: peak ${peak}`);
  }
  assert(total < 300_000, `Sound palette exceeds mobile budget: ${total}`);
});
