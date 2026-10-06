"use client";
import { useRef, useState } from "react";
type Direction = "u" | "d" | "l" | "r";
export function NavigationScrubber({
  id,
  label,
  value,
  vertical,
  onNavigate,
}: {
  id: string;
  label: string;
  value: number | string;
  vertical?: boolean;
  onNavigate: (d: Direction) => void;
}) {
  const start = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const end = () => {
    start.current = null;
    setOffset(0);
  };
  return (
    <div
      id={id}
      className={`wp ${vertical ? "left-3" : "right-3"}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-valuemin={vertical ? 1 : 0}
      aria-valuemax={vertical ? 7 : 18}
      aria-valuenow={typeof value === "number" ? value : 0}
      aria-valuetext={typeof value === "number" ? String(value) : "No group label in this view"}
      style={{ transform: `translate${vertical ? "Y" : "X"}(${offset}px)` }}
      onPointerDown={(e) => {
        start.current = vertical ? e.clientY : e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current === null) return;
        const current = vertical ? e.clientY : e.clientX,
          delta = current - start.current;
        setOffset(Math.max(-16, Math.min(16, delta * 0.3)));
        if (Math.abs(delta) > 34) {
          start.current = current;
          onNavigate(vertical ? (delta > 0 ? "d" : "u") : delta > 0 ? "r" : "l");
        }
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={(e) => {
        const d: Record<string, Direction> = {
          ArrowUp: "u",
          ArrowDown: "d",
          ArrowLeft: "l",
          ArrowRight: "r",
        };
        if (d[e.key]) {
          e.preventDefault();
          e.stopPropagation();
          onNavigate(d[e.key]);
        }
      }}
    >
      {label} <span className="n">{value}</span>
    </div>
  );
}
