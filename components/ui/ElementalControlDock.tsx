"use client";

import { useEffect, useId } from "react";
import { LayoutGroup, motion } from "motion/react";
import {
  Atom,
  Cloud,
  Cube,
  SpeakerHigh,
  SpeakerSlash,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { soundEngine } from "@/lib/sound-engine";
import type { VisualMode } from "@/lib/elemental-stage";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

export interface DockElementItem {
  number: number;
  symbol: string;
  name: string;
  categoryColor: string;
}
export interface ElementalControlDockProps {
  elements: DockElementItem[];
  activeNumber: number;
  onSelectElement: (number: number) => void;
  visualMode: VisualMode;
  onChangeMode: (mode: VisualMode) => void;
  muted: boolean;
  onToggleMute: () => void;
  shortcutsEnabled?: boolean;
}
const modes = [
  { id: "bohr", label: "Bohr Orbitals", icon: Atom },
  { id: "cloud", label: "Quantum Cloud", icon: Cloud },
  { id: "matter", label: "Crystal & Matter", icon: Cube },
] as const;

export function ElementalControlDock({
  elements,
  activeNumber,
  onSelectElement,
  visualMode,
  onChangeMode,
  muted,
  onToggleMute,
  shortcutsEnabled = true,
}: ElementalControlDockProps) {
  const group = useId();
  const reduced = useReducedMotionPreference();
  const active = elements[activeNumber - 1];
  const select = (number: number) => {
    if (number === activeNumber || number < 1 || number > elements.length) return;
    soundEngine.playScrubTick(number);
    onSelectElement(number);
  };
  const changeMode = (mode: VisualMode) => {
    if (mode === visualMode) return;
    soundEngine.playElementResonance(activeNumber, 3);
    onChangeMode(mode);
  };
  useEffect(() => {
    if (!shortcutsEnabled) return;
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        document.querySelector('[role="dialog"],dialog[open]') ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            "input,textarea,select,[contenteditable],[role=combobox],[role=listbox],[role=slider]",
          ))
      )
        return;
      const keyMode = ({ "1": "bohr", "2": "cloud", "3": "matter" } as const)[event.key as "1"];
      if (keyMode) {
        event.preventDefault();
        changeMode(keyMode);
      } else if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        onToggleMute();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        select(activeNumber + (event.key === "ArrowRight" ? 1 : -1));
      }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  });
  return (
    <LayoutGroup id={group}>
      <nav className="elemental-control-dock" aria-label="3D element controls and scrubber">
        <div className="elemental-mode-pill" role="group" aria-label="3D visual mode">
          {modes.map(({ id, label, icon: ModeIcon }, index) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={visualMode === id}
              aria-keyshortcuts={String(index + 1)}
              title={`${label} (${index + 1})`}
              onClick={() => changeMode(id)}
            >
              {visualMode === id && (
                <motion.span
                  className="elemental-mode-indicator"
                  layoutId="mode"
                  transition={
                    reduced ? { duration: 0 } : { type: "spring", stiffness: 450, damping: 30 }
                  }
                />
              )}
              <ModeIcon
                size={18}
                aria-hidden="true"
                weight={visualMode === id ? "fill" : "regular"}
              />
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            className="elemental-mute"
            aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
            aria-pressed={!muted}
            aria-keyshortcuts="m"
            onClick={onToggleMute}
          >
            {muted ? (
              <SpeakerSlash size={18} aria-hidden="true" />
            ) : (
              <SpeakerHigh size={18} aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="elemental-scrubber-dock">
          <button
            type="button"
            aria-label="Previous element"
            disabled={activeNumber <= 1}
            onClick={() => select(activeNumber - 1)}
          >
            <CaretLeft size={18} aria-hidden="true" />
          </button>
          <div className="elemental-scrubber-identity">
            <strong style={{ background: active?.categoryColor }}>{active?.symbol}</strong>
            <span>
              <small>{String(activeNumber).padStart(3, "0")} / 118</small>
              <b>{active?.name}</b>
            </span>
          </div>
          <div className="elemental-scrubber-track">
            <div className="elemental-scrubber-ticks" aria-hidden="true">
              {Array.from({ length: 40 }, (_, i) => {
                const distance = Math.abs((i / 39) * (elements.length - 1) + 1 - activeNumber);
                return (
                  <motion.span
                    key={i}
                    animate={{
                      height: Math.max(6, 30 - distance * 3),
                      opacity: Math.max(0.28, 1 - distance * 0.1),
                    }}
                    transition={
                      reduced ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 }
                    }
                  />
                );
              })}
            </div>
            <input
              type="range"
              min={1}
              max={elements.length}
              step={1}
              value={activeNumber}
              aria-label="Element atomic number scrubber"
              aria-valuemin={1}
              aria-valuemax={elements.length}
              aria-valuenow={activeNumber}
              aria-valuetext={`${active?.name}, ${active?.symbol}, atomic number ${activeNumber}`}
              onChange={(event) => select(Number(event.target.value))}
            />
          </div>
          <button
            type="button"
            aria-label="Next element"
            disabled={activeNumber >= elements.length}
            onClick={() => select(activeNumber + 1)}
          >
            <CaretRight size={18} aria-hidden="true" />
          </button>
        </div>
      </nav>
    </LayoutGroup>
  );
}
