"use client";
import { useEffect, useRef } from "react";
import { trackProductEvent } from "./measurement";
import type { GameSession } from "./learning";

export function useLessonMeasurement(session: GameSession | null, run = 0) {
  const active = useRef<{
    key: string;
    game: string;
    finished: boolean;
    abandoned: boolean;
  } | null>(null);
  const mounted = useRef(false);
  const abandon = () => {
    const current = active.current;
    if (current && !current.finished && !current.abandoned) {
      current.abandoned = true;
      trackProductEvent("lesson_abandoned", { game: current.game });
    }
  };
  const key = session ? `${run}:${session.game}:${session.index}` : "";
  const game = session?.game;
  useEffect(() => {
    if (active.current?.key === key) return;
    abandon();
    active.current = game ? { key, game, finished: false, abandoned: false } : null;
    if (game) trackProductEvent("lesson_started", { game });
  }, [key, game]);
  useEffect(() => {
    mounted.current = true;
    const leave = () => abandon();
    window.addEventListener("pagehide", leave);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", leave);
      queueMicrotask(() => {
        if (!mounted.current) abandon();
      });
    };
  }, []);
  return (correct: boolean) => {
    const current = active.current;
    if (!current) return;
    trackProductEvent("lesson_attempt", {
      game: current.game,
      result: correct ? "correct" : "incorrect",
    });
    if (correct && !current.finished) {
      current.finished = true;
      trackProductEvent("lesson_completed", { game: current.game, result: "correct" });
    }
  };
}
