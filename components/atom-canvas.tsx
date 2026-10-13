"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { createAtomScene, type SceneControls } from "@/lib/atom-scene";
import type { Element } from "@/lib/elements";

export type AtomSceneApi = ReturnType<typeof createAtomScene>;

export function AtomCanvas({
  element,
  controls,
  apiRef,
  onUnavailable,
  suspended = false,
}: {
  element: Element;
  controls: RefObject<SceneControls>;
  apiRef?: RefObject<AtomSceneApi | null>;
  onUnavailable?: () => void;
  suspended?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<AtomSceneApi | null>(null);
  const initialElement = useRef(element);
  const unavailableCallback = useRef(onUnavailable);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    unavailableCallback.current = onUnavailable;
  }, [onUnavailable]);
  useEffect(() => {
    const target = canvas.current!;
    const unavailable = () => {
      setUnavailable(true);
      unavailableCallback.current?.();
    };
    const restored = () => setUnavailable(false);
    target.addEventListener("webglcontextlost", unavailable);
    target.addEventListener("webglcontextrestored", restored);
    try {
      scene.current = createAtomScene(target, controls.current, initialElement.current);
      if (apiRef) apiRef.current = scene.current;
    } catch {
      // oxlint-disable-next-line react/set-state-in-effect -- Renderer creation determines browser availability.
      unavailable();
    }
    return () => {
      target.removeEventListener("webglcontextlost", unavailable);
      target.removeEventListener("webglcontextrestored", restored);
      scene.current?.dispose();
      scene.current = null;
      if (apiRef) apiRef.current = null;
    };
  }, [controls, apiRef]);
  useEffect(() => {
    scene.current?.setElement(element);
  }, [element]);
  useEffect(() => {
    scene.current?.setSuspended(suspended);
  }, [suspended, controls, apiRef]);
  return (
    <>
      <canvas
        ref={canvas}
        id="gl"
        className="absolute inset-0 size-full"
        aria-label={`Interactive illustration of ${element.n}. Swipe to travel, or open Element details to learn more.`}
      />
      {unavailable && (
        <p
          className="atom-unavailable absolute inset-x-0 top-[55%] text-center text-sm"
          role="status"
        >
          3D is temporarily unavailable. You can still explore every element, its data, and quizzes.
        </p>
      )}
    </>
  );
}
