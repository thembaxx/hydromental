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
  embedded = false,
  matches,
  active = true,
}: {
  current: number;
  found: Set<number>;
  pick: (index: number) => void;
  close: () => void;
  quiz: () => void;
  embedded?: boolean;
  matches?: Set<number>;
  active?: boolean;
}) {
  const table = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, [number, number]>());
  const pinch = useRef({ distance: 1, size: 56 });
  const [size, setSize] = useState(56);
  const [focused, setFocused] = useState(current);
  const selected = elements[focused];
  const zoom = (value: number) => setSize(Math.max(44, Math.min(88, value)));
  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  };
  useEffect(() => {
    const root = table.current!;
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setSize((prev) => Math.max(44, Math.min(88, prev * (e.deltaY < 0 ? 1.08 : 0.93))));
      }
    };
    root.addEventListener("wheel", wheel, { passive: false });
    return () => root.removeEventListener("wheel", wheel);
  }, []);
  useEffect(() => {
    if (!active) return;
    const root = table.current!;
    const selected =
      root.querySelector<HTMLButtonElement>(".sel:not(:disabled)") ??
      root.querySelector<HTMLButtonElement>(".c:not(:disabled)");
    const center = () => {
      if (selected)
        root.scrollTo({
          left: selected.offsetLeft - root.clientWidth / 2 + 28,
          top: selected.offsetTop - 40,
        });
    };
    center();
    const observer = new ResizeObserver(center);
    observer.observe(root);
    return () => observer.disconnect();
  }, [active, current, matches]);
  const end = (e: PointerEvent) => pointers.current.delete(e.pointerId);
  return (
    <div id="dw" className="open">
      {!embedded && (
        <div className="dh">
          <span className="w-10" />
          <b>Periodic Table</b>
          <Button variant="unstyled" id="ck" className="btn" aria-label="Done" onClick={close}>
            <Icon name="done" />
          </Button>
        </div>
      )}
      <div
        className="periodic-context"
        style={{ "--family-color": categories[selected.c][1] } as CSSProperties}
      >
        <span className="periodic-context-symbol n">{selected.s}</span>
        <div>
          <strong>{selected.n}</strong>
          <small>
            {categories[selected.c][0]} · No. {selected.z}
          </small>
        </div>
        <Button
          variant="unstyled"
          className="chip"
          aria-label={`Explore focused element ${selected.n}`}
          onClick={() => {
            pick(focused);
            close();
          }}
        >
          <Icon name="next" />
        </Button>
      </div>
      <div className="chips periodic-tools">
        <Badge variant="unstyled" className="chip n" id="c1">
          {found.size} / {elements.length}
        </Badge>
        <Button variant="unstyled" id="qb" className="chip border-0" onClick={quiz}>
          Quiz
        </Button>
        <span className="periodic-tool-spacer" />
        <Button
          variant="unstyled"
          className="chip"
          aria-label="Smaller table cells"
          disabled={size <= 44}
          onClick={() => zoom(size - 8)}
        >
          <Icon name="zoomOut" />
        </Button>
        <Button
          variant="unstyled"
          className="chip"
          aria-label="Larger table cells"
          disabled={size >= 88}
          onClick={() => zoom(size + 8)}
        >
          <Icon name="zoomIn" />
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
            className={`c ${i === current ? "sel" : ""}`}
            data-discovered={found.has(i)}
            data-match={matches ? matches.has(element.z) : true}
            disabled={matches ? !matches.has(element.z) : false}
            data-i={i}
            aria-label={element.n}
            aria-pressed={i === current}
            tabIndex={
              i ===
              (matches?.has(elements[focused].z) === false
                ? elements.findIndex((e) => matches.has(e.z))
                : focused)
                ? 0
                : -1
            }
            onFocus={() => setFocused(i)}
            onPointerEnter={() => setFocused(i)}
            style={
              {
                gridColumn: element.gridColumn,
                gridRow: element.gridRow + 1,
                "--c": categories[element.c][1],
                "--d": `${(i % 18) * 12}ms`,
              } as CSSProperties
            }
            onKeyDown={(event) => {
              const direction = (
                { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d" } as const
              )[event.key as "ArrowLeft"];
              let next =
                event.key === "Home"
                  ? elements.findIndex((item) => !matches || matches.has(item.z))
                  : event.key === "End"
                    ? elements.findLastIndex((item) => !matches || matches.has(item.z))
                    : direction
                      ? neighbour(i, direction)
                      : null;
              while (
                next !== null &&
                next >= 0 &&
                matches &&
                !matches.has(elements[next].z) &&
                direction
              )
                next = neighbour(next, direction);
              if (next === null || next < 0) return;
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
            <b>{element.s}</b>
            <span className="periodic-cell-name">{element.n}</span>
          </Button>
        ))}
      </div>
      <div className="table-legend">
        <span id="table-navigation-hint">
          Swipe to explore all 18 groups. Pinch to resize. Arrow keys move; Enter selects.
        </span>
      </div>
    </div>
  );
}
