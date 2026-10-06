import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LEARNING_STORAGE_KEY,
  claimMission,
  discoverElement,
  exportProgress,
  getAchievements,
  getCollections,
  getDailyMissions,
  getDueElements,
  getLearningStreak,
  getLevel,
  importProgress,
  initialLearningState,
  loadLearningState,
  recordAnswer,
  saveLearningState,
  toggleFavorite,
} from "../lib/learning.ts";

const DAY = 86_400_000;
const now = Date.parse("2026-10-06T12:00:00Z");
function storage(entries = {}) {
  const data = new Map(Object.entries(entries));
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("preserves the original first twelve elements and 120 XP", () => {
  const state = initialLearningState();
  assert.equal(state.xp, 120);
  assert.deepEqual(
    state.discovered,
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  state.discovered.push(13);
  assert.equal(initialLearningState().discovered.length, 12);
});

test("migrates legacy zero-based discoveries and theme without accepting corrupt members", () => {
  const saved = storage({
    el: JSON.stringify({ f: [0, 7, 7, -1, 118, "3"], x: 143, s: 4 }),
    th: "dusk",
  });
  const state = loadLearningState(saved);
  assert.deepEqual(state.discovered, [1, 8]);
  assert.equal(state.xp, 143);
  assert.equal(state.quizStreak, 4);
  assert.equal(state.settings.theme, "dusk");
});

test("loads a legacy backup if the modern save is damaged", () => {
  const saved = storage({
    [LEARNING_STORAGE_KEY]: "{broken",
    el: JSON.stringify({ f: [25], x: 10, s: 0 }),
  });
  assert.deepEqual(loadLearningState(saved).discovered, [26]);
});

test("a damaged legacy save does not discard an intact theme", () => {
  assert.equal(loadLearningState(storage({ el: "broken", th: "day" })).settings.theme, "day");
});

test("storage writes round-trip and preserve legacy compatibility", () => {
  for (const theme of ["midnight", "noir"]) {
    const saved = storage();
    let state = discoverElement(initialLearningState(), 26, now);
    state = toggleFavorite(state, 26);
    state.settings.theme = theme;
    state.onboardingDismissed = true;
    assert.equal(saveLearningState(state, saved), true);
    assert.deepEqual(loadLearningState(saved), state);
    assert.equal(JSON.parse(saved.getItem("el")).f.at(-1), 25);
    assert.equal(saved.getItem("th"), theme);
  }
});

test("unavailable storage never prevents an in-memory session", () => {
  const blocked = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("full");
    },
  };
  assert.equal(loadLearningState(blocked).xp, 120);
  assert.equal(saveLearningState(initialLearningState(), blocked), false);
});

test("new discoveries earn XP once while history records the latest visit", () => {
  const start = initialLearningState();
  const first = discoverElement(start, 26, now);
  const repeat = discoverElement(first, 26, now + 1);
  assert.equal(start.xp, 120);
  assert.equal(first.xp, 130);
  assert.equal(repeat.xp, 130);
  assert.deepEqual(repeat.history, [{ z: 26, at: now + 1 }]);
  assert.equal(getDailyMissions(repeat, now)[0].progress, 1);
  assert.equal(discoverElement(repeat, 119), repeat);
});

test("favorites toggle independently of discoveries", () => {
  const first = toggleFavorite(initialLearningState(), 79);
  assert.deepEqual(first.favorites, [79]);
  assert.equal(first.discovered.includes(79), false);
  assert.deepEqual(toggleFavorite(first, 79).favorites, []);
  assert.equal(toggleFavorite(first, 0), first);
});

test("incorrect answers reset the quiz streak and schedule a near-term review", () => {
  const first = recordAnswer(initialLearningState(), 8, true, now);
  const wrong = recordAnswer(first, 8, false, now + 1000);
  assert.equal(wrong.quizStreak, 0);
  assert.equal(wrong.mastery[8].wrong, 1);
  assert.equal(wrong.mastery[8].nextReview, now + 1000 + 600_000);
  assert.deepEqual(getDueElements(wrong, now), []);
  assert.deepEqual(getDueElements(wrong, now + 601_000), [8]);
});

test("review spacing grows when due, early repeats do not farm XP or postpone review", () => {
  const first = recordAnswer(initialLearningState(), 8, true, now);
  const repeat = recordAnswer(first, 8, true, now + 1000);
  assert.equal(repeat.xp, first.xp);
  assert.equal(repeat.mastery[8].nextReview, first.mastery[8].nextReview);
  assert.equal(repeat.mastery[8].interval, 1);
  const due = recordAnswer(repeat, 8, true, now + DAY);
  assert.equal(due.mastery[8].interval, 2);
  assert.equal(due.mastery[8].nextReview, now + 3 * DAY);
  assert.equal(
    getDailyMissions(due, now + DAY).find((mission) => mission.id === "review").progress,
    1,
  );
});

test("reviews prioritize mistakes ahead of older successful answers", () => {
  let state = recordAnswer(initialLearningState(), 8, true, now);
  state = recordAnswer(state, 26, false, now + 1);
  assert.deepEqual(getDueElements(state, now + DAY), [26, 8]);
});

test("mission claims require completion and grant their reward only once", () => {
  let state = initialLearningState();
  assert.equal(claimMission(state, "discover", now), state);
  for (const z of [13, 14, 15]) state = discoverElement(state, z, now);
  assert.equal(getDailyMissions(state, now)[0].complete, true);
  const claimed = claimMission(state, "discover", now);
  assert.equal(claimed.xp, state.xp + 30);
  assert.equal(claimMission(claimed, "discover", now), claimed);
  assert.equal(getDailyMissions(claimed, now + DAY)[0].progress, 0);
  assert.equal(getAchievements(claimed).find((badge) => badge.id === "mission").earned, true);
});

test("quiz missions require different elements instead of repeated correct answers", () => {
  let state = initialLearningState();
  for (let i = 0; i < 5; i++) state = recordAnswer(state, 8, true, now + i);
  assert.equal(getDailyMissions(state, now).find((mission) => mission.id === "quiz").progress, 1);
  assert.equal(claimMission(state, "quiz", now), state);
});

test("one missed calendar day is forgiven and actual learning days determine the streak", () => {
  const state = initialLearningState();
  state.activityDates = ["2026-10-01", "2026-10-03", "2026-10-04", "2026-10-06"];
  assert.equal(getLearningStreak(state, now), 3);
  assert.equal(getLearningStreak(state, now + 3 * DAY), 0);
  state.activityDates = ["2026-10-03", "2026-10-04"];
  assert.equal(getLearningStreak(state, now), 2);
});

test("collection completion and level boundaries are stable", () => {
  const state = initialLearningState();
  state.discovered = [1, 6, 7, 8, 15, 16];
  assert.equal(getCollections(state).find((item) => item.id === "life").complete, true);
  assert.equal(getLevel(99).level, 1);
  assert.equal(getLevel(100).level, 2);
  assert.equal(getLevel(400).level, 3);
  assert.equal(getLevel(-3).progress, 0);
});

test("the ten family collections cover all 118 elements exactly once", () => {
  const familyElements = getCollections(initialLearningState())
    .filter((item) => item.kind === "family")
    .flatMap((item) => item.elements);
  assert.equal(familyElements.length, 118);
  assert.equal(new Set(familyElements).size, 118);
  assert.deepEqual(
    [...familyElements].sort((a, b) => a - b),
    Array.from({ length: 118 }, (_, i) => i + 1),
  );
});

test("future imported activity dates do not inflate today's streak", () => {
  const state = initialLearningState();
  state.activityDates = ["2026-10-05", "2026-10-06", "2099-01-01"];
  assert.equal(getLearningStreak(state, now), 2);
});

test("portable export/import retains progress and settings without exposing executable content", () => {
  const state = recordAnswer(discoverElement(initialLearningState(), 79, now), 79, false, now);
  state.settings.sound = true;
  assert.deepEqual(importProgress(exportProgress(state)), state);
  assert.throws(() => importProgress("<script>alert(1)</script>"), /valid Elementals/);
  assert.throws(() => importProgress('{"version":3}'), /version 2/);
  assert.throws(() => importProgress("x".repeat(1_000_001)), /too large/);
});

test("malformed imports are sanitized and dangerous object keys are ignored", () => {
  const state = initialLearningState();
  const parsed = JSON.parse(JSON.stringify(state));
  parsed.discovered = [1, 118, 118, -1, 119, "8"];
  parsed.xp = -30;
  parsed.mastery = JSON.parse(
    '{"__proto__":{"correct":1},"8":{"correct":-2,"wrong":null,"interval":100,"nextReview":0}}',
  );
  parsed.activityDates = ["2026-02-31", "2026-10-06", "2026-10-06"];
  const imported = importProgress(JSON.stringify(parsed));
  assert.deepEqual(imported.discovered, [1, 118]);
  assert.equal(imported.xp, 0);
  assert.deepEqual(imported.activityDates, ["2026-10-06"]);
  assert.equal(imported.mastery[8].interval, 30);
  assert.equal(Object.hasOwn(imported.mastery, "__proto__"), false);
});

test("ambient audio persists only a boolean preference and defaults off for older saves", () => {
  const state = initialLearningState();
  assert.equal(state.settings.ambient, false);
  state.settings.ambient = true;
  const saved = storage();
  assert.equal(saveLearningState(state, saved), true);
  assert.equal(loadLearningState(saved).settings.ambient, true);
  const older = JSON.parse(exportProgress(state));
  delete older.state.settings.ambient;
  assert.equal(importProgress(JSON.stringify(older)).settings.ambient, false);
});

test("corrupt settings are normalized without enabling optional audio", () => {
  const state = initialLearningState();
  const parsed = JSON.parse(exportProgress(state));
  parsed.state.settings = {
    theme: "neon",
    sound: "true",
    ambient: "true",
    haptics: null,
    quality: "ultra",
    model: "literal",
    labels: 1,
  };
  const imported = importProgress(JSON.stringify(parsed));
  assert.deepEqual(imported.settings, {
    theme: "",
    sound: false,
    ambient: false,
    haptics: true,
    quality: "auto",
    model: "playful",
    labels: false,
  });
});
