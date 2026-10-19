"use client";

import { useEffect, useRef, type RefObject } from "react";
import { clampZoom, rotateModel, type ModelMotion } from "@/lib/model-motion";

export function useModelGestures(
  host: RefObject<HTMLDivElement | null>,
  motion: RefObject<ModelMotion>,
  {
    invalidate,
    onZoom,
    onTap,
    still,
  }: {
    invalidate: () => void;
    onZoom: (zoom: number) => void;
    onTap: (x: number, y: number) => void;
    still: boolean;
  },
) {
  const handlers = useRef({ invalidate, onZoom, onTap, still });
  useEffect(() => {
    handlers.current = { invalidate, onZoom, onTap, still };
  });
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const state = motion.current;
    const pointers = new Map<number, { x: number; y: number; time: number }>();
    let start = { x: 0, y: 0 };
    let moved = false;
    const zoom = (value: number) => {
      motion.current.zoom.target = clampZoom(value);
      handlers.current.onZoom(motion.current.zoom.target);
      handlers.current.invalidate();
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      node.focus({ preventScroll: true });
      node.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, time: event.timeStamp });
      motion.current.dragging = true;
      motion.current.vx = motion.current.vy = 0;
      if (pointers.size === 1) {
        start = { x: event.clientX, y: event.clientY };
        moved = false;
      } else moved = true;
    };
    const move = (event: PointerEvent) => {
      const before = pointers.get(event.pointerId);
      if (!before) return;
      moved ||= Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5;
      if (pointers.size > 1) {
        const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)![1];
        const oldDistance = Math.hypot(before.x - other.x, before.y - other.y);
        const newDistance = Math.hypot(event.clientX - other.x, event.clientY - other.y);
        if (oldDistance > 8) zoom((motion.current.zoom.target * newDistance) / oldDistance);
        motion.current.vx = motion.current.vy = 0;
      } else {
        rotateModel(
          motion.current,
          event.clientX - before.x,
          event.clientY - before.y,
          (event.timeStamp - before.time) / 1000,
        );
      }
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, time: event.timeStamp });
      handlers.current.invalidate();
    };
    const finish = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      if (!moved && pointers.size === 1 && event.type === "pointerup")
        handlers.current.onTap(event.clientX, event.clientY);
      pointers.delete(event.pointerId);
      if (event.type !== "pointerup" || handlers.current.still)
        motion.current.vx = motion.current.vy = 0;
      motion.current.dragging = pointers.size > 0;
      if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
      handlers.current.invalidate();
    };
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientHeight : 1);
      zoom(motion.current.zoom.target * Math.exp(-Math.max(-100, Math.min(100, delta)) * 0.002));
    };
    node.addEventListener("pointerdown", down);
    node.addEventListener("pointermove", move);
    node.addEventListener("pointerup", finish);
    node.addEventListener("pointercancel", finish);
    node.addEventListener("lostpointercapture", finish);
    node.addEventListener("wheel", wheel, { passive: false });
    return () => {
      state.dragging = false;
      state.vx = state.vy = 0;
      node.removeEventListener("pointerdown", down);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerup", finish);
      node.removeEventListener("pointercancel", finish);
      node.removeEventListener("lostpointercapture", finish);
      node.removeEventListener("wheel", wheel);
    };
  }, [host, motion]);
}
