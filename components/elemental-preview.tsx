"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { ElementalControlDock } from "@/components/ui/ElementalControlDock";
import { categories, elements } from "@/lib/elements";
import { auras, type ElementalSceneApi } from "@/lib/elemental";
import { getScience } from "@/lib/science";
import { soundEngine } from "@/lib/sound-engine";
import type { SceneControls } from "@/lib/atom-scene";
import type { VisualMode } from "@/lib/elemental-stage";

const ElementalCanvas = dynamic(() => import("@/components/elemental-canvas"), { ssr: false });
const dockElements = elements.map((e) => ({
  number: e.z,
  symbol: e.s,
  name: e.n,
  categoryColor: categories[e.c][1],
}));

export function ElementalPreview() {
  const [number, setNumber] = useState(8);
  const [mode, setMode] = useState<VisualMode>("bohr");
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    soundEngine.isMuted = true;
    return () => soundEngine.dispose();
  }, []);
  const api = useRef<ElementalSceneApi | null>(null);
  const controls = useRef<SceneControls>({
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
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const element = elements[number - 1];
  return (
    <section className="reference-stage" aria-label="Interactive element preview">
      <div
        className="reference-stage-model"
        data-mode={mode}
        role="group"
        tabIndex={0}
        aria-label={'Interactive 3D model of ' + element.n + '. Use arrow keys to rotate, Home to reset and Enter to excite.'}
        aria-describedby="elemental-stage-instructions"
        onKeyDown={(event) => {
          const state = controls.current;
          let handled = true;
          switch (event.key) {
            case "ArrowLeft":
              state.spin = -1.2;
              state.rotationY = (state.rotationY ?? 0) - 0.18;
              break;
            case "ArrowRight":
              state.spin = 1.2;
              state.rotationY = (state.rotationY ?? 0) + 0.18;
              break;
            case "ArrowUp":
              state.tilt = Math.max(-1.2, state.tilt - 0.13);
              state.rotationX = Math.max(-1.2, (state.rotationX ?? 0) - 0.13);
              break;
            case "ArrowDown":
              state.tilt = Math.min(1.2, state.tilt + 0.13);
              state.rotationX = Math.min(1.2, (state.rotationX ?? 0) + 0.13);
              break;
            case "Home":
              state.spin = 0;
              state.tilt = 0;
              state.rotationX = 0;
              state.rotationY = 0;
              state.resetVersion = (state.resetVersion ?? 0) + 1;
              break;
            case "Enter":
            case " ":
              state.bounce = -7;
              soundEngine.playExcitePulse(number);
              break;
            default:
              handled = false;
          }
          if (handled) {
            event.preventDefault();
            api.current?.invalidate?.();
          }
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { x: event.clientX, y: event.clientY, moved: false };
          controls.current.dragging = true;
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.clientX - drag.current.x,
            dy = event.clientY - drag.current.y;
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            moved: drag.current.moved || Math.abs(dx) + Math.abs(dy) > 2,
          };
          controls.current.spin = dx * 0.3;
          controls.current.tilt += dy * 0.005;
          controls.current.rotationY = (controls.current.rotationY ?? 0) + dx * 0.008;
          controls.current.rotationX = (controls.current.rotationX ?? 0) + dy * 0.008;
          api.current?.invalidate?.();
        }}
        onPointerUp={() => {
          if (drag.current && !drag.current.moved) {
            controls.current.bounce = -7;
            soundEngine.playExcitePulse(number);
            api.current?.invalidate?.();
          }
          controls.current.dragging = false;
          drag.current = null;
        }}
        onPointerCancel={() => {
          controls.current.dragging = false;
          drag.current = null;
        }}
      >
        <Suspense fallback={<p>Preparing the 3D model. Explore the elements below.</p>}>
          <ElementalCanvas
            aura={auras[0]}
            element={element}
            mode={mode}
            controls={controls}
            apiRef={api}
            suspended={false}
            quality="auto"
          />
        </Suspense>
      </div>
      <p id="elemental-stage-instructions" className="sr-only">Drag to rotate the atom, or focus the 3D model and use arrow keys. Press Home to reset or Enter to excite it. The scientific display is illustrative as labelled.</p>
      <div className="reference-stage-copy" aria-live="polite">
        <span>
          {String(number).padStart(3, "0")} / 118 · {categories[element.c][0]}
        </span>
        <h2>
          {element.n}
          <small>{element.s}</small>
        </h2>
        <p>{getScience(number).everyday}</p>
        <small>
          {mode === "matter"
            ? `${element.phaseLabel}. Arrangement is illustrative.`
            : mode === "cloud"
              ? "Illustrative density, not a calculated orbital."
              : "Electron shell populations, not fixed electron paths."}
        </small>
        <button
          type="button"
          className="elemental-excite"
          onClick={() => {
            controls.current.bounce = -7;
            soundEngine.playExcitePulse(number);
            api.current?.invalidate?.();
          }}
        >
          Excite atom
        </button>
      </div>
      <ElementalControlDock
        elements={dockElements}
        activeNumber={number}
        onSelectElement={setNumber}
        visualMode={mode}
        onChangeMode={setMode}
        muted={muted}
        onToggleMute={() => {
          soundEngine.isMuted = !muted;
          setMuted(!muted);
          if (muted) soundEngine.playScrubTick(number);
        }}
      />
    </section>
  );
}
