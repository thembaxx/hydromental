"use client";

import { AppLoading } from "@/components/app-loading";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { categories, elements, neighbour, type Category } from "@/lib/elements";
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
import { ElementLibrary, type LibraryView } from "@/components/element-library";
import { PanelWorkspace } from "@/components/panel-workspace";
import { ExplorationHelp } from "@/components/exploration-help";
import { usePanelNavigation } from "@/lib/use-panel-navigation";
import { navigationState } from "@/lib/navigation-state";
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
import { ExplorationDock } from "@/components/exploration-dock";
import { LearningTip } from "@/components/learning-tip";
import { Onboarding } from "@/components/onboarding";
import { beginOnboarding, finishOnboarding, shouldShowOnboarding } from "@/lib/onboarding";

type Direction = "u" | "d" | "l" | "r";
const panels = [
  "table",
  "search",
  "family",
  "details",
  "share",
  "learning",
  "quiz",
  "compare",
  "sandbox",
  "settings",
  "help",
] as const;
type Sheet = (typeof panels)[number];
function workspace(panel: Sheet) {
  if (["table", "search", "family"].includes(panel)) return "library";
  if (["details", "share"].includes(panel)) return "element";
  if (["learning", "quiz"].includes(panel)) return "learning";
  if (["compare", "sandbox"].includes(panel)) return "lab";
  return "settings";
}
const titles = {
  library: "Element library",
  element: "Element details",
  learning: "Your discovery journal",
  lab: "Experiment lab",
  settings: "Make it yours",
};

export default function ElementsExplorer() {
  const [current, setCurrent] = useState(7);
  const [learning, setLearning] = useState(initialLearningState);
  const [hydrated, setHydrated] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [sheet, setSheet, close] = usePanelNavigation(panels, workspace);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<Category | "all">("all");
  const panel = sheet ? workspace(sheet) : null;
  const previousPanel = useRef<string | null>(null);
  const search = sheet === "search";
  const familyOpen = sheet === "family";
  const openLibrary = (view: LibraryView, category: Category | "all" = "all") => {
    setLibraryQuery("");
    setLibraryCategory(category);
    setSheet(view);
  };
  const [quizMode, setQuizMode] = useState<QuizMode>("standard");
  const [hold, setHold] = useState(false);
  const [spread, setSpread] = useState(false);
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
    const firstVisit = shouldShowOnboarding();
    if (firstVisit) beginOnboarding();
    setWelcome(firstVisit);
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
      model: "playful" as const,
      labels: false,
      zoom,
      rotationMode: false,
      paused: false,
      open: sheet !== null,
    });
    scene.current.onInspect = (hit) => {
      if (hit.kind === "nucleus") {
        document.getElementById("in")?.focus({ preventScroll: true });
        setInspection(null);
        setSheet("details");
      } else setInspection(hit);
    };
  }, [learning.settings, zoom, sheet, setSheet]);
  useEffect(() => {
    const restoreElement = () => {
      const requested = new URLSearchParams(window.location.search).get("element")?.toLowerCase();
      const selected = elements.find(
        (item) =>
          item.s.toLowerCase() === requested ||
          item.n.toLowerCase() === requested ||
          String(item.z) === requested,
      );
      if (selected) {
        setCurrent(selected.z - 1);
        setInspection(null);
        scene.current.selectedShell = null;
      }
    };
    window.addEventListener("popstate", restoreElement);
    return () => window.removeEventListener("popstate", restoreElement);
  }, []);
  useEffect(() => {
    const previous = previousPanel.current;
    previousPanel.current = panel;
    if (panel && previous && panel !== previous) {
      const frame = requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(".workspace-header h2")?.focus(),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [panel]);
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
      window.history.replaceState(navigationState(), "", url);
      if (isNew) {
        notify(`Discovered ${selected.n} · +10 XP`);
        if (getLevel(next.xp).level > level.level) setCelebrate(true);
      }
      feedback(isNew ? "discover" : "tap", learning.settings);
      if (learning.settings.ambient) setAmbientAudio(true);
      scene.current.spin = 14;
      scene.current.bounce = -5;
    },
    [learning, level.level, notify],
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
  };
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (!hydrated || welcome) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input,textarea,select,[role=combobox],[role=listbox]")
      )
        return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (sheet) return;
      const direction = (
        { ArrowLeft: "l", ArrowRight: "r", ArrowUp: "u", ArrowDown: "d" } as const
      )[event.key as "ArrowLeft"];
      if (direction) {
        event.preventDefault();
        navigate(direction);
      }
      if (event.key === "g") {
        event.preventDefault();
        setLibraryQuery("");
        setLibraryCategory("all");
        setSheet("table");
      }
      if (event.key === "/") {
        event.preventDefault();
        setLibraryQuery("");
        setLibraryCategory("all");
        setSheet("search");
      }
      if (event.key === "?") {
        event.preventDefault();
        setSheet("help");
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [navigate, sheet, setSheet, close, hydrated, welcome]);
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
      scene.current.spin = dx * 0.6;
      scene.current.tilt = Math.max(-0.6, Math.min(0.6, scene.current.tilt + dy * 0.005));
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
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 70)
      navigate(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "r" : "l") : dy < 0 ? "d" : "u");
  };
  const resetCamera = () => {
    atomApi.current?.resetCamera();
    setZoom(1);
    setInspection(null);
    notify("Camera reset");
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

  if (!hydrated) return <AppLoading />;
  if (welcome) {
    return (
      <Onboarding
        onComplete={() => {
          finishOnboarding();
          setWelcome(false);
          setLearning((previous) => ({ ...previous, onboardingDismissed: true }));
        }}
      />
    );
  }

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
          </span>
        </Link>
        <div className="header-actions">
          <Button variant="unstyled" className="library-link" onClick={() => openLibrary("family")}>
            Element library
          </Button>
          <Button
            variant="unstyled"
            id="sb"
            className="icon-button"
            aria-label="Search elements"
            aria-haspopup="dialog"
            aria-expanded={search}
            onClick={() => openLibrary("search")}
          >
            <Icon name="search" />
          </Button>
          <Button
            variant="unstyled"
            id="mb"
            className="icon-button"
            aria-label="Settings"
            aria-haspopup="dialog"
            aria-expanded={panel === "settings"}
            onClick={() => setSheet("settings")}
          >
            <Icon name="settings" />
          </Button>
        </div>
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
              className="action-button primary-action icon-action"
              aria-label="Open your journal"
              title="Open your journal"
              onClick={() => setSheet("learning")}
            >
              <Icon name="learn" />
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
                    onClick={() => openLibrary("family", key)}
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
            data-zoom={zoom.toFixed(2)}
            tabIndex={-1}
            aria-label="Interactive atom explorer"
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={() => {
              pointers.current.clear();
              cancelPointer();
            }}
          >
            <AtomCanvas
              element={element}
              controls={scene}
              apiRef={atomApi}
              suspended={sheet !== null}
            />
            <div
              id="tn"
              className="ab"
              style={
                {
                  "--family-glow": `${categories[element.c][1]}20`,
                } as CSSProperties
              }
            />
            <div id="gh" className="n" aria-hidden="true">
              {String(element.z).padStart(2, "0")}
            </div>
            <div className="stage-topline">
              <Button
                variant="unstyled"
                className="family-badge"
                style={{ "--family-color": categories[element.c][1] } as CSSProperties}
                aria-label={`Show ${categories[element.c][0]} elements`}
                aria-haspopup="dialog"
                aria-expanded={familyOpen}
                onClick={() => openLibrary("family", element.c)}
              >
                <span />
                {categories[element.c][0]}
              </Button>
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
                <Icon name="favorite" weight={favorite ? "fill" : "regular"} />
              </Button>
            </div>
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
              </div>
              <div id="pk" className={`g n ${hold ? "on" : ""}`}>
                {element.z} protons · {element.z} electrons
              </div>
              <LearningTip id="hint" active={hydrated}>
                Swipe to travel · Hold to peek · Tap the atom to learn
              </LearningTip>
              <div className="element-footer">
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
                  </small>
                </Button>
              </div>
            </div>
            <div className="stage-bottom-tools">
              <Button
                variant="unstyled"
                id="ab"
                className={`tool-button icon-action ${spread ? "act" : ""}`}
                aria-label="Spread electrons"
                title="Spread electrons"
                aria-pressed={spread}
                onClick={() => {
                  scene.current.spread = !spread;
                  setSpread(!spread);
                  feedback("tap", learning.settings);
                }}
              >
                <Icon name="spread" />
              </Button>
              <LearningTip className="model-caption" active={hydrated}>
                Playful illustration · Representative electrons
              </LearningTip>
              <Button
                variant="unstyled"
                className="tool-button icon-action"
                aria-label="Share element"
                title="Share element"
                onClick={() => setSheet("share")}
              >
                <Icon name="share" />
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
          <ExplorationDock
            open={panel}
            onOpen={(destination) => {
              if (destination === "table") openLibrary("table");
              else setSheet(destination);
              feedback("tap", learning.settings);
            }}
          />
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
      <DialogShell
        bottomSheet
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={panel ? titles[panel] : "Explore"}
        className={`workspace-dialog${panel === "library" ? " library-dialog" : ""}`}
      >
        {panel === "library" && (
          <ElementLibrary
            view={sheet as LibraryView}
            onView={setSheet}
            query={libraryQuery}
            onQuery={setLibraryQuery}
            category={libraryCategory}
            onCategory={setLibraryCategory}
            current={element.z}
            found={found}
            favorites={learning.favorites}
            recent={learning.history
              .map((item) => item.z)
              .reverse()
              .slice(0, 8)}
            onPick={(z) => pick(z - 1)}
            onFavorite={(z) => {
              setLearning((previous) => toggleFavorite(previous, z));
              feedback("tap", learning.settings);
            }}
            onDetails={(z) => {
              pick(z - 1);
              setSheet("details");
            }}
            onQuiz={() => openQuiz("standard")}
            close={close}
          />
        )}
        {panel === "element" && (
          <PanelWorkspace
            title={element.n}
            subtitle={`${element.s} · ${categories[element.c][0]}`}
            value={sheet === "share" ? "share" : "details"}
            onChange={setSheet}
            close={close}
            tabs={[
              {
                value: "details",
                label: "Story & science",
                content: (
                  <ElementDetails
                    embedded
                    element={element}
                    close={close}
                    onPick={(z) => pick(z - 1)}
                  />
                ),
              },
              {
                value: "share",
                label: "Postcard",
                content: (
                  <DiscoveryCard
                    element={element}
                    discovered={learning.discovered.includes(element.z)}
                    mastery={learning.mastery[String(element.z)]?.correct}
                    playful
                  />
                ),
              },
            ]}
          />
        )}
        {panel === "learning" && (
          <PanelWorkspace
            title="Your discovery journal"
            subtitle="A little curiosity, every day"
            value={sheet === "quiz" ? "quiz" : "learning"}
            onChange={setSheet}
            close={close}
            tabs={[
              {
                value: "learning",
                label: "Journal",
                content: (
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
                ),
              },
              {
                value: "quiz",
                label: "Practice",
                content:
                  sheet === "quiz" ? (
                    <>
                      <div className="practice-modes" role="group" aria-label="Practice mode">
                        {(
                          [
                            ["standard", "Quick quiz"],
                            ["review", "Spaced review"],
                            ["mystery", "Mystery"],
                            ["where", "Everyday clues"],
                          ] as const
                        ).map(([mode, label]) => (
                          <Button
                            variant="unstyled"
                            className="chip"
                            key={mode}
                            aria-pressed={quizMode === mode}
                            disabled={mode === "review" && due.length === 0}
                            onClick={() => setQuizMode(mode)}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                      <ElementQuiz
                        key={quizMode}
                        embedded
                        state={learning}
                        mode={quizMode}
                        close={() => setSheet("learning")}
                        result={quizResult}
                      />
                    </>
                  ) : null,
              },
            ]}
          />
        )}
        {panel === "lab" && (
          <PanelWorkspace
            title="Experiment lab"
            subtitle="Find patterns. Make connections."
            value={sheet === "sandbox" ? "sandbox" : "compare"}
            onChange={setSheet}
            close={close}
            tabs={[
              {
                value: "compare",
                label: "Compare",
                content: (
                  <ComparisonPanel
                    current={element}
                    onPick={(z) => {
                      pick(z - 1);
                      close();
                    }}
                  />
                ),
              },
              {
                value: "sandbox",
                label: "Bonding",
                content: (
                  <SandboxPanel
                    onPick={(z) => {
                      pick(z - 1);
                      close();
                    }}
                  />
                ),
              },
            ]}
          />
        )}
        {panel === "settings" && (
          <PanelWorkspace
            title="Make it yours"
            subtitle="Your preferences, your pace"
            value={sheet === "help" ? "help" : "settings"}
            onChange={setSheet}
            close={close}
            tabs={[
              {
                value: "settings",
                label: "Preferences",
                content: (
                  <SettingsPanel
                    settings={learning.settings}
                    onChange={settings}
                    onResetCamera={resetCamera}
                  />
                ),
              },
              { value: "help", label: "How to explore", content: <ExplorationHelp /> },
            ]}
          />
        )}
      </DialogShell>
    </div>
  );
}
