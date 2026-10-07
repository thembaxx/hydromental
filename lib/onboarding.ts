/** Device-local first-visit state; replaying the guide never changes learning progress. */
export const ONBOARDING_STORAGE_KEY = "elementals.onboarding.v1";
let finishedInSession = false;

export function shouldShowOnboarding(): boolean {
  if (finishedInSession) return false;
  try {
    const storage = window.localStorage;
    if (storage.getItem(ONBOARDING_STORAGE_KEY) === "pending") return true;
    return (
      storage.getItem(ONBOARDING_STORAGE_KEY) !== "done" &&
      !storage.getItem("elementals.learning.v2") &&
      !storage.getItem("el")
    );
  } catch {
    return true;
  }
}

export function beginOnboarding(): void {
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "pending");
  } catch {
    // First-time visitors can still use the guide without persistent storage.
  }
}

export function finishOnboarding(): void {
  finishedInSession = true;
  try {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "done");
  } catch {
    // The current session can still continue when storage is blocked or full.
  }
}
