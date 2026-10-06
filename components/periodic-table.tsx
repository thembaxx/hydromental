"use client";
import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from "react";
import { categories, elements, neighbour } from "@/lib/elements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
export function PeriodicTable({
  current,
  found,
  pick,
  close,
  quiz,
}: {
  current: number;
  found: Set<number>;
  pick: (index: number) => void;
  close: () => void;
  quiz: () => void;
}) {
  const table = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, [number, number]>());
  const pinch = useRef({ distance: 1, size: 56 });
  const [size, setSize] = useState(56);
  const [focused, setFocused] = useState(current);
  const zoom = (value: number) => setSize(Math.max(30, Math.min(78, value)));
  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  };
  useEffect(() => {
    const root = table.current!;
    const selected = root.querySelector<HTMLButtonElement>(".sel");
    if (selected)
      root.scrollTo({
        left: selected.offsetLeft - root.clientWidth / 2 + 28,
        top: selected.offsetTop - 40,
      });
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setSize((prev) => Math.max(30, Math.min(78, prev * (e.deltaY < 0 ? 1.08 : 0.93))));
      }
    };
    root.addEventListener("wheel", wheel, { passive: false });
    return () => root.removeEventListener("wheel", wheel);
  }, []);
  const end = (e: PointerEvent) => pointers.current.delete(e.pointerId);
  return (
    <div id="dw" className="open">
      <div className="dh">
        <span className="w-10" />
        <b>Periodic Table</b>
        <Button variant="unstyled" id="ck" className="btn" aria-label="Done" onClick={close}>
          <Icon name="done" />
        </Button>
      </div>
      <div className="chips">
        <Badge variant="unstyled" className="chip n" id="c1">
          {found.size} / {elements.length}
        </Badge>
        <Button variant="unstyled" id="qb" className="chip border-0" onClick={quiz}>
          Quiz
        </Button>
      </div>
      <div
        ref={table}
        id="tb"
        role="group"
        aria-label="Elements in the periodic table"
        aria-describedby="table-navigation-hint"
        style={{ "--cs": `${size}px` } as CSSProperties}
        onPointerDown={(e) => {
          if (pointers.current.size >= 2) return;
          pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
          if (pointers.current.size === 2) pinch.current = { distance: distance() || 1, size };
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, [e.clientX, e.clientY]);
          if (pointers.current.size === 2)
            zoom((pinch.current.size * distance()) / pinch.current.distance);
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      >
        {Array.from({ length: 18 }, (_, i) => (
          <em key={i} style={{ gridColumn: i + 1, gridRow: 1 }}>
            {i + 1}
          </em>
        ))}
        {elements.map((element, i) => (
          <Button
            variant="unstyled"
            key={element.z}
            className={`c ${found.has(i) ? "" : "lk"} ${i === current ? "sel" : ""}`}
            data-i={i}
            aria-label={element.n}
            aria-pressed={i === current}
            tabIndex={i === focused ? 0 : -1}
            onFocus={() => setFocused(i)}
            style={
              {
                gridColumn: element.g,
                gridRow: element.p + 1,
                "--c": categories[element.c][1],
                "--d": `${(i % 18) * 12}ms`,
              } as CSSProperties
            }
            onKeyDown={(event) => {
              const direction = (
                { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d" } as const
              )[event.key as "ArrowLeft"];
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? elements.length - 1
                    : direction
                      ? neighbour(i, direction)
                      : null;
              if (next === null) return;
              event.preventDefault();
              event.stopPropagation();
              setFocused(next);
              const button = table.current?.querySelector<HTMLButtonElement>(`[data-i="${next}"]`);
              button?.focus({ preventScroll: true });
              button?.scrollIntoView({ block: "nearest", inline: "nearest" });
            }}
            onClick={() => {
              pick(i);
              close();
            }}
          >
            <i>{element.z}</i>
            <b>{found.has(i) ? element.s : "?"}</b>
          </Button>
        ))}
      </div>
      <div className="table-legend">
        <span id="table-navigation-hint">
          ? · Ready to discover. Arrow keys explore the table; Enter selects.
        </span>
        <Button
          variant="unstyled"
          className="chip"
          aria-label="Smaller table cells"
          disabled={size <= 30}
          onClick={() => zoom(size - 8)}
        >
          <Icon name="zoomOut" />
        </Button>
        <Button
          variant="unstyled"
          className="chip"
          aria-label="Larger table cells"
          disabled={size >= 78}
          onClick={() => zoom(size + 8)}
        >
          <Icon name="zoomIn" />
        </Button>
      </div>
    </div>
  );
}
