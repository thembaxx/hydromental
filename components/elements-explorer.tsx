"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { categories, elements, group, neighbour, period, type Category } from "@/lib/elements";
import { getScience, elementSlug } from "@/lib/science";
import {
  claimMission,
  discoverElement,
  exportProgress,
  getDailyMissions,
  getDueElements,
  getLevel,
  importProgress,
  initialLearningState,
  loadLearningState,
  recordAnswer,
  saveLearningState,
  toggleFavorite,
  type LearningSettings,
  type MissionId,
} from "@/lib/learning";
import { feedback, cleanupFeedback, setAmbientAudio } from "@/lib/feedback";
import type { AtomInspection, SceneControls } from "@/lib/atom-scene";
import { AtomCanvas, type AtomSceneApi } from "@/components/atom-canvas";
import { BrandMark } from "@/components/brand-mark";
import { DialogShell } from "@/components/dialog-shell";
import { SearchPalette } from "@/components/search-palette";
import { NavigationScrubber } from "@/components/navigation-scrubber";
import { PeriodicTable } from "@/components/periodic-table";
import { ElementDetails } from "@/components/element-details";
import { ElementQuiz, type QuizMode } from "@/components/element-quiz";
import { LearningHub } from "@/components/learning-hub";
import { ComparisonPanel } from "@/components/comparison-panel";
import { SandboxPanel } from "@/components/sandbox-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { DiscoveryCard } from "@/components/discovery-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

type Direction = "u" | "d" | "l" | "r";
type Sheet =
  | "table"
  | "details"
  | "quiz"
  | "learning"
  | "compare"
  | "sandbox"
  | "settings"
  | "share"
  | "help"
  | null;
const titles: Record<Exclude<Sheet, null>, string> = {
  table: "Periodic table",
  details: "Element details",
  quiz: "Quiz",
  learning: "Your discovery journal",
  compare: "Compare elements",
  sandbox: "Bonding playground",
  settings: "Make it yours",
  share: "Your elemental postcard",
  help: "How to explore",
};
function PanelHeading({ title, close }: { title: string; close: () => void }) {
  return (
    <div className="dh">
      <h2>{title}</h2>
      <Button variant="unstyled" className="icon-button" aria-label="Close" onClick={close}>
        <Icon name="close" />
      </Button>
    </div>
  );
}

export default function ElementsExplorer() {
  const [current, setCurrent] = useState(7);
  const [learning, setLearning] = useState(initialLearningState);
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>("standard");
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hold, setHold] = useState(false);
  const [spread, setSpread] = useState(false);
  const [rotation, setRotation] = useState(false);
  const [paused, setPaused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [inspection, setInspection] = useState<AtomInspection | null>(null);
  const [toast, setToast] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointer = useRef<{
    x: number;
    y: number;
    lx: number;
    ly: number;
    movement: number;
    time: number;
  } | null>(null);
  const pointers = useRef(new Map<number, [number, number]>());
  const pinch = useRef({ distance: 1, zoom: 1 });
  const atomApi = useRef<AtomSceneApi | null>(null);
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
    zoom: 1,
  });
  const element = elements[current],
    science = getScience(element.z);
  const found = new Set(learning.discovered.map((z) => z - 1));
  const favorite = learning.favorites.includes(element.z),
    level = getLevel(learning.xp),
    missions = getDailyMissions(learning),
    due = getDueElements(learning);

  /* oxlint-disable react/set-state-in-effect -- Restore external device storage and URL selection after server hydration. */
  useEffect(() => {
    const saved = loadLearningState();
    const requested = new URLSearchParams(window.location.search)
      .get("element")
      ?.trim()
      .toLowerCase();
    const selected = requested
      ? elements.find(
          (e) =>
            e.s.toLowerCase() === requested ||
            e.n.toLowerCase() === requested ||
            String(e.z) === requested,
        )
      : undefined;
    setLearning(selected ? discoverElement(saved, selected.z) : saved);
    if (selected) setCurrent(selected.z - 1);
    else if (saved.history.length) setCurrent(saved.history.at(-1)!.z - 1);
    setHydrated(true);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (holdTimer.current) clearTimeout(holdTimer.current);
      cleanupFeedback();
    };
  }, []);
  useEffect(() => {
    if (hydrated) setStorageAvailable(saveLearningState(learning));
  }, [learning, hydrated]);
  /* oxlint-enable react/set-state-in-effect */
  useEffect(() => {
    if (!hydrated) return;
    if (learning.settings.theme) document.documentElement.dataset.theme = learning.settings.theme;
    else delete document.documentElement.dataset.theme;
  }, [learning.settings.theme, hydrated]);
  useEffect(() => {
    Object.assign(scene.current, {
      quality: learning.settings.quality,
      model: learning.settings.model,
      labels: learning.settings.labels,
      zoom,
      rotationMode: rotation,
      paused,
      open: sheet !== null,
    });
    scene.current.onInspect = (hit) => {
      if (hit.kind === "nucleus") {
        document.getElementById("in")?.focus({ preventScroll: true });
        setInspection(null);
        setSheet("details");
      } else setInspection(hit);
    };
  }, [learning.settings, zoom, rotation, paused, sheet]);
  useEffect(() => {
    if (!celebrate) return;
    const timer = setTimeout(() => setCelebrate(false), 1200);
    return () => clearTimeout(timer);
  }, [celebrate]);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);
  const settings = (change: Partial<LearningSettings>) => {
    setLearning((previous) => ({ ...previous, settings: { ...previous.settings, ...change } }));
    if (change.ambient !== undefined) setAmbientAudio(change.ambient);
    if (change.sound === true) feedback("tap", { sound: true, haptics: learning.settings.haptics });
  };
  const pick = useCallback(
    (index: number) => {
      if (!Number.isInteger(index) || index < 0 || index >= elements.length) return;
      const selected = elements[index],
        isNew = !learning.discovered.includes(selected.z),
        next = discoverElement(learning, selected.z);
      setLearning({ ...next, onboardingDismissed: true });
      setCurrent(index);
      setInspection(null);
      scene.current.selectedShell = null;
      const url = new URL(window.location.href);
      url.searchParams.set("element", selected.s);
      window.history.replaceState(null, "", url);
      if (isNew) {
        notify(`Discovered ${selected.n} · +10 XP`);
        if (getLevel(next.xp).level > level.level) setCelebrate(true);
      }
      feedback(isNew ? "discover" : "tap", learning.settings);
      if (learning.settings.ambient) setAmbientAudio(true);
      scene.current.spin = rotation ? 0 : 14;
      scene.current.bounce = -5;
    },
    [learning, level.level, notify, rotation],
  );
  const navigate = useCallback(
    (direction: Direction) => {
      const next = neighbour(current, direction);
      if (next !== null) {
        scene.current.direction = direction;
        pick(next);
      } else {
        scene.current.bounce = -3;
        feedback("tap", learning.settings);
        notify("You've reached the edge. Try another direction.");
      }
    },
    [current, pick, learning.settings, notify],
  );
  const openQuiz = (mode: QuizMode) => {
    setQuizMode(mode);
    setSheet("quiz");
    setSearch(false);
    setMenu(false);
  };
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input,textarea,select,[role=combobox],[role=listbox]")
      )
        return;
      if (event.key === "Escape") {
        setSheet(null);
        setMenu(false);
        setSearch(false);
        return;
      }
      if (sheet || search || menu) return;
      const direction = (
        { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d" } as const
      )[event.key as "ArrowLeft"];
      if (direction) {
        event.preventDefault();
        navigate(direction);
      }
      if (event.key === "g") {
        event.preventDefault();
        setSheet("table");
      }
      if (event.key === "/") {
        event.preventDefault();
        setSearch(true);
      }
      if (event.key === "?") {
        event.preventDefault();
        setSheet("help");
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [navigate, sheet, search, menu]);
  const cancelPointer = () => {
    pointer.current = null;
    scene.current.dragging = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    scene.current.hold = false;
    setHold(false);
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      (event.target as HTMLElement).closest(
        "button,input,a,select,textarea,.wp,.inspection-card,.onboarding-card",
      )
    )
      return;
    if (pointers.current.size >= 2) return;
    pointers.current.set(event.pointerId, [event.clientX, event.clientY]);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, zoom };
      cancelPointer();
      return;
    }
    pointer.current = {
      x: event.clientX,
      y: event.clientY,
      lx: event.clientX,
      ly: event.clientY,
      movement: 0,
      time: performance.now(),
    };
    scene.current.dragging = true;
    holdTimer.current = setTimeout(() => {
      if (pointer.current && pointer.current.movement < 8 && !sheet) {
        scene.current.hold = true;
        setHold(true);
        feedback("tap", learning.settings);
      }
    }, 450);
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    scene.current.x = (event.clientX - bounds.left) / bounds.width - 0.5;
    scene.current.y = (event.clientY - bounds.top) / bounds.height - 0.5;
    if (pointers.current.has(event.pointerId))
      pointers.current.set(event.pointerId, [event.clientX, event.clientY]);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      setZoom(
        Math.max(
          0.65,
          Math.min(
            1.7,
            (pinch.current.zoom * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch.current.distance,
          ),
        ),
      );
      return;
    }
    const start = pointer.current;
    if (!start) return;
    const dx = event.clientX - start.lx,
      dy = event.clientY - start.ly;
    start.lx = event.clientX;
    start.ly = event.clientY;
    start.movement = Math.max(
      start.movement,
      Math.hypot(event.clientX - start.x, event.clientY - start.y),
    );
    if (start.movement > 8) {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (scene.current.hold) {
        scene.current.hold = false;
        setHold(false);
      }
      if (rotation) {
        scene.current.rotationY = (scene.current.rotationY ?? 0) + dx * 0.008;
        scene.current.rotationX = Math.max(
          -1.2,
          Math.min(1.2, (scene.current.rotationX ?? 0) + dy * 0.008),
        );
      } else {
        scene.current.spin = dx * 0.6;
        scene.current.tilt = Math.max(-0.6, Math.min(0.6, scene.current.tilt + dy * 0.005));
      }
    }
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    const start = pointer.current;
    if (!start) {
      cancelPointer();
      return;
    }
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y,
      wasHold = scene.current.hold;
    cancelPointer();
    if (wasHold) return;
    if (start.movement < 8) {
      scene.current.bounce = -7;
      feedback("tap", learning.settings);
      if (performance.now() - start.time < 350)
        atomApi.current?.inspect(event.clientX, event.clientY);
      return;
    }
    if (!rotation && Math.max(Math.abs(dx), Math.abs(dy)) > 70)
      navigate(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "r" : "l") : dy < 0 ? "d" : "u");
  };
  const resetCamera = () => {
    atomApi.current?.resetCamera();
    setZoom(1);
    setInspection(null);
    notify("Camera reset");
  };
  const inspectShell = (shell: number) => {
    settings({ model: "scientific", labels: true });
    scene.current.selectedShell = shell;
    setInspection({
      kind: "shell",
      atomicNumber: element.z,
      shell,
      electrons: science.shells[shell - 1],
    });
    setSheet(null);
  };
  const quizResult = (z: number, correct: boolean) => {
    const next = recordAnswer(learning, z, correct);
    setLearning(next);
    feedback(correct ? "correct" : "incorrect", learning.settings);
    notify(
      correct
        ? next.xp > learning.xp
          ? "+5 XP · Knowledge is growing"
          : "Mastery is growing · Today's XP already earned"
        : "Good practice. We'll revisit this one.",
    );
    if (correct && (next.quizStreak % 3 === 0 || getLevel(next.xp).level > level.level))
      setCelebrate(true);
  };
  const exportSave = () => {
    const url = URL.createObjectURL(
      new Blob([exportProgress(learning)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "elementals-progress.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Progress exported. Keep this file for another device.");
  };
  const importSave = (text: string) => {
    const imported = importProgress(text);
    setLearning(imported);
    setAmbientAudio(false);
    notify("Progress restored on this device");
  };
  const claim = (id: string) => {
    if (!["discover", "quiz", "review"].includes(id)) return;
    const next = claimMission(learning, id as MissionId);
    if (next.xp === learning.xp) return;
    setLearning(next);
    setCelebrate(true);
    feedback("discover", learning.settings);
    notify(`Mission complete · +${next.xp - learning.xp} XP`);
  };
  const close = () => setSheet(null);

  return (
    <div className="explorer-shell">
      <a href="#app" className="skip-link">
        Skip to atom explorer
      </a>
      <header className="site-header">
        <Link href="/" className="brand-link" aria-label="Elementals home">
          <BrandMark />
          <span>
            <strong>Elementals</strong>
            <small>A little curiosity. A whole universe.</small>
          </span>
        </Link>
        <div className="header-actions">
          <Link href="/elements" className="library-link">
            Element library
          </Link>
          <Button
            variant="unstyled"
            id="sb"
            className="icon-button"
            aria-label="Search elements"
            aria-expanded={search}
            onClick={() => {
              setMenu(false);
              setSearch(true);
            }}
          >
            <Icon name="search" />
          </Button>
          <Button
            variant="unstyled"
            id="mb"
            className="icon-button"
            aria-label="Theme and more"
            aria-expanded={menu}
            onClick={() => setMenu((value) => !value)}
          >
            <Icon name="menu" />
          </Button>
          <Button
            variant="unstyled"
            className="icon-button settings-trigger"
            aria-label="Settings"
            onClick={() => {
              setMenu(false);
              setSheet("settings");
            }}
          >
            <Icon name="settings" />
          </Button>
        </div>
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
                className={learning.settings.theme === value ? "on" : ""}
                aria-pressed={learning.settings.theme === value}
                onClick={() => {
                  settings({ theme: value });
                  setMenu(false);
                }}
              >
                {label}
              </Button>
            ))}
            <Button
              variant="unstyled"
              aria-label="More settings"
              onClick={() => {
                setMenu(false);
                setSheet("settings");
              }}
            >
              <Icon name="settings" />
            </Button>
          </div>
        )}
      </header>
      <main className="explorer-layout">
        <aside className="journey-rail" aria-label="Learning journey">
          <Card variant="unstyled" className="rail-card journey-card">
            <div className="eyebrow">
              <Icon name="award" />
              Your curiosity, collected
            </div>
            <h2>{level.title}</h2>
            <p className="level-copy">
              Level {level.level}
              <span className="n">{learning.xp} XP</span>
            </p>
            <progress
              className="learning-progress"
              value={level.progress}
              max={1}
              aria-label="Progress to next explorer level"
            />
            <p className="panel-copy">
              {learning.discovered.length} of 118 elements discovered. Every encounter is a place to
              begin.
            </p>
            <Button
              variant="unstyled"
              className="action-button primary-action"
              onClick={() => setSheet("learning")}
            >
              Open your journal <Icon name="learn" />
            </Button>
          </Card>
          <Card variant="unstyled" className="rail-card">
            <div className="section-heading">
              <h3>Today's little missions</h3>
              <Badge variant="unstyled" className="tag">
                Optional
              </Badge>
            </div>
            {missions.map((mission) => (
              <div className="mission-mini" key={mission.id}>
                <div>
                  <b>{mission.title}</b>
                  <small>
                    {mission.progress} / {mission.target} · {mission.reward} XP
                  </small>
                </div>
                {mission.complete && !mission.claimed ? (
                  <Button variant="unstyled" className="tag" onClick={() => claim(mission.id)}>
                    Claim
                  </Button>
                ) : (
                  <span
                    role="img"
                    aria-label={mission.claimed ? "Reward collected" : "In progress"}
                  >
                    {mission.claimed ? <Icon name="done" /> : <span className="mission-dot" />}
                  </span>
                )}
              </div>
            ))}
            <Button
              variant="unstyled"
              className="text-button"
              onClick={() => openQuiz(due.length ? "review" : "standard")}
            >
              {due.length ? `Review ${due.length} due elements` : "Try a quick quiz"}
              <Icon name="next" />
            </Button>
          </Card>
          <Card variant="unstyled" className="rail-card family-card">
            <h3>Follow a family</h3>
            <div className="family-list">
              {(Object.entries(categories) as [Category, readonly [string, string]][]).map(
                ([key, [label, color]]) => (
                  <Button
                    variant="unstyled"
                    key={key}
                    className="family-link"
                    onClick={() => pick(elements.find((e) => e.c === key)!.z - 1)}
                  >
                    <span style={{ background: color }} />
                    {label}
                    <Icon name="next" />
                  </Button>
                ),
              )}
            </div>
          </Card>
        </aside>
        <div className="atom-column">
          <div id="pr" className="n">
            {found.size} / {elements.length} · {learning.xp} XP
            <span className="save-indicator">
              {storageAvailable ? "Saved on this device" : "Session only · Export to keep progress"}
            </span>
          </div>
          <div
            id="app"
            className="atom-stage"
            data-ready={hydrated}
            tabIndex={-1}
            aria-label="Interactive atom explorer"
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={() => {
              pointers.current.clear();
              cancelPointer();
            }}
            onDoubleClick={() => {
              if (rotation) resetCamera();
            }}
          >
            <AtomCanvas element={element} controls={scene} apiRef={atomApi} />
            <div
              id="tn"
              className="ab"
              style={{
                background: `radial-gradient(60vmax 60vmax at 50% 48%,${categories[element.c][1]}20,transparent)`,
              }}
            />
            <div id="gh" className="n" aria-hidden="true">
              {String(element.z).padStart(2, "0")}
            </div>
            <div className="stage-topline">
              <Badge
                variant="unstyled"
                className="family-badge"
                style={{ "--family-color": categories[element.c][1] } as CSSProperties}
              >
                <span />
                {categories[element.c][0]}
              </Badge>
              <Button
                variant="unstyled"
                className={`icon-button ${favorite ? "is-favorite" : ""}`}
                aria-label={
                  favorite ? `Remove ${element.n} from favorites` : `Favorite ${element.n}`
                }
                aria-pressed={favorite}
                onClick={() => {
                  setLearning((previous) => toggleFavorite(previous, element.z));
                  feedback("tap", learning.settings);
                }}
              >
                <Icon name="favorite" />
              </Button>
            </div>
            <div className="stage-modes">
              <div className="segmented" aria-label="Atom interaction mode">
                <Button
                  variant="unstyled"
                  aria-pressed={!rotation}
                  onClick={() => setRotation(false)}
                >
                  Explore
                </Button>
                <Button
                  variant="unstyled"
                  aria-pressed={rotation}
                  onClick={() => setRotation(true)}
                >
                  <Icon name="rotate" />
                  Rotate
                </Button>
              </div>
              <Button
                variant="unstyled"
                className="model-button"
                aria-label={`Switch to ${learning.settings.model === "playful" ? "scientific" : "playful"} model`}
                onClick={() => {
                  settings({
                    model: learning.settings.model === "playful" ? "scientific" : "playful",
                  });
                  setInspection(null);
                  scene.current.selectedShell = null;
                }}
              >
                {learning.settings.model === "playful" ? "Playful model" : "Scientific model"}
                <Icon name="spark" />
              </Button>
            </div>
            <NavigationScrubber
              id="pl"
              label="Period"
              value={period(element)}
              vertical
              onNavigate={navigate}
            />
            <NavigationScrubber
              id="pg"
              label="Group"
              value={group(element)}
              onNavigate={navigate}
            />
            <Button
              variant="unstyled"
              id="au"
              className="ar g"
              aria-label="Up the group"
              onClick={() => navigate("u")}
            >
              <Icon name="up" />
            </Button>
            <Button
              variant="unstyled"
              id="ad"
              className="ar g"
              aria-label="Down the group"
              onClick={() => navigate("d")}
            >
              <Icon name="down" />
            </Button>
            {learning.settings.model === "scientific" && (
              <div className="shell-inspector">
                <label htmlFor="shell-select">Inspect a shell</label>
                <select
                  id="shell-select"
                  value={inspection?.kind === "shell" ? inspection.shell : 0}
                  onChange={(event) => {
                    const n = Number(event.target.value);
                    if (n) inspectShell(n);
                    else {
                      scene.current.selectedShell = null;
                      setInspection({ kind: "nucleus", atomicNumber: element.z });
                    }
                  }}
                >
                  <option value={0}>Nucleus · {element.z} protons</option>
                  {science.shells.map((count, i) => (
                    <option key={i} value={i + 1}>
                      Shell {i + 1} · {count} electrons
                    </option>
                  ))}
                </select>
              </div>
            )}
            {!learning.onboardingDismissed && (
              <div className="onboarding-card">
                <span>Try a swipe. Meet a new element.</span>
                <Button
                  variant="unstyled"
                  className="text-button"
                  onClick={() =>
                    setLearning((previous) => ({ ...previous, onboardingDismissed: true }))
                  }
                >
                  Got it
                </Button>
              </div>
            )}
            <div className="stage-lower">
              <div className="scene-feedback">
                {inspection && (
                  <div className="inspection-card" role="status">
                    <div>
                      <b>
                        {inspection.kind === "nucleus"
                          ? `${element.z} protons in the nucleus`
                          : `Shell ${inspection.shell} · ${inspection.electrons} electrons`}
                      </b>
                      <p>
                        {inspection.kind === "nucleus"
                          ? "Proton count defines the element. Isotopes differ in neutron count."
                          : "A shell population, not a literal path. Real electrons occupy quantum states."}
                      </p>
                    </div>
                    <Button
                      variant="unstyled"
                      className="icon-button"
                      aria-label="Close atom inspection"
                      onClick={() => {
                        setInspection(null);
                        scene.current.selectedShell = null;
                      }}
                    >
                      <Icon name="close" />
                    </Button>
                  </div>
                )}
                <div className="camera-tools" aria-label="Camera controls">
                  <Button
                    variant="unstyled"
                    className="icon-button"
                    aria-label="Zoom out"
                    disabled={zoom <= 0.65}
                    onClick={() => setZoom((value) => Math.max(0.65, value - 0.15))}
                  >
                    <Icon name="zoomOut" />
                  </Button>
                  <Button
                    variant="unstyled"
                    className="icon-button"
                    aria-label="Zoom in"
                    disabled={zoom >= 1.7}
                    onClick={() => setZoom((value) => Math.min(1.7, value + 0.15))}
                  >
                    <Icon name="zoomIn" />
                  </Button>
                  <Button
                    variant="unstyled"
                    className="icon-button"
                    aria-label="Reset camera"
                    onClick={resetCamera}
                  >
                    <Icon name="reset" />
                  </Button>
                  <Button
                    variant="unstyled"
                    className="icon-button"
                    aria-label={paused ? "Resume atom animation" : "Pause atom animation"}
                    aria-pressed={paused}
                    onClick={() => setPaused((value) => !value)}
                  >
                    <Icon name={paused ? "play" : "pause"} />
                  </Button>
                </div>
              </div>
              <div id="pk" className={`g n ${hold ? "on" : ""}`}>
                {element.z} protons · {element.z} electrons
              </div>
              <div id="hint">
                {rotation
                  ? "Drag to rotate · Pinch to zoom · Double-tap to reset"
                  : "Swipe to travel · Hold to peek · Tap orb to learn"}
              </div>
              <div className="element-footer">
                <Button
                  variant="unstyled"
                  className="icon-button element-nav"
                  aria-label="Previous element"
                  onClick={() => navigate("l")}
                >
                  <Icon name="previous" />
                </Button>
                <Button
                  variant="unstyled"
                  id="in"
                  className="element-identity"
                  data-long-name={element.n.length > 11}
                  aria-label="Element details"
                  onClick={() => setSheet("details")}
                >
                  <span className="element-number n">
                    {element.s} ·{" "}
                    {science.properties.find((property) => property.label === "Atomic mass")?.value}{" "}
                    u
                  </span>
                  <h1>{element.n}</h1>
                  <small>
                    {categories[element.c][0]} ·{" "}
                    {
                      science.properties.find((property) => property.label === "Standard state")!
                        .value
                    }
                    <span>
                      Meet this element <Icon name="next" />
                    </span>
                  </small>
                </Button>
                <Button
                  variant="unstyled"
                  className="icon-button element-nav"
                  aria-label="Next element"
                  onClick={() => navigate("r")}
                >
                  <Icon name="next" />
                </Button>
              </div>
            </div>
            <div className="stage-bottom-tools">
              <Button
                variant="unstyled"
                id="ab"
                className={`tool-button ${spread ? "act" : ""}`}
                aria-label="Spread electrons"
                aria-pressed={spread}
                onClick={() => {
                  scene.current.spread = !spread;
                  setSpread(!spread);
                  feedback("tap", learning.settings);
                }}
              >
                <Icon name="spread" />
                <span>Spread</span>
              </Button>
              <span className="model-caption">
                {learning.settings.model === "playful"
                  ? "Playful illustration · Representative electrons"
                  : "Shell-population illustration · Not to scale"}
              </span>
              <Button
                variant="unstyled"
                className="tool-button"
                aria-label="Share element"
                onClick={() => setSheet("share")}
              >
                <Icon name="share" />
                <span>Share</span>
              </Button>
            </div>
            {celebrate &&
              Array.from({ length: 28 }, (_, i) => (
                <i
                  key={i}
                  className="cf"
                  style={
                    {
                      left: "50%",
                      top: "45%",
                      background: Object.values(categories)[i % 10][1],
                      "--x": `${Math.sin(i * 7) * 170}px`,
                      "--y": `${-120 - (i % 7) * 36}px`,
                      "--r": `${i * 27}deg`,
                    } as CSSProperties
                  }
                />
              ))}
          </div>
          <nav className="explorer-nav" aria-label="Explore and learn">
            <Button
              variant="unstyled"
              id="gb"
              aria-label="Open periodic table"
              onClick={() => setSheet("table")}
            >
              <Icon name="table" />
              <span>Table</span>
            </Button>
            <Button
              variant="unstyled"
              aria-label="Open discovery journal"
              onClick={() => setSheet("learning")}
            >
              <Icon name="learn" />
              <span>Journal</span>
            </Button>
            <Button
              variant="unstyled"
              aria-label="Compare elements"
              onClick={() => setSheet("compare")}
            >
              <Icon name="compare" />
              <span>Compare</span>
            </Button>
            <Button
              variant="unstyled"
              aria-label="Open bonding playground"
              onClick={() => setSheet("sandbox")}
            >
              <Icon name="sandbox" />
              <span>Playground</span>
            </Button>
            <Button
              variant="unstyled"
              aria-label="Exploration help"
              onClick={() => setSheet("help")}
            >
              <Icon name="help" />
              <span>Help</span>
            </Button>
          </nav>
        </div>
        <aside className="story-rail" aria-label={`${element.n} story`}>
          <Card variant="unstyled" className="rail-card story-card">
            <span className="eyebrow">From atom to everyday life</span>
            <span
              className="story-symbol n"
              style={{ color: `color-mix(in srgb, ${categories[element.c][1]} 60%, var(--ink))` }}
            >
              {element.s}
            </span>
            <h2>Meet {element.n.toLowerCase()}.</h2>
            <p className="lead-copy">{science.story}</p>
            <p>{science.everyday}</p>
            <div className="fact-callout">
              <Icon name="spark" />
              <p>{science.fact}</p>
            </div>
            <Button
              variant="unstyled"
              className="action-button"
              onClick={() => setSheet("details")}
            >
              Go a little deeper <Icon name="next" />
            </Button>
            <Link className="text-link" href={`/elements/${elementSlug(element)}`}>
              Read the sourced reference <Icon name="next" />
            </Link>
          </Card>
          <Card variant="unstyled" className="rail-card connection-card">
            <span className="eyebrow">Everything connects</span>
            <p>{science.connection.explanation}</p>
            <Button
              variant="unstyled"
              className="text-button"
              onClick={() => pick(science.connection.atomicNumber - 1)}
            >
              Follow the connection <Icon name="next" />
            </Button>
          </Card>
        </aside>
      </main>
      <div id="ts" className={`toast ${toast ? "on" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
      <SearchPalette
        open={search}
        onClose={() => setSearch(false)}
        onPick={(z) => {
          pick(z - 1);
          setSearch(false);
        }}
        favorites={learning.favorites}
        recent={learning.history
          .map((item) => item.z)
          .reverse()
          .slice(0, 8)}
      />
      <DialogShell
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={sheet ? titles[sheet] : "Explore"}
        className={sheet === "table" ? "table-dialog" : undefined}
      >
        {sheet === "table" && (
          <PeriodicTable
            current={current}
            found={found}
            pick={pick}
            close={close}
            quiz={() => openQuiz("standard")}
          />
        )}
        {sheet === "details" && (
          <ElementDetails
            element={element}
            close={close}
            onPick={(z) => {
              pick(z - 1);
              close();
            }}
            onInspectShell={inspectShell}
          />
        )}
        {sheet === "quiz" && (
          <ElementQuiz state={learning} mode={quizMode} close={close} result={quizResult} />
        )}
        {sheet && !["table", "details", "quiz"].includes(sheet) && (
          <>
            <PanelHeading title={titles[sheet]} close={close} />
            {sheet === "learning" && (
              <LearningHub
                state={learning}
                onPick={(z) => {
                  pick(z - 1);
                  close();
                }}
                onQuiz={openQuiz}
                onClaim={claim}
                onExport={exportSave}
                onImport={importSave}
              />
            )}{" "}
            {sheet === "compare" && (
              <ComparisonPanel
                current={element}
                onPick={(z) => {
                  pick(z - 1);
                  close();
                }}
              />
            )}
            {sheet === "sandbox" && (
              <SandboxPanel
                onPick={(z) => {
                  pick(z - 1);
                  close();
                }}
              />
            )}
            {sheet === "settings" && (
              <SettingsPanel
                settings={learning.settings}
                onChange={settings}
                onResetCamera={resetCamera}
              />
            )}
            {sheet === "share" && (
              <DiscoveryCard
                element={element}
                discovered={learning.discovered.includes(element.z)}
                mastery={learning.mastery[String(element.z)]?.correct}
                playful={learning.settings.model === "playful"}
              />
            )}
            {sheet === "help" && (
              <div className="panel-content">
                <p className="lead-copy">Your curiosity is the only entry requirement.</p>
                <div className="feature-grid">
                  <Card variant="unstyled" className="feature-card">
                    <h3>Travel</h3>
                    <p>
                      Swipe across a period or vertically through a group. Arrow buttons and keys do
                      the same. Drag the Period and Group controls to scrub.
                    </p>
                  </Card>
                  <Card variant="unstyled" className="feature-card">
                    <h3>Touch</h3>
                    <p>
                      Hold to peek at particle counts. Tap the orb for facts and everyday uses, or
                      tap a scientific shell to inspect it. Switch to Rotate before dragging the
                      model; pinch to zoom or use the camera buttons.
                    </p>
                  </Card>
                  <Card variant="unstyled" className="feature-card">
                    <h3>Understand</h3>
                    <p>
                      Scientific model shows shell populations. Select a shell with the menu or tap
                      its boundary. Both models are illustrations; cloud dots do not calculate
                      orbital wavefunctions.
                    </p>
                  </Card>
                  <Card variant="unstyled" className="feature-card">
                    <h3>Make it yours</h3>
                    <p>
                      Favorite elements, choose a theme, and adjust rendering quality in Settings.
                      Audio is optional and starts only after you enable it.
                    </p>
                  </Card>
                </div>
                <h3>Keyboard shortcuts</h3>
                <dl className="keyboard-help">
                  <div>
                    <dt>Arrow keys</dt>
                    <dd>Travel through the table</dd>
                  </div>
                  <div>
                    <dt>G</dt>
                    <dd>Open the periodic table</dd>
                  </div>
                  <div>
                    <dt>/</dt>
                    <dd>Search</dd>
                  </div>
                  <div>
                    <dt>?</dt>
                    <dd>Show this guide</dd>
                  </div>
                  <div>
                    <dt>Escape</dt>
                    <dd>Close the current panel</dd>
                  </div>
                </dl>
                <p className="panel-copy">
                  Progress stays on your device. Export it from your journal to move to another
                  device or keep a backup. Daily missions are optional, reset at midnight UTC, and
                  never remove earned XP or collections.
                </p>
                <Link href="/elements" className="action-button">
                  Browse all 118 sourced element pages <Icon name="next" />
                </Link>
              </div>
            )}
          </>
        )}
      </DialogShell>
    </div>
  );
}
