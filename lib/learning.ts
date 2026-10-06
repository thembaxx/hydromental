/** Local-first learning progress. Atomic numbers are 1-based throughout this module. */
export type Theme = "" | "day" | "midnight" | "dusk" | "noir";
export type MissionId = "discover" | "quiz" | "review";
export interface LearningSettings {
  theme: Theme;
  sound: boolean;
  ambient: boolean;
  haptics: boolean;
  quality: "auto" | "low" | "high";
  model: "playful" | "scientific";
  labels: boolean;
}
export interface Mastery {
  correct: number;
  wrong: number;
  nextReview: number;
  /** Review interval in days. */
  interval: number;
}
export interface DailyProgress {
  discovered: number[];
  correct: number[];
  reviewed: number[];
  claimed: MissionId[];
}
export interface LearningState {
  version: 2;
  discovered: number[];
  xp: number;
  quizStreak: number;
  favorites: number[];
  history: Array<{ z: number; at: number }>;
  mastery: Record<string, Mastery>;
  activityDates: string[];
  settings: LearningSettings;
  daily: Record<string, DailyProgress>;
  badges: string[];
  onboardingDismissed: boolean;
}
export interface DailyMission {
  id: MissionId;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
  complete: boolean;
}
export interface CollectionDefinition {
  id: string;
  title: string;
  description: string;
  elements: readonly number[];
  kind: "family" | "expedition";
}
export interface CollectionProgress extends CollectionDefinition {
  discovered: number;
  total: number;
  complete: boolean;
}
export interface Achievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  earned: boolean;
}
interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export const LEARNING_STORAGE_KEY = "elementals.learning.v2";
const DAY = 86_400_000;
const MAX_XP = 1_000_000_000;
const missionIds: MissionId[] = ["discover", "quiz", "review"];
const validZ = (z: unknown): z is number =>
  Number.isInteger(z) && Number(z) >= 1 && Number(z) <= 118;
const uniqueElements = (value: unknown): number[] =>
  Array.isArray(value) ? [...new Set(value.filter(validZ))] : [];
const safeNumber = (value: unknown, fallback = 0, max = MAX_XP): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(0, value))
    : fallback;
const safeCount = (value: unknown): number => Math.floor(safeNumber(value));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const validDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};
/** Calendar days are UTC so exports and device timezone changes keep a stable daily ledger. */
export function learningDate(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}
function emptyDaily(): DailyProgress {
  return { discovered: [], correct: [], reviewed: [], claimed: [] };
}
export function initialLearningState(): LearningState {
  return {
    version: 2,
    discovered: Array.from({ length: 12 }, (_, i) => i + 1),
    xp: 120,
    quizStreak: 0,
    favorites: [],
    history: [],
    mastery: {},
    activityDates: [],
    settings: {
      theme: "",
      sound: false,
      ambient: false,
      haptics: true,
      quality: "auto",
      model: "playful",
      labels: false,
    },
    daily: {},
    badges: [],
    onboardingDismissed: false,
  };
}
function sanitizeState(value: unknown): LearningState {
  const fallback = initialLearningState();
  if (!isRecord(value) || value.version !== 2) return fallback;
  const rawSettings = isRecord(value.settings) ? value.settings : {};
  const theme = ["", "day", "midnight", "dusk", "noir"].includes(String(rawSettings.theme))
    ? (rawSettings.theme as Theme)
    : "";
  const mastery: Record<string, Mastery> = {};
  if (isRecord(value.mastery)) {
    for (const [key, item] of Object.entries(value.mastery)) {
      if (!validZ(Number(key)) || !isRecord(item)) continue;
      mastery[String(Number(key))] = {
        correct: safeCount(item.correct),
        wrong: safeCount(item.wrong),
        nextReview: safeNumber(item.nextReview, 0, 8_640_000_000_000_000),
        interval: safeNumber(item.interval, 0, 30),
      };
    }
  }
  const daily: Record<string, DailyProgress> = {};
  if (isRecord(value.daily)) {
    for (const date of Object.keys(value.daily).filter(validDate).sort().slice(-90)) {
      const item = value.daily[date];
      if (!isRecord(item)) continue;
      daily[date] = {
        discovered: uniqueElements(item.discovered),
        correct: uniqueElements(item.correct),
        reviewed: uniqueElements(item.reviewed),
        claimed: Array.isArray(item.claimed)
          ? [
              ...new Set(
                item.claimed.filter((id): id is MissionId => missionIds.includes(id as MissionId)),
              ),
            ]
          : [],
      };
    }
  }
  const history = Array.isArray(value.history)
    ? value.history
        .filter(
          (item) =>
            isRecord(item) &&
            validZ(item.z) &&
            typeof item.at === "number" &&
            Number.isFinite(item.at) &&
            item.at >= 0,
        )
        .slice(-60)
        .map((item) => ({ z: item.z as number, at: safeNumber(item.at, 0, 8_640_000_000_000_000) }))
    : [];
  return {
    version: 2,
    discovered: Array.isArray(value.discovered)
      ? uniqueElements(value.discovered)
      : fallback.discovered,
    xp: safeCount(value.xp),
    quizStreak: safeCount(value.quizStreak),
    favorites: uniqueElements(value.favorites),
    history,
    mastery,
    activityDates: Array.isArray(value.activityDates)
      ? [...new Set(value.activityDates.filter(validDate))].sort().slice(-400)
      : [],
    settings: {
      theme,
      sound: rawSettings.sound === true,
      ambient: rawSettings.ambient === true,
      haptics: rawSettings.haptics !== false,
      quality:
        rawSettings.quality === "low" || rawSettings.quality === "high"
          ? rawSettings.quality
          : "auto",
      model: rawSettings.model === "scientific" ? "scientific" : "playful",
      labels: rawSettings.labels === true,
    },
    daily,
    badges: Array.isArray(value.badges)
      ? [
          ...new Set(
            value.badges.filter(
              (id): id is string => typeof id === "string" && /^[a-z-]{1,40}$/.test(id),
            ),
          ),
        ]
      : [],
    onboardingDismissed: value.onboardingDismissed === true,
  };
}
function browserStorage(): ProgressStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
export function loadLearningState(
  storage: ProgressStorage | undefined = browserStorage(),
): LearningState {
  const initial = initialLearningState();
  if (!storage) return initial;
  try {
    const saved = storage.getItem(LEARNING_STORAGE_KEY);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (isRecord(parsed) && parsed.version === 2) return sanitizeState(parsed);
      } catch {
        // A damaged modern save may still have an intact legacy backup.
      }
    }
    let legacy: unknown;
    try {
      legacy = JSON.parse(storage.getItem("el") || "null");
    } catch {
      // Corrupt legacy progress should not discard an intact theme preference.
    }
    if (isRecord(legacy)) {
      if (Array.isArray(legacy.f))
        initial.discovered = uniqueElements(
          legacy.f.filter((i) => Number.isInteger(i) && i >= 0 && i < 118).map((i) => i + 1),
        );
      initial.xp = safeCount(legacy.x);
      initial.quizStreak = safeCount(legacy.s);
    }
    const theme = storage.getItem("th") ?? storage.getItem("elt");
    if (theme && ["day", "midnight", "dusk", "noir"].includes(theme))
      initial.settings.theme = theme as Theme;
  } catch {
    // Browsers with unavailable or full storage still allow an in-memory session.
  }
  return initial;
}
/** Returns false if storage is unavailable; callers can continue with in-memory progress. */
export function saveLearningState(
  state: LearningState,
  storage: ProgressStorage | undefined = browserStorage(),
): boolean {
  if (!storage) return false;
  try {
    const clean = sanitizeState(state);
    storage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(clean));
    storage.setItem(
      "el",
      JSON.stringify({ f: clean.discovered.map((z) => z - 1), x: clean.xp, s: clean.quizStreak }),
    );
    storage.setItem("th", clean.settings.theme);
    storage.setItem("elt", clean.settings.theme);
    return true;
  } catch {
    return false;
  }
}
function withActivity(state: LearningState, now: number): LearningState {
  const date = learningDate(now);
  return {
    ...state,
    activityDates: [...new Set([...state.activityDates, date])].sort().slice(-400),
    daily: { ...state.daily, [date]: state.daily[date] ?? emptyDaily() },
  };
}
function withBadges(state: LearningState): LearningState {
  return {
    ...state,
    badges: [
      ...new Set([
        ...state.badges,
        ...getAchievements(state)
          .filter((badge) => badge.earned)
          .map((badge) => badge.id),
      ]),
    ],
  };
}
export function discoverElement(state: LearningState, z: number, now = Date.now()): LearningState {
  if (!validZ(z)) return state;
  const date = learningDate(now);
  let next = withActivity(state, now);
  const isNew = !state.discovered.includes(z);
  next = {
    ...next,
    discovered: isNew ? [...state.discovered, z] : state.discovered,
    xp: Math.min(MAX_XP, state.xp + (isNew ? 10 : 0)),
    history: [...state.history.filter((entry) => entry.z !== z), { z, at: now }].slice(-60),
    daily: {
      ...next.daily,
      [date]: {
        ...next.daily[date],
        discovered: isNew
          ? [...new Set([...next.daily[date].discovered, z])]
          : next.daily[date].discovered,
      },
    },
  };
  return withBadges(next);
}
export function recordAnswer(
  state: LearningState,
  z: number,
  correct: boolean,
  now = Date.now(),
): LearningState {
  if (!validZ(z)) return state;
  const date = learningDate(now);
  const next = withActivity(state, now);
  const previous = state.mastery[String(z)] ?? { correct: 0, wrong: 0, nextReview: 0, interval: 0 };
  const wasDue = previous.correct + previous.wrong > 0 && previous.nextReview <= now;
  const interval = correct ? Math.min(30, Math.max(1, previous.interval * (wasDue ? 2 : 1))) : 0;
  const firstCorrectToday = correct && !next.daily[date].correct.includes(z);
  const mastery: Mastery = {
    correct: previous.correct + (correct ? 1 : 0),
    wrong: previous.wrong + (correct ? 0 : 1),
    nextReview: correct
      ? wasDue || !previous.nextReview
        ? now + interval * DAY
        : previous.nextReview
      : now + 10 * 60_000,
    interval,
  };
  return withBadges({
    ...next,
    xp: Math.min(MAX_XP, state.xp + (firstCorrectToday ? 5 : 0)),
    quizStreak: correct ? state.quizStreak + 1 : 0,
    mastery: { ...state.mastery, [String(z)]: mastery },
    daily: {
      ...next.daily,
      [date]: {
        ...next.daily[date],
        correct: correct
          ? [...new Set([...next.daily[date].correct, z])]
          : next.daily[date].correct,
        reviewed:
          correct && wasDue
            ? [...new Set([...next.daily[date].reviewed, z])]
            : next.daily[date].reviewed,
      },
    },
  });
}
export function toggleFavorite(state: LearningState, z: number): LearningState {
  if (!validZ(z)) return state;
  return {
    ...state,
    favorites: state.favorites.includes(z)
      ? state.favorites.filter((item) => item !== z)
      : [...state.favorites, z],
  };
}
export function getDailyMissions(state: LearningState, now = Date.now()): DailyMission[] {
  const daily = state.daily[learningDate(now)] ?? emptyDaily();
  const definitions = [
    {
      id: "discover" as const,
      title: "Three new discoveries",
      description: "Discover 3 elements you have not found before.",
      target: 3,
      progress: daily.discovered.length,
      reward: 30,
    },
    {
      id: "quiz" as const,
      title: "Curious mind",
      description: "Answer correctly about 3 different elements.",
      target: 3,
      progress: daily.correct.length,
      reward: 25,
    },
    {
      id: "review" as const,
      title: "Keep it fresh",
      description: "Correctly review 2 elements that are due.",
      target: 2,
      progress: daily.reviewed.length,
      reward: 20,
    },
  ];
  return definitions.map((mission) => ({
    ...mission,
    progress: Math.min(mission.target, mission.progress),
    claimed: daily.claimed.includes(mission.id),
    complete: mission.progress >= mission.target,
  }));
}
export function claimMission(state: LearningState, id: MissionId, now = Date.now()): LearningState {
  const mission = getDailyMissions(state, now).find((item) => item.id === id);
  if (!mission?.complete || mission.claimed) return state;
  const date = learningDate(now);
  const next = withActivity(state, now);
  return withBadges({
    ...next,
    xp: Math.min(MAX_XP, next.xp + mission.reward),
    daily: {
      ...next.daily,
      [date]: { ...next.daily[date], claimed: [...next.daily[date].claimed, id] },
    },
  });
}
/** One missed day is forgiven within the current streak. Only actual learning days count. */
export function getLearningStreak(state: LearningState, now = Date.now()): number {
  const today = Date.parse(`${learningDate(now)}T00:00:00Z`);
  const dates = [
    ...new Set(
      state.activityDates.filter(
        (date) => validDate(date) && Date.parse(`${date}T00:00:00Z`) <= today,
      ),
    ),
  ]
    .sort()
    .reverse();
  if (!dates.length || today - Date.parse(`${dates[0]}T00:00:00Z`) > 2 * DAY) return 0;
  let graceUsed = today - Date.parse(`${dates[0]}T00:00:00Z`) === 2 * DAY;
  let count = 1;
  for (let i = 1; i < dates.length; i++) {
    const gap = Date.parse(`${dates[i - 1]}T00:00:00Z`) - Date.parse(`${dates[i]}T00:00:00Z`);
    if (gap === DAY) count++;
    else if (gap === 2 * DAY && !graceUsed) {
      graceUsed = true;
      count++;
    } else break;
  }
  return count;
}
export function getDueElements(state: LearningState, now = Date.now()): number[] {
  return Object.entries(state.mastery)
    .filter(
      ([z, mastery]) =>
        validZ(Number(z)) && mastery.correct + mastery.wrong > 0 && mastery.nextReview <= now,
    )
    .sort(
      ([, a], [, b]) =>
        b.wrong / Math.max(1, b.correct + b.wrong) - a.wrong / Math.max(1, a.correct + a.wrong) ||
        a.nextReview - b.nextReview,
    )
    .map(([z]) => Number(z));
}
export function getLevel(xp: number): {
  level: number;
  title: string;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const score = safeCount(xp);
  const level = Math.floor(Math.sqrt(score / 100)) + 1;
  const currentXp = (level - 1) ** 2 * 100;
  const nextLevelXp = level ** 2 * 100;
  const titles = [
    "Curious explorer",
    "Atom apprentice",
    "Element adventurer",
    "Science storyteller",
    "Periodic pioneer",
    "Cosmic scholar",
  ];
  return {
    level,
    title: titles[Math.min(titles.length - 1, level - 1)],
    currentXp,
    nextLevelXp,
    progress: (score - currentXp) / (nextLevelXp - currentXp),
  };
}
export const collectionDefinitions: readonly CollectionDefinition[] = [
  {
    id: "alkali",
    title: "Alkali metals",
    description: "Discover a family with one outer electron.",
    elements: [3, 11, 19, 37, 55, 87],
    kind: "family",
  },
  {
    id: "alkaline-earth",
    title: "Alkaline earth metals",
    description: "Explore calcium and its chemical relatives.",
    elements: [4, 12, 20, 38, 56, 88],
    kind: "family",
  },
  {
    id: "halogens",
    title: "Halogens",
    description: "Meet the reactive group 17 family.",
    elements: [9, 17, 35, 53, 85, 117],
    kind: "family",
  },
  {
    id: "noble-gases",
    title: "Noble gases",
    description: "Visit the group 18 family.",
    elements: [2, 10, 18, 36, 54, 86, 118],
    kind: "family",
  },
  {
    id: "transition-metals",
    title: "Transition metals",
    description: "Discover the metals at the heart of the periodic table.",
    elements: [
      ...Array.from({ length: 10 }, (_, i) => 21 + i),
      ...Array.from({ length: 10 }, (_, i) => 39 + i),
      ...Array.from({ length: 9 }, (_, i) => 72 + i),
      ...Array.from({ length: 9 }, (_, i) => 104 + i),
    ],
    kind: "family",
  },
  {
    id: "post-transition",
    title: "Post-transition metals",
    description: "Explore aluminium, tin, and their neighbours.",
    elements: [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116],
    kind: "family",
  },
  {
    id: "metalloids",
    title: "Metalloids",
    description: "Meet elements with properties between metals and nonmetals.",
    elements: [5, 14, 32, 33, 51, 52],
    kind: "family",
  },
  {
    id: "nonmetals",
    title: "Nonmetals",
    description: "Discover the diverse nonmetals outside groups 17 and 18.",
    elements: [1, 6, 7, 8, 15, 16, 34],
    kind: "family",
  },
  {
    id: "lanthanides",
    title: "Lanthanides",
    description: "Explore a series used in magnets, optics, and electronics.",
    elements: Array.from({ length: 15 }, (_, i) => 57 + i),
    kind: "family",
  },
  {
    id: "actinides",
    title: "Actinides",
    description: "Meet the radioactive actinide series.",
    elements: Array.from({ length: 15 }, (_, i) => 89 + i),
    kind: "family",
  },
  {
    id: "phone",
    title: "Inside your phone",
    description: "Find elements used in circuits, batteries, and screens.",
    elements: [3, 6, 13, 14, 27, 29, 49, 73, 79],
    kind: "expedition",
  },
  {
    id: "life",
    title: "Building blocks of life",
    description: "Discover six elements central to living things.",
    elements: [1, 6, 7, 8, 15, 16],
    kind: "expedition",
  },
  {
    id: "stars",
    title: "A journey through stars",
    description: "Explore elements linked to stellar fusion and cosmic chemistry.",
    elements: [1, 2, 6, 8, 14, 26],
    kind: "expedition",
  },
  {
    id: "kitchen",
    title: "Kitchen chemistry",
    description: "Find elements in salt, cookware, and food.",
    elements: [6, 8, 11, 13, 17, 20, 26, 29],
    kind: "expedition",
  },
];
export function getCollections(state: LearningState): CollectionProgress[] {
  return collectionDefinitions.map((collection) => {
    const discovered = collection.elements.filter((z) => state.discovered.includes(z)).length;
    return {
      ...collection,
      discovered,
      total: collection.elements.length,
      complete: discovered === collection.elements.length,
    };
  });
}
export function getAchievements(state: LearningState): Achievement[] {
  const mastered = Object.values(state.mastery).filter(
    (item) => item.correct >= 3 && item.correct > item.wrong,
  ).length;
  const completed = getCollections(state).filter((collection) => collection.complete).length;
  const correct = Object.values(state.mastery).reduce((sum, item) => sum + item.correct, 0);
  const claimed = Object.values(state.daily).reduce((sum, daily) => sum + daily.claimed.length, 0);
  const definitions = [
    {
      id: "explorer",
      title: "Beyond the familiar",
      description: "Discover 20 elements.",
      target: 20,
      progress: state.discovered.length,
    },
    {
      id: "collector",
      title: "Element collector",
      description: "Discover 60 elements.",
      target: 60,
      progress: state.discovered.length,
    },
    {
      id: "periodic-pioneer",
      title: "Periodic pioneer",
      description: "Discover all 118 elements.",
      target: 118,
      progress: state.discovered.length,
    },
    {
      id: "curious-mind",
      title: "Curious mind",
      description: "Give 10 correct answers.",
      target: 10,
      progress: correct,
    },
    {
      id: "mastery",
      title: "Making it stick",
      description:
        "Answer correctly at least 3 times for 5 elements, with more correct answers than mistakes.",
      target: 5,
      progress: mastered,
    },
    {
      id: "expedition",
      title: "Collection complete",
      description: "Complete an element collection.",
      target: 1,
      progress: completed,
    },
    {
      id: "mission",
      title: "Mission accomplished",
      description: "Claim a daily mission reward.",
      target: 1,
      progress: claimed,
    },
  ];
  return definitions.map((badge) => ({
    ...badge,
    progress: Math.min(badge.progress, badge.target),
    earned: badge.progress >= badge.target || state.badges.includes(badge.id),
  }));
}
export function exportProgress(state: LearningState): string {
  return JSON.stringify(
    {
      format: "elementals-progress",
      exportedAt: new Date().toISOString(),
      state: sanitizeState(state),
    },
    null,
    2,
  );
}
/** Throws a user-readable error rather than silently replacing progress with an invalid import. */
export function importProgress(text: string): LearningState {
  if (text.length > 1_000_000) throw new Error("This progress file is too large.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Choose a valid Elementals JSON progress file.");
  }
  const value = isRecord(parsed) && parsed.format === "elementals-progress" ? parsed.state : parsed;
  if (
    !isRecord(value) ||
    value.version !== 2 ||
    !Array.isArray(value.discovered) ||
    !Array.isArray(value.favorites) ||
    !isRecord(value.settings) ||
    !isRecord(value.mastery) ||
    typeof value.xp !== "number" ||
    !Number.isFinite(value.xp)
  ) {
    throw new Error("This file does not contain supported Elementals progress (version 2).");
  }
  return sanitizeState(value);
}
