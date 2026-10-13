"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { navigationState } from "@/lib/navigation-state";

const changeEvent = "elementals:panel-navigation";
const stateKey = "elementalsPanel";

/** Panels participate in browser Back/Forward without leaving the current atom. */
export function usePanelNavigation<T extends string>(
  panels: readonly T[],
  workspace: (panel: T) => string,
) {
  const closingUrl = useRef<string | null>(null);
  const snapshot = useCallback(() => {
    const value = new URLSearchParams(window.location.search).get("panel");
    return panels.includes(value as T) ? (value as T) : null;
  }, [panels]);
  const subscribe = useCallback((notify: () => void) => {
    const pop = () => {
      if (closingUrl.current) {
        const state = navigationState();
        delete state[stateKey];
        window.history.replaceState(state, "", closingUrl.current);
        closingUrl.current = null;
      }
      notify();
    };
    window.addEventListener("popstate", pop);
    window.addEventListener(changeEvent, notify);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener(changeEvent, notify);
    };
  }, []);
  const panel = useSyncExternalStore(subscribe, snapshot, () => null);
  const close = useCallback(() => {
    if (closingUrl.current || !snapshot()) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("panel");
    const depth = window.history.state?.[stateKey]?.depth;
    if (Number.isInteger(depth) && depth > 0) {
      // Carry the latest element selection back to the underlying explorer entry.
      closingUrl.current = url.href;
      window.history.go(-depth);
    } else {
      window.history.replaceState(navigationState(), "", url);
      window.dispatchEvent(new Event(changeEvent));
    }
  }, [snapshot]);
  const navigate = useCallback(
    (next: T | null) => {
      if (next === null) return close();
      if (closingUrl.current) return;
      const previous = snapshot();
      const url = new URL(window.location.href);
      url.searchParams.set("panel", next);
      const replace = previous !== null && workspace(previous) === workspace(next);
      const previousDepth = window.history.state?.[stateKey]?.depth;
      const depth = Number.isInteger(previousDepth) ? previousDepth : 0;
      const state = navigationState({
        [stateKey]: { depth: replace ? depth : depth + 1 },
      });
      window.history[replace ? "replaceState" : "pushState"](state, "", url);
      window.dispatchEvent(new Event(changeEvent));
    },
    [close, snapshot, workspace],
  );
  return [panel, navigate, close] as const;
}
