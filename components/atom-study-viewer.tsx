"use client";

/* oxlint-disable react/immutability -- The shared ref owns the mutable 3D simulation, outside React state. */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions -- This named application region provides documented spatial keyboard controls for its WebGL canvas, alongside standard toolbar buttons. */

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type RefObject,
} from "react";
import { motion } from "motion/react";
import { DialogShell } from "@/components/dialog-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { categories, type Element } from "@/lib/elements";
import { getScience } from "@/lib/science";
import { representativeMassNumber } from "@/lib/elemental-stage";
import { clampZoom, createModelMotion, rotateModel, type ModelMotion } from "@/lib/model-motion";
import { useModelGestures } from "@/lib/use-model-gestures";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import { ElementalSoundEngine } from "@/lib/sound-engine";

const AtomStudyScene = dynamic(() => import("@/components/canvas/atom-study-scene"), {
  ssr: false,
  loading: () => (
    <p className="atom-study-loading" role="status">
      Preparing your 3D atom…
    </p>
  ),
});

function subscribeFullscreen(notify: () => void) {
  document.addEventListener("fullscreenchange", notify);
  return () => document.removeEventListener("fullscreenchange", notify);
}

function Viewport({
  element,
  selectedShell,
  model,
  still,
  invalidate,
  onReady,
  onZoom,
  onExcite,
}: {
  element: Element;
  selectedShell: number | null;
  model: RefObject<ModelMotion>;
  still: boolean;
  invalidate: () => void;
  onReady: (callback: () => void) => void;
  onZoom: (zoom: number) => void;
  onExcite: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const hint = useId();
  const science = getScience(element.z);
  useModelGestures(host, model, { invalidate, onZoom, onTap: onExcite, still });
  return (
    <div
      ref={host}
      className="atom-study-viewport"
      role="application"
      tabIndex={0}
      aria-label={`Interactive 3D ${element.n} atom`}
      aria-describedby={hint}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || event.altKey || event.metaKey || event.ctrlKey)
          return;
        const direction = {
          ArrowLeft: [-20, 0],
          ArrowRight: [20, 0],
          ArrowUp: [0, -20],
          ArrowDown: [0, 20],
        }[event.key];
        if (direction) {
          event.preventDefault();
          rotateModel(model.current, direction[0], direction[1]);
          model.current.vx = model.current.vy = 0;
          invalidate();
        }
        if (["+", "=", "-"].includes(event.key)) {
          event.preventDefault();
          onZoom(clampZoom(model.current.zoom.target + (event.key === "-" ? -0.1 : 0.1)));
        }
        if (event.key === "Enter") {
          event.preventDefault();
          onExcite();
        }
      }}
    >
      <AtomStudyScene
        atomicNumber={element.z}
        massNumber={representativeMassNumber(science.isotopes, element.z)}
        shells={science.shells}
        color={categories[element.c][1]}
        selectedShell={selectedShell}
        motion={model}
        still={still}
        onReady={onReady}
      />
      <span className="atom-study-corner" aria-hidden="true">
        {String(element.z).padStart(3, "0")} / {element.s}
      </span>
      <span className="atom-study-caption" id={hint}>
        Drag to orbit · Pinch or scroll to zoom
        <span className="sr-only">
          . Arrow keys rotate, plus and minus zoom, Enter excites the atom.
        </span>
      </span>
    </div>
  );
}

export function AtomStudyViewer({
  element,
  selectedShell = null,
  launcherOnly = false,
  onFullscreenChange,
}: {
  element: Element;
  selectedShell?: number | null;
  launcherOnly?: boolean;
  onFullscreenChange?: (open: boolean) => void;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [spread, setSpread] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [muted, setMuted] = useState(true);
  const [notice, setNotice] = useState("");
  const supportsFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => !!document.fullscreenEnabled,
    () => false,
  );
  const deviceFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    () => !!document.fullscreenElement,
    () => false,
  );
  const expand = (open: boolean) => {
    setFullscreen(open);
    onFullscreenChange?.(open);
  };
  const model = useRef(createModelMotion());
  const audio = useRef<ElementalSoundEngine | null>(null);
  const redraw = useRef<() => void>(() => {});
  const expandedHost = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotionPreference();
  const color = categories[element.c][1];
  const science = getScience(element.z);
  const mass = representativeMassNumber(science.isotopes, element.z);
  const invalidate = useCallback(() => redraw.current(), []);
  const onReady = useCallback((callback: () => void) => {
    redraw.current = callback;
  }, []);
  useEffect(() => () => audio.current?.dispose(), []);
  useEffect(() => () => onFullscreenChange?.(false), [onFullscreenChange]);
  const changeZoom = (value: number) => {
    const next = clampZoom(value);
    model.current.zoom.target = next;
    setZoom(next);
    invalidate();
  };
  const excite = () => {
    if (!reduced && !paused) model.current.pulse.velocity = 5;
    audio.current?.playExcitePulse(element.z);
    invalidate();
  };
  const reset = () => {
    Object.assign(model.current, createModelMotion());
    setZoom(1);
    setSpread(false);
    invalidate();
  };
  const viewport = (
    <Viewport
      element={element}
      selectedShell={selectedShell}
      model={model}
      still={paused || reduced}
      invalidate={invalidate}
      onReady={onReady}
      onZoom={changeZoom}
      onExcite={excite}
    />
  );
  const toolbar = (
    <div className="atom-study-tools" role="group" aria-label="Atom viewer controls">
      <Button
        variant="unstyled"
        aria-label={paused ? "Resume atom animation" : "Pause atom animation"}
        aria-pressed={paused}
        onClick={() => {
          setPaused(!paused);
          invalidate();
        }}
      >
        <Icon name={paused ? "play" : "pause"} />
      </Button>
      <Button variant="unstyled" aria-label="Excite 3D atom" onClick={excite}>
        <Icon name="spark" />
      </Button>
      <Button
        variant="unstyled"
        aria-label="Spread electron shells"
        aria-pressed={spread}
        onClick={() => {
          model.current.spread.target = spread ? 0 : 1;
          setSpread(!spread);
          audio.current?.playElementResonance(element.z, science.shells.length);
          invalidate();
        }}
      >
        <Icon name="spread" />
      </Button>
      <span className="atom-study-divider" />
      <Button
        variant="unstyled"
        aria-label="Zoom atom out"
        disabled={zoom <= 0.65}
        onClick={() => changeZoom(zoom - 0.15)}
      >
        <Icon name="zoomOut" />
      </Button>
      <output className="n" aria-label="Atom zoom">
        {Math.round(zoom * 100)}%
      </output>
      <Button
        variant="unstyled"
        aria-label="Zoom atom in"
        disabled={zoom >= 1.85}
        onClick={() => changeZoom(zoom + 0.15)}
      >
        <Icon name="zoomIn" />
      </Button>
      <Button variant="unstyled" aria-label="Reset atom view" onClick={reset}>
        <Icon name="reset" />
      </Button>
      <Button
        variant="unstyled"
        aria-label={muted ? "Enable atom sounds" : "Mute atom sounds"}
        aria-pressed={!muted}
        onClick={() => {
          audio.current ??= new ElementalSoundEngine();
          audio.current.haptics = false;
          audio.current.isMuted = !muted;
          setMuted(!muted);
          if (muted) audio.current.playElementResonance(element.z, science.shells.length);
        }}
      >
        <Icon name={muted ? "soundOff" : "soundOn"} />
      </Button>
    </div>
  );
  return (
    <>
      {launcherOnly ? (
        <Button
          variant="unstyled"
          className="action-button atom-study-launch"
          aria-label={`View ${element.n} in fullscreen`}
          aria-haspopup="dialog"
          onClick={() => expand(true)}
        >
          <Icon name="fullscreen" /> Fullscreen atom
        </Button>
      ) : (
        <section
          className="atom-study"
          aria-label={`${element.n} 3D atom study`}
          style={{ "--study-color": color } as CSSProperties}
        >
          <div className="atom-study-header">
            <span className="eyebrow">A closer look · 3D</span>
            <Button
              variant="unstyled"
              aria-label={`View ${element.n} in fullscreen`}
              aria-haspopup="dialog"
              onClick={() => expand(true)}
            >
              <Icon name="fullscreen" />
              <span>Expand</span>
            </Button>
          </div>
          {!fullscreen && viewport}
          {toolbar}
          <p className="atom-study-legend">
            <span>
              <i style={{ background: color }} />
              {element.z} protons
            </span>
            <span>
              <i />
              {mass - element.z} neutrons
            </span>
            <span>
              <i />
              {element.z} electrons
            </span>
          </p>
        </section>
      )}
      <DialogShell
        open={fullscreen}
        onOpenChange={expand}
        title={`${element.n} fullscreen atom`}
        description="Interactive 3D shell model. Drag to rotate, pinch or scroll to zoom, and use the controls to explore."
        className="atom-study-dialog"
        style={{ translate: "none" }}
      >
        <div
          className="atom-study atom-study-expanded"
          ref={expandedHost}
          style={{ "--study-color": color } as CSSProperties}
        >
          <header className="atom-study-header">
            <div>
              <span className="eyebrow">The atom, up close</span>
              <h2>
                {element.n} <span className="n">{element.s}</span>
              </h2>
            </div>
            <Button
              variant="unstyled"
              aria-label="Close fullscreen atom"
              onClick={() => expand(false)}
            >
              <Icon name="close" />
            </Button>
          </header>
          {fullscreen && viewport}
          <motion.div
            className="atom-study-expanded-controls"
            initial={false}
            animate={{ opacity: 1 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 24 }}
          >
            {toolbar}
            <p className="atom-study-legend">
              <span>{element.z} protons</span>
              <span>{mass - element.z} neutrons</span>
              <span>{science.shells.join(" · ")} electrons by shell</span>
            </p>
            <p className="atom-study-note">
              A shell-count illustration, not literal electron paths. Sizes and distances are not to
              scale.{reduced && " Automatic motion is off for your device preference."}
            </p>
            <Button
              variant="unstyled"
              className="atom-study-native"
              hidden={!supportsFullscreen}
              onClick={() => {
                const node = expandedHost.current;
                const request = document.fullscreenElement
                  ? document.exitFullscreen()
                  : node?.requestFullscreen();
                void request?.catch(() =>
                  setNotice(
                    "Device fullscreen is unavailable. You can keep exploring in this expanded view.",
                  ),
                );
              }}
            >
              {deviceFullscreen ? "Leave device fullscreen" : "Use device fullscreen"}{" "}
              <Icon name="fullscreen" size={14} />
            </Button>
            <p className="atom-study-note" role="status">
              {notice}
            </p>
          </motion.div>
        </div>
      </DialogShell>
    </>
  );
}
