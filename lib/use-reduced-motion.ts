"use client";

import { useSyncExternalStore } from "react";

function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

/** Follow live device changes as well as the preference at first render. */
export function useReducedMotionPreference() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}
