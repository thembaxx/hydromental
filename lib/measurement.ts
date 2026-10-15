/** Only fixed product categories and public element numbers may leave the browser. */
export const MEASUREMENT_KEY = "elementals.measurement.v1";
export const MEASUREMENT_CHANGE = "elementals-measurement-change";
let deniedInSession = false;
type EventFields = {
  element_discovered: { element: number };
  quiz_started: { mode: string };
  quiz_answer: { mode: string; concept: string; result: string; element: number };
  lesson_started: { game: string };
  lesson_attempt: { game: string; result: string };
  lesson_completed: { game: string; result: string };
  lesson_abandoned: { game: string };
  onboarding_started: Record<string, never>;
  onboarding_completed: { result: string };
  onboarding_abandoned: { step: number };
  webgl_error: { kind: string };
  render_sample: { fps: string; quality: string };
  quality_adjusted: { quality: string };
  web_vital: { metric: string; rating: string; value: number };
};
const enums: Record<string, readonly string[]> = {
  mode: ["standard", "review", "mystery", "where"],
  concept: ["symbol", "name", "atomic_number", "family", "everyday"],
  result: ["correct", "incorrect", "finished", "skipped"],
  game: [
    "atom",
    "molecule",
    "balance",
    "periodic",
    "detective",
    "mystery",
    "crystal",
    "properties",
  ],
  kind: ["renderer", "asset", "context_lost", "context_restored"],
  fps: ["under_30", "30_to_49", "50_plus"],
  quality: ["auto", "low", "high"],
  metric: ["LCP", "INP", "CLS"],
  rating: ["good", "needs-improvement", "poor"],
};
const fields: Record<keyof EventFields, readonly string[]> = {
  element_discovered: ["element"],
  quiz_started: ["mode"],
  quiz_answer: ["mode", "concept", "result", "element"],
  lesson_started: ["game"],
  lesson_attempt: ["game", "result"],
  lesson_completed: ["game", "result"],
  lesson_abandoned: ["game"],
  onboarding_started: [],
  onboarding_completed: ["result"],
  onboarding_abandoned: ["step"],
  webgl_error: ["kind"],
  render_sample: ["fps", "quality"],
  quality_adjusted: ["quality"],
  web_vital: ["metric", "rating", "value"],
};
export function sanitizeMeasurement(
  name: string,
  data: Record<string, unknown>,
): Record<string, string | number> | null {
  if (!Object.hasOwn(fields, name)) return null;
  const result: Record<string, string | number> = {};
  for (const key of fields[name as keyof EventFields]) {
    const value = data[key];
    if (key === "value") {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100_000)
        return null;
    } else if (key === "element" || key === "step") {
      if (
        typeof value !== "number" ||
        !Number.isInteger(value) ||
        value < (key === "element" ? 1 : 0) ||
        value > (key === "element" ? 118 : 4)
      )
        return null;
    } else if (typeof value !== "string" || !enums[key]?.includes(value)) return null;
    result[key] = value as string | number;
  }
  // Base Pro allows two custom properties. Keep the richer internal schema
  // validated, then group fixed categories rather than upgrading to Analytics Plus.
  if (name === "quiz_answer")
    return { concept: `${result.mode}:${result.concept}`, result: result.result };
  if (name === "web_vital")
    return { metric: `${result.metric}:${result.rating}`, value: result.value };
  return result;
}
export function measurementAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (deniedInSession) return false;
  if (
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl
  )
    return false;
  try {
    return localStorage.getItem(MEASUREMENT_KEY) === "granted";
  } catch {
    return false;
  }
}
export function subscribeMeasurement(callback: () => void) {
  window.addEventListener(MEASUREMENT_CHANGE, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(MEASUREMENT_CHANGE, callback);
    window.removeEventListener("storage", callback);
  };
}
export function setMeasurementConsent(granted: boolean): boolean {
  deniedInSession = !granted;
  try {
    localStorage.setItem(MEASUREMENT_KEY, granted ? "granted" : "denied");
  } catch {
    deniedInSession = true;
    try {
      localStorage.removeItem(MEASUREMENT_KEY);
    } catch {
      /* The session denial still applies. */
    }
    window.dispatchEvent(new Event(MEASUREMENT_CHANGE));
    return false;
  }
  window.dispatchEvent(new Event(MEASUREMENT_CHANGE));
  return true;
}
export function measurementUrl(raw: string): string {
  const url = new URL(raw);
  // No query strings, fragments, arbitrary paths, journal text or creation titles.
  const path = /^\/(?:elements(?:\/[a-z]+)?|playground|welcome|privacy)?$/.test(url.pathname)
    ? url.pathname
    : "/other";
  return `${url.origin}${path}`;
}
export function filterMeasurementEvent<T extends { url: string }>(event: T): T | null {
  if (!measurementAllowed() || !navigator.onLine) return null;
  try {
    return { ...event, url: measurementUrl(event.url) };
  } catch {
    return null;
  }
}
export function trackProductEvent<K extends keyof EventFields>(name: K, data: EventFields[K]) {
  if (process.env.NEXT_PUBLIC_PRODUCT_EVENTS_ENABLED !== "true") return;
  if (!measurementAllowed() || !navigator.onLine) return;
  const safe = sanitizeMeasurement(name, data);
  if (!safe) return;
  void import("@vercel/analytics")
    .then(({ track, inject }) => {
      if (measurementAllowed() && navigator.onLine) {
        // Early renderer errors can precede the React Analytics mount. Register
        // the URL/consent filter before queueing even that very first event.
        inject({ mode: "production", beforeSend: filterMeasurementEvent });
        track(name, safe);
      }
    })
    .catch(() => {
      /* Optional metrics never interrupt learning or queue offline activity. */
    });
}
