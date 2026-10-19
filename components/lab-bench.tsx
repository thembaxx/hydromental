"use client";

import { useRef, useState } from "react";
import { PlaygroundScene, type SceneHandle } from "@/components/playground-scene";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { molecules } from "@/lib/playground";
import type { LearningSettings } from "@/lib/learning";

/** The first experiment is real Three.js, not a decorative hero illustration. */
export function LabBench({
  settings,
  paused,
  onBuild,
  onInspect,
}: {
  settings: LearningSettings;
  paused: boolean;
  onBuild: (index: number) => void;
  onInspect: (z: number) => void;
}) {
  const [sample, setSample] = useState(0);
  const [resting, setResting] = useState(false);
  const api = useRef<SceneHandle | null>(null);
  const molecule = molecules[sample];
  return (
    <section className="lab-bench" aria-label="Interactive 3D lab preview">
      <div className="lab-bench-copy">
        <span className="eyebrow">An invitation to experiment</span>
        <h2>
          Small building blocks.
          <br />
          <em>Endless possibility.</em>
        </h2>
        <p>
          Turn a molecule in your hands. Follow a bond. See what happens when you build something of
          your own.
        </p>
        <Button
          variant="unstyled"
          className="action-button game-primary"
          onClick={() => onBuild(sample)}
        >
          Start building <Icon name="next" />
        </Button>
        <div className="lab-bench-facts">
          <span>8 experiments</span>
          <span>38 challenges</span>
          <span>Your pace</span>
        </div>
      </div>
      <div className="lab-bench-model">
        <div className="lab-bench-topline">
          <span className="eyebrow">
            <i /> Live specimen · 3D
          </span>
          <Button
            variant="unstyled"
            className="icon-button"
            aria-label={resting ? "Resume lab preview" : "Pause lab preview"}
            aria-pressed={resting}
            onClick={() => setResting(!resting)}
          >
            <Icon name={resting ? "play" : "pause"} />
          </Button>
        </div>
        <PlaygroundScene
          atoms={molecule.atoms}
          bonds={molecule.bonds}
          title={`${molecule.name} · ${molecule.formula}`}
          note={`${molecule.geometry}. Drag to orbit, pinch to zoom, tap an atom to learn.`}
          api={api}
          onPick={(index) => onInspect(molecule.atoms[index].z)}
          paused={paused || resting}
          quality={settings.quality}
        />
        <div className="lab-specimens" role="group" aria-label="Lab preview molecule">
          {molecules.slice(0, 3).map((item, index) => (
            <Button
              key={item.name}
              variant="unstyled"
              aria-pressed={sample === index}
              onClick={() => setSample(index)}
            >
              <span className="chem">{item.formula}</span>
              <span>{item.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
