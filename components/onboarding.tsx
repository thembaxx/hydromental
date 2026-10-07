"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { AtomCanvas, type AtomSceneApi } from "@/components/atom-canvas";
import { BrandMark } from "@/components/brand-mark";
import { DialogShell } from "@/components/dialog-shell";
import { ElementDetails } from "@/components/element-details";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { elements } from "@/lib/elements";
import type { SceneControls } from "@/lib/atom-scene";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

const steps = [
  {
    title: "Meet the elements.",
    description:
      "A hands-on guide to all 118 chemical elements. Explore atoms, discover what they're used for, and connect chemistry to everyday life.",
    instruction: "This is a real, interactive atom. Try moving it, or keep going for a quick tour.",
    image: "explore",
    alt: "The Elementals explorer showing Oxygen, its atom, navigation arrows and camera controls.",
    points: [
      "All 118 elements, ready to explore",
      "Plain-language stories and sourced science",
      "Your discoveries saved on this device",
    ],
  },
  {
    title: "Make it move.",
    description:
      "Swipe across the atom to meet another element. Choose Rotate and drag to turn it. Pinch to zoom, or use the visible controls.",
    instruction: "Try a swipe here. Arrow keys and the arrow buttons work too.",
    image: "explore",
    alt: "Explorer controls: Rotate mode, previous and next element arrows, zoom, reset and pause.",
    points: [
      "Swipe: change the element",
      "Rotate + drag: turn the atom",
      "Pinch or zoom buttons: get closer",
    ],
  },
  {
    title: "Every atom has a story.",
    description:
      "Tap the central orb to learn what the element is, where you encounter it, and how its electrons are arranged. The shell diagram can animate, or pause when you prefer.",
    instruction: "Tap this atom's center, or choose Try element details.",
    image: "details",
    alt: "Oxygen's details showing its definition, everyday uses, animated shell diagram and atomic properties.",
    points: [
      "Brief descriptions and everyday uses",
      "Real properties and source references",
      "Animated electron-shell schematics",
    ],
  },
  {
    title: "Keep your curiosity going.",
    description:
      "Save favorite elements, try a quiz, and revisit what you've learned. Your journal tracks discoveries and optional daily missions. Compare elements or explore familiar materials when you're ready.",
    instruction: "You're ready. This tour is always available again in Settings.",
    image: "journal",
    alt: "The discovery journal showing discoveries, learning progress and optional daily missions.",
    points: [
      "Heart: save a favorite",
      "Journal: discoveries, quizzes and progress",
      "Settings: replay this tour, choose a theme or adjust motion",
    ],
  },
] as const;

const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [current, setCurrent] = useState(7);
  const [rotate, setRotate] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [paused, setPaused] = useState(false);
  const [details, setDetails] = useState(false);
  const [scientific, setScientific] = useState(false);
  const reducedMotion = useReducedMotionPreference();
  // Keep server text readable, then enter after the real device preference is available.
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  const api = useRef<AtomSceneApi | null>(null);
  const focusHeading = useCallback((node: HTMLHeadingElement | null) => {
    node?.focus({ preventScroll: true });
  }, []);
  const controls = useRef<SceneControls>({
    spin: 4,
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
  const gesture = useRef<{ x: number; y: number; lx: number; ly: number; movement: number } | null>(
    null,
  );
  const pointers = useRef(new Map<number, [number, number]>());
  const pinch = useRef({ distance: 1, zoom: 1, active: false });
  const selected = elements[current];
  const content = steps[step];
  useEffect(() => {
    Object.assign(controls.current, {
      zoom,
      paused,
      rotationMode: rotate,
      open: details,
      model: scientific ? "scientific" : "playful",
      labels: scientific,
    });
    controls.current.onInspect = (hit) => {
      if (hit.kind === "nucleus") setDetails(true);
    };
  }, [zoom, paused, rotate, details, scientific]);
  useEffect(() => {
    controls.current.bounce = -3;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);
  const nextElement = (direction: number) => {
    setCurrent((previous) => Math.max(0, Math.min(elements.length - 1, previous + direction)));
    controls.current.spin = 14;
    controls.current.bounce = -3;
  };
  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, [event.clientX, event.clientY]);
    if (pointers.current.size === 2) {
      pinch.current = { distance: distance() || 1, zoom, active: true };
      return;
    }
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      lx: event.clientX,
      ly: event.clientY,
      movement: 0,
    };
    controls.current.dragging = rotate;
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, [event.clientX, event.clientY]);
    if (pointers.current.size === 2) {
      setZoom(
        Math.max(0.65, Math.min(1.7, (pinch.current.zoom * distance()) / pinch.current.distance)),
      );
      return;
    }
    const start = gesture.current;
    if (!start || pinch.current.active) return;
    start.movement = Math.max(
      start.movement,
      Math.hypot(event.clientX - start.x, event.clientY - start.y),
    );
    if (rotate) {
      controls.current.rotationY =
        (controls.current.rotationY ?? 0) + (event.clientX - start.lx) * 0.012;
      controls.current.rotationX =
        (controls.current.rotationX ?? 0) + (event.clientY - start.ly) * 0.01;
    }
    start.lx = event.clientX;
    start.ly = event.clientY;
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size) return;
    const start = gesture.current;
    gesture.current = null;
    controls.current.dragging = false;
    if (pinch.current.active) {
      pinch.current.active = false;
      return;
    }
    if (!start) return;
    const delta = event.clientX - start.x;
    if (!rotate && Math.abs(delta) > 40) nextElement(delta < 0 ? 1 : -1);
    else if (start.movement < 8) api.current?.inspect(event.clientX, event.clientY);
  };
  const transition = { duration: reducedMotion ? 0 : 0.35, ease: "easeOut" as const };
  return (
    <main className="welcome-page">
      <header className="welcome-header">
        <Link className="brand-link" href="/" aria-label="Elementals home">
          <BrandMark />
          <strong>Elementals</strong>
        </Link>
        <Button variant="unstyled" className="text-button" onClick={onComplete}>
          Skip introduction <Icon name="next" />
        </Button>
      </header>
      <div className="welcome-layout">
        <section className="welcome-demo" aria-label="Try the interactive atom">
          <div className="welcome-canvas">
            <div
              className="welcome-interaction"
              role="slider"
              tabIndex={0}
              aria-label="Tutorial atom. Swipe to change elements, or use the arrow buttons."
              aria-valuemin={1}
              aria-valuemax={elements.length}
              aria-valuenow={selected.z}
              aria-valuetext={`${selected.n}, atomic number ${selected.z}`}
              aria-orientation="horizontal"
              aria-describedby="tutorial-controls-help"
              onPointerDown={pointerDown}
              onPointerMove={pointerMove}
              onPointerUp={pointerUp}
              onPointerCancel={() => {
                pointers.current.clear();
                gesture.current = null;
                pinch.current.active = false;
                controls.current.dragging = false;
              }}
              onKeyDown={(event) => {
                if ((event.target as HTMLElement).closest("button")) return;
                if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
                  event.preventDefault();
                  nextElement(event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1);
                } else if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  setCurrent(event.key === "Home" ? 0 : elements.length - 1);
                }
              }}
            >
              <AtomCanvas element={selected} controls={controls} apiRef={api} />
              <span className="welcome-demo-label n">
                {selected.z} · {selected.n}
              </span>
              {step === 1 && (
                <div className="welcome-swipe" aria-hidden="true">
                  <span />
                  <motion.i
                    animate={reducedMotion || paused ? { x: 0 } : { x: [-30, 30] }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: "reverse",
                      repeatDelay: 0.7,
                    }}
                  />
                </div>
              )}
            </div>
            <Button
              variant="unstyled"
              className="icon-button welcome-pause"
              aria-label={paused ? "Resume tutorial animation" : "Pause tutorial animation"}
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              <Icon name={paused ? "play" : "pause"} />
            </Button>
            <div className="welcome-demo-arrows">
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label="Previous tutorial element"
                disabled={current === 0}
                onClick={() => nextElement(-1)}
              >
                <Icon name="previous" />
              </Button>
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label="Next tutorial element"
                disabled={current === elements.length - 1}
                onClick={() => nextElement(1)}
              >
                <Icon name="next" />
              </Button>
            </div>
          </div>
          <div className="welcome-demo-tools">
            <Button
              variant="unstyled"
              className="action-button"
              aria-pressed={rotate}
              onClick={() => setRotate((value) => !value)}
            >
              <Icon name="rotate" />
              Rotate mode
            </Button>
            <Button
              variant="unstyled"
              className="icon-button"
              aria-label="Zoom out tutorial atom"
              disabled={zoom <= 0.65}
              onClick={() => setZoom((value) => Math.max(0.65, value - 0.15))}
            >
              <Icon name="zoomOut" />
            </Button>
            <Button
              variant="unstyled"
              className="icon-button"
              aria-label="Zoom in tutorial atom"
              disabled={zoom >= 1.7}
              onClick={() => setZoom((value) => Math.min(1.7, value + 0.15))}
            >
              <Icon name="zoomIn" />
            </Button>
            <Button
              variant="unstyled"
              className="icon-button"
              aria-label="Reset tutorial atom"
              onClick={() => {
                api.current?.resetCamera();
                setZoom(1);
              }}
            >
              <Icon name="reset" />
            </Button>
            {scientific && (
              <Button
                variant="unstyled"
                className="action-button"
                onClick={() => setScientific(false)}
              >
                Orbiting view
              </Button>
            )}
          </div>
          <p id="tutorial-controls-help" className="welcome-demo-note">
            Arrow keys change the element. Tab moves to the buttons.
            <br />
            {scientific
              ? "Shell-population illustration · not to scale"
              : "Teaching illustration · representative orbiting electrons"}
          </p>
        </section>
        <section className="welcome-copy" aria-label="Introduction">
          <div className="welcome-progress" aria-label="Introduction steps">
            {steps.map((item, index) => (
              <Button
                key={item.title}
                variant="unstyled"
                className="welcome-step"
                aria-label={`Step ${index + 1}: ${item.title}`}
                aria-current={step === index ? "step" : undefined}
                onClick={() => setStep(index)}
              >
                <span />
              </Button>
            ))}
            <span className="n">
              {step + 1} / {steps.length}
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${step}-${ready}`}
              className="welcome-step-content"
              initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : -8 }}
              transition={transition}
            >
              <p className="eyebrow">A quick introduction</p>
              <motion.h1
                ref={focusHeading}
                tabIndex={-1}
                initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: reducedMotion ? 0 : 0.05 }}
              >
                {content.title}
              </motion.h1>
              <motion.p
                className="welcome-description"
                initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: reducedMotion ? 0 : 0.1 }}
              >
                {content.description}
              </motion.p>
              <ul className="welcome-points">
                {content.points.map((point) => (
                  <li key={point}>
                    <Icon name="done" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="welcome-preview">
                <Image
                  className="welcome-image"
                  src={`/onboarding/${content.image}.jpg`}
                  alt={content.alt}
                  width={390}
                  height={844}
                  sizes="(max-width: 599px) 100px, 130px"
                />
                <div>
                  <p>{content.instruction}</p>
                  {step === 2 && (
                    <Button
                      variant="unstyled"
                      className="action-button"
                      onClick={() => setDetails(true)}
                    >
                      Try element details <Icon name="next" />
                    </Button>
                  )}
                  {step === 3 && (
                    <p className="panel-copy">
                      No account needed. You can export a progress backup from your journal.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
      <footer className="welcome-navigation">
        <Button
          variant="unstyled"
          className="action-button"
          disabled={step === 0}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          <Icon name="previous" />
          Back
        </Button>
        <span className="welcome-navigation-note">You can replay this in Settings.</span>
        <Button
          variant="unstyled"
          className="action-button primary-action"
          onClick={() =>
            step === steps.length - 1
              ? onComplete()
              : setStep((value) => Math.min(steps.length - 1, value + 1))
          }
        >
          {step === steps.length - 1 ? "Start exploring" : "Continue"}
          <Icon name="next" />
        </Button>
      </footer>
      <DialogShell
        open={details}
        onOpenChange={setDetails}
        title="Tutorial element details"
        id="ov"
      >
        <ElementDetails
          element={selected}
          close={() => setDetails(false)}
          onPick={(z) => setCurrent(z - 1)}
          onInspectShell={(shell) => {
            controls.current.selectedShell = shell;
            setScientific(true);
            setDetails(false);
          }}
        />
      </DialogShell>
    </main>
  );
}
