"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createAtomScene, type SceneControls } from "@/lib/atom-scene";
import {
  categories,
  elements,
  electronShells,
  group,
  neighbour,
  period,
  phases,
  type Element,
} from "@/lib/elements";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type Direction = "u" | "d" | "l" | "r";
type Theme = "" | "midnight" | "dusk" | "day";
type Sheet = "table" | "details" | "quiz" | null;
type Progress = { f: number[]; x: number; s: number };
const initialProgress: Progress = { f: Array.from({ length: 12 }, (_, i) => i), x: 120, s: 0 };
function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* Optional device feedback. */
  }
}

function Icon({
  name,
}: {
  name: "search" | "menu" | "up" | "down" | "spread" | "table" | "done" | "close";
}) {
  const shapes: Record<typeof name, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </>
    ),
    menu: (
      <>
        <circle cx="5" cy="12" r="1.6" fill="currentColor" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <circle cx="19" cy="12" r="1.6" fill="currentColor" />
      </>
    ),
    up: <path d="M12 19V5M6 11l6-6 6 6" />,
    down: <path d="M12 5v14M6 13l6 6 6-6" />,
    spread: (
      <>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
        <path d="M12 12l8-4.5M12 12L4 7.5M12 12v9" />
      </>
    ),
    table: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    done: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    close: <path d="M6 6l12 12M18 6L6 18" />,
  };
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name]}
    </svg>
  );
}

function AtomCanvas({
  element,
  controls,
}: {
  element: Element;
  controls: RefObject<SceneControls>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ReturnType<typeof createAtomScene> | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    try {
      scene.current = createAtomScene(canvas.current!, controls.current, elements[7]);
    } catch {
      // oxlint-disable-next-line react/set-state-in-effect -- WebGL availability is discovered when the browser creates the renderer.
      setUnavailable(true);
    }
    return () => {
      scene.current?.dispose();
      scene.current = null;
    };
  }, [controls]);
  useEffect(() => {
    scene.current?.setElement(element);
  }, [element]);
  return (
    <>
      <canvas
        ref={canvas}
        id="gl"
        className="absolute inset-0 size-full"
        aria-label={`Decorative 3D model of ${element.n}`}
      />
      {unavailable && (
        <p className="absolute inset-x-0 top-[55%] text-center text-sm" role="status">
          3D is unavailable in this browser. You can still explore every element.
        </p>
      )}
    </>
  );
}

function Scrubber({
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
      aria-valuemin={1}
      aria-valuemax={vertical ? 7 : 18}
      aria-valuenow={typeof value === "number" ? value : undefined}
      aria-valuetext={String(value)}
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

function Details({ element, close }: { element: Element; close: () => void }) {
  const shells = electronShells(element.z),
    color = categories[element.c][1];
  const facts = [
    ["Atomic no.", element.z],
    ["Mass", element.m],
    ["Phase", phases[element.f]],
    ["Period", period(element)],
    ["Group", group(element)],
    ["Type", categories[element.c][0]],
  ];
  return (
    <div id="dt" className="sheet open" role="dialog" aria-label="Element details">
      <div className="dh">
        <span className="w-10" />
        <b id="dn">{element.n}</b>
        <Button
          variant="unstyled"
          id="dx"
          className="btn quiz-close"
          aria-label="Close"
          onClick={close}
        >
          <Icon name="close" />
        </Button>
      </div>
      <div id="dbody">
        <svg
          viewBox="0 0 260 260"
          width="190"
          height="190"
          className="mx-auto block"
          role="img"
          aria-label="Idealised electron shells"
        >
          <circle cx="130" cy="130" r="12" fill={color} />
          {shells.map((count, i) => {
            const r = shells.length > 1 ? 26 + i * (98 / (shells.length - 1)) : 70;
            return (
              <g key={i}>
                <circle
                  cx="130"
                  cy="130"
                  r={r}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity=".25"
                  strokeWidth="1.5"
                />
                {Array.from({ length: count }, (_, k) => {
                  const angle = (k / count) * Math.PI * 2 + i;
                  return (
                    <circle
                      key={k}
                      cx={130 + r * Math.cos(angle)}
                      cy={130 + r * Math.sin(angle)}
                      r="4"
                      fill={color}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
        <div className="fa">
          {facts.map(([label, value]) => (
            <Card variant="unstyled" key={label}>
              {label}
              <b>{value}</b>
            </Card>
          ))}
        </div>
        <p className="n mx-3.5 mt-3 text-center text-[13px] text-[var(--mut)]">
          Shells (idealised): {shells.join(" · ")}
        </p>
      </div>
    </div>
  );
}

function PeriodicTable({
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
    <div id="dw" className="open" role="dialog" aria-label="Periodic table">
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
        style={{ "--cs": `${size}px` } as CSSProperties}
        onPointerDown={(e) => {
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
            style={
              {
                gridColumn: element.g,
                gridRow: element.p + 1,
                "--c": categories[element.c][1],
                "--d": `${i * 14}ms`,
              } as CSSProperties
            }
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
    </div>
  );
}

type Question = { element: Element; type: number; answer: string; options: string[] };
function makeQuestion(found: number[]): Question {
  const pool = found.length >= 6 ? found : elements.map((_, i) => i);
  const element = elements[pool[Math.floor(Math.random() * pool.length)]];
  const type = Math.floor(Math.random() * 3),
    key = (["s", "n", "z"] as const)[type];
  const answer = String(element[key]),
    options = new Set([answer]);
  while (options.size < 4)
    options.add(String(elements[Math.floor(Math.random() * elements.length)][key]));
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { element, type, answer, options: shuffled };
}

function Quiz({
  found,
  streak,
  close,
  result,
}: {
  found: number[];
  streak: number;
  close: () => void;
  result: (correct: boolean) => void;
}) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answered = useRef(false);
  const latestFound = useRef(found);
  useEffect(() => {
    latestFound.current = found;
  }, [found]);
  useEffect(() => {
    setQuestion(makeQuestion(latestFound.current));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const answer = (value: string) => {
    if (answered.current || !question) return;
    answered.current = true;
    setSelected(value);
    result(value === question.answer);
    timer.current = setTimeout(() => {
      setQuestion(makeQuestion(latestFound.current));
      setSelected(null);
      answered.current = false;
    }, 1000);
  };
  return (
    <div id="qz" className="sheet open" role="dialog" aria-label="Quiz">
      <div className="dh">
        <span id="qs" className="n w-[90px] text-[13px]">
          Streak {streak}
        </span>
        <b>Quiz</b>
        <Button
          variant="unstyled"
          id="qx"
          className="btn quiz-close"
          aria-label="Close"
          onClick={close}
        >
          <Icon name="close" />
        </Button>
      </div>
      <Card
        variant="unstyled"
        id="qc"
        key={question ? `${question.element.z}-${question.type}` : "loading"}
        className="card g flip"
      >
        <CardTitle variant="unstyled" id="qq">
          {question &&
            (question.type === 0 ? (
              <>
                Symbol for <b>{question.element.n}</b>?
              </>
            ) : question.type === 1 ? (
              <>
                Which element is <b className="n">{question.element.s}</b>?
              </>
            ) : (
              <>
                Atomic number of <b>{question.element.n}</b>?
              </>
            ))}
        </CardTitle>
        <CardContent variant="unstyled" id="qa">
          {question?.options.map((value) => (
            <Button
              variant="unstyled"
              key={value}
              className={`opt ${selected && value === question.answer ? "ok" : selected === value ? "no" : ""}`}
              disabled={selected !== null}
              onClick={() => answer(value)}
            >
              {value}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ElementsExplorer() {
  const [current, setCurrent] = useState(7),
    [progress, setProgress] = useState(initialProgress);
  const [hydrated, setHydrated] = useState(false),
    [theme, setTheme] = useState<Theme>("");
  const [sheet, setSheet] = useState<Sheet>(null),
    [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false);
  const [query, setQuery] = useState(""),
    [invalid, setInvalid] = useState(false),
    [hint, setHint] = useState(true);
  const [hold, setHold] = useState(false),
    [spread, setSpread] = useState(false),
    [toast, setToast] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointer = useRef<{ x: number; y: number; lx: number; ly: number; movement: number } | null>(
    null,
  );
  const scene = useRef<SceneControls>({
    spin: 0,
    tilt: 0,
    bounce: 0,
    dragging: false,
    x: 0,
    y: 0,
    hold: false,
    spread: false,
    open: false,
  });
  const element = elements[current],
    found = new Set(progress.f);
  /* oxlint-disable react/set-state-in-effect -- Restore external browser storage after server hydration. */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("el") || "null") as Progress | null;
      if (saved && Array.isArray(saved.f) && Number.isFinite(saved.x))
        setProgress({
          f: [
            ...new Set(saved.f.filter((i) => Number.isInteger(i) && i >= 0 && i < elements.length)),
          ],
          x: Math.max(0, saved.x),
          s: Number.isInteger(saved.s) ? Math.max(0, saved.s) : 0,
        });
      const selected = localStorage.getItem("th") || "";
      if (["", "midnight", "dusk", "day"].includes(selected)) setTheme(selected as Theme);
    } catch {
      /* Storage is optional. */
    }
    setHydrated(true);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);
  /* oxlint-enable react/set-state-in-effect */
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem("el", JSON.stringify(progress));
      } catch {
        /* Storage is optional. */
      }
    }
  }, [progress, hydrated]);
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme;
    else delete document.documentElement.dataset.theme;
    if (hydrated) {
      try {
        localStorage.setItem("th", theme);
      } catch {
        /* Storage is optional. */
      }
    }
  }, [theme, hydrated]);
  useEffect(() => {
    scene.current.open = sheet !== null;
  }, [sheet]);
  useEffect(() => {
    if (search) input.current?.focus();
    else input.current?.blur();
  }, [search]);
  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrate(false), 1200);
    return () => clearTimeout(timer);
  }, [celebrate]);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);
  const pick = useCallback(
    (index: number) => {
      const isNew = !progress.f.includes(index);
      setCurrent(index);
      setHint(false);
      if (isNew) {
        setProgress((prev) => ({ ...prev, f: [...new Set([...prev.f, index])], x: prev.x + 10 }));
        notify(`Discovered ${elements[index].n} · +10 XP`);
        vibrate([12, 30, 12]);
      } else vibrate(10);
      scene.current.spin = 14;
      scene.current.bounce = -5;
    },
    [progress.f, notify],
  );
  const navigate = useCallback(
    (direction: Direction) => {
      const next = neighbour(current, direction);
      if (next !== null) pick(next);
      else {
        scene.current.spin = direction === "r" ? -6 : direction === "l" ? 6 : 0;
        scene.current.bounce = -3;
        vibrate(6);
      }
    },
    [current, pick],
  );
  useEffect(() => {
    const keyboard = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Escape") {
        setSheet(null);
        setMenu(false);
        setSearch(false);
        return;
      }
      if (sheet) return;
      const direction = (
        { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d" } as const
      )[e.key as "ArrowLeft"];
      if (direction) {
        e.preventDefault();
        navigate(direction);
      }
      if (e.key === "g") setSheet("table");
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [navigate, sheet]);
  const peek = (on: boolean) => {
    scene.current.hold = on;
    setHold(on);
    if (on) vibrate(15);
  };
  const cancelPointer = () => {
    pointer.current = null;
    scene.current.dragging = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    peek(false);
  };
  const pointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button,input,#dw,#mn,.wp,#in,.sheet")) return;
    pointer.current = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, movement: 0 };
    scene.current.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    holdTimer.current = setTimeout(() => {
      if (pointer.current && pointer.current.movement < 8 && !sheet) peek(true);
    }, 450);
  };
  const pointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    scene.current.x = (e.clientX - bounds.left) / bounds.width - 0.5;
    scene.current.y = (e.clientY - bounds.top) / bounds.height - 0.5;
    const p = pointer.current;
    if (!p) return;
    const dx = e.clientX - p.lx,
      dy = e.clientY - p.ly;
    p.lx = e.clientX;
    p.ly = e.clientY;
    p.movement = Math.max(p.movement, Math.hypot(e.clientX - p.x, e.clientY - p.y));
    if (p.movement > 8) {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      scene.current.spin = dx * 0.6;
      scene.current.tilt = Math.max(-0.6, Math.min(0.6, scene.current.tilt + dy * 0.005));
    }
  };
  const pointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const p = pointer.current;
    if (!p) return;
    const dx = e.clientX - p.x,
      dy = e.clientY - p.y,
      wasHold = scene.current.hold;
    cancelPointer();
    if (wasHold) return;
    if (p.movement < 8) {
      if (sheet) setSheet(null);
      else {
        scene.current.bounce = -7;
        vibrate(8);
      }
      return;
    }
    if (!sheet && Math.max(Math.abs(dx), Math.abs(dy)) > 70)
      navigate(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "r" : "l") : dy < 0 ? "d" : "u");
  };
  const submitSearch = () => {
    const value = query.trim().toLowerCase();
    const index = elements.findIndex(
      (e) =>
        e.s.toLowerCase() === value || e.n.toLowerCase().startsWith(value) || String(e.z) === value,
    );
    if (value && index >= 0) {
      pick(index);
      setQuery("");
      setSearch(false);
      setInvalid(false);
    } else {
      setInvalid(true);
      notify("No matching element");
    }
  };
  const quizResult = (correct: boolean) => {
    setProgress((prev) => ({
      ...prev,
      s: correct ? prev.s + 1 : 0,
      x: prev.x + (correct ? 5 : 0),
    }));
    vibrate(correct ? [10, 20, 10] : 30);
    if (correct) {
      notify("+5 XP");
      if ((progress.s + 1) % 3 === 0) setCelebrate(true);
    }
  };
  return (
    <main
      id="app"
      data-ready={hydrated}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={cancelPointer}
    >
      <AtomCanvas element={element} controls={scene} />
      <div
        id="tn"
        className="ab"
        style={{
          background: `radial-gradient(60vmax 60vmax at 50% 48%,${categories[element.c][1]}20,transparent)`,
        }}
      />
      <div id="gh" className="n">
        {String(element.z).padStart(2, "0")}
      </div>
      <Button
        variant="unstyled"
        id="sb"
        className="btn g left-3 top-2"
        aria-label="Search elements"
        aria-expanded={search}
        onClick={() => setSearch((v) => !v)}
      >
        <Icon name="search" />
      </Button>
      <div id="pr" className="n" style={{ opacity: search ? 0 : 1 }}>
        {found.size} / {elements.length} · {progress.x} XP
      </div>
      <Input
        variant="unstyled"
        ref={input}
        id="si"
        className={`g ${search ? "on" : ""} ${invalid ? "no" : ""}`}
        placeholder="Symbol, name or number"
        aria-label="Search elements"
        aria-invalid={invalid}
        autoComplete="off"
        tabIndex={search ? 0 : -1}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setInvalid(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitSearch();
          if (e.key === "Escape") setSearch(false);
        }}
      />
      <Button
        variant="unstyled"
        id="mb"
        className="btn g right-3 top-2"
        aria-label="Theme and more"
        aria-expanded={menu}
        onClick={() => setMenu((v) => !v)}
      >
        <Icon name="menu" />
      </Button>
      {menu && (
        <div id="mn" className="menu g on" role="group" aria-label="Theme">
          {(
            [
              ["", "Auto"],
              ["midnight", "Midnight"],
              ["dusk", "Dusk"],
              ["day", "Day"],
            ] as const
          ).map(([value, label]) => (
            <Button
              variant="unstyled"
              key={value}
              data-t={value}
              className={theme === value ? "on" : ""}
              aria-pressed={theme === value}
              onClick={() => {
                setTheme(value);
                setMenu(false);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
      <div id="ts" className={`g n ${toast ? "on" : ""}`} role="status">
        {toast}
      </div>
      <Scrubber id="pl" label="Period" value={period(element)} vertical onNavigate={navigate} />
      <Scrubber id="pg" label="Group" value={group(element)} onNavigate={navigate} />
      <Button
        variant="unstyled"
        id="au"
        className="ar g top-[24%]"
        aria-label="Up the group"
        onClick={() => navigate("u")}
      >
        <Icon name="up" />
      </Button>
      <Button
        variant="unstyled"
        id="ad"
        className="ar g top-[54%]"
        aria-label="Down the group"
        onClick={() => navigate("d")}
      >
        <Icon name="down" />
      </Button>
      <div id="hint" style={{ opacity: hint ? 1 : 0 }}>
        Swipe to travel · Hold to peek · Tap to bounce
      </div>
      <div id="pk" className={`g n ${hold ? "on" : ""}`}>
        {element.z} protons · {element.z} electrons ·{" "}
        {Math.max(0, Math.round(Number(element.m)) - element.z)} neutrons
      </div>
      <Button
        variant="unstyled"
        id="ab"
        className={`btn g bt left-3 ${spread ? "act" : ""}`}
        aria-label="Spread electrons"
        aria-pressed={spread}
        onClick={() => {
          scene.current.spread = !spread;
          setSpread(!spread);
          vibrate(8);
        }}
      >
        <Icon name="spread" />
      </Button>
      <Button
        variant="unstyled"
        id="in"
        className="g bt border-0"
        aria-label="Element details"
        onClick={() => setSheet("details")}
      >
        <b>
          {element.n} <span className="n">{element.m}</span>
        </b>
        <small>
          {categories[element.c][0]} · {phases[element.f]}
        </small>
      </Button>
      <Button
        variant="unstyled"
        id="gb"
        className="btn g bt right-3"
        aria-label="Open periodic table"
        onClick={() => setSheet("table")}
      >
        <Icon name="table" />
      </Button>
      {sheet === "table" && (
        <PeriodicTable
          current={current}
          found={found}
          pick={pick}
          close={() => setSheet(null)}
          quiz={() => setSheet("quiz")}
        />
      )}
      {sheet === "details" && <Details element={element} close={() => setSheet(null)} />}
      {sheet === "quiz" && (
        <Quiz
          found={progress.f}
          streak={progress.s}
          close={() => setSheet(null)}
          result={quizResult}
        />
      )}
      {celebrate &&
        Array.from({ length: 28 }, (_, i) => (
          <i
            key={i}
            className="cf"
            style={
              {
                left: "50%",
                top: "45%",
                background: Object.values(categories)[i % 8][1],
                "--x": `${Math.sin(i * 7) * 170}px`,
                "--y": `${-120 - (i % 7) * 36}px`,
                "--r": `${i * 27}deg`,
              } as CSSProperties
            }
          />
        ))}
    </main>
  );
}
