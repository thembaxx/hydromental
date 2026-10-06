"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LearningState } from "@/lib/learning";

type Settings = LearningState["settings"];
export function SettingsPanel({
  settings,
  onChange,
  onResetCamera,
}: {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
  onResetCamera?: () => void;
}) {
  return (
    <div className="panel-content">
      <section className="panel-section" aria-label="Appearance preferences">
        <p className="panel-copy">
          Preferences stay on this device and travel with your progress export.
        </p>
        <label className="field-label" htmlFor="settings-theme">
          Appearance
        </label>
        <select
          className="form-input"
          id="settings-theme"
          value={settings.theme}
          onChange={(event) => onChange({ theme: event.target.value as Settings["theme"] })}
        >
          <option value="">Follow device</option>
          <option value="day">Day</option>
          <option value="midnight">Midnight</option>
          <option value="noir">Noir · grayscale, true black</option>
          <option value="dusk">Dusk</option>
        </select>
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Atom experience</h3>
        <label className="field-label" htmlFor="settings-quality">
          Rendering quality
        </label>
        <select
          className="form-input"
          id="settings-quality"
          value={settings.quality}
          onChange={(event) => onChange({ quality: event.target.value as Settings["quality"] })}
        >
          <option value="auto">Adaptive · recommended</option>
          <option value="low">Lightweight · save resources</option>
          <option value="high">Detailed · sharper rendering</option>
        </select>
        <label className="field-label" htmlFor="settings-model">
          Visualization
        </label>
        <select
          className="form-input"
          id="settings-model"
          value={settings.model}
          onChange={(event) => onChange({ model: event.target.value as Settings["model"] })}
        >
          <option value="playful">Playful · orbiting electrons</option>
          <option value="scientific">Scientific · labeled shell schematic</option>
        </select>
        <p className="panel-copy">
          Both views are teaching illustrations. Electrons are described by quantum probability
          distributions rather than fixed planetary paths.
        </p>
        <label className="settings-toggle" htmlFor="setting-labels">
          <Input
            id="setting-labels"
            variant="unstyled"
            type="checkbox"
            checked={settings.labels}
            onChange={(event) => onChange({ labels: event.target.checked })}
          />{" "}
          Show shell labels
        </label>
        {onResetCamera && (
          <Button variant="unstyled" className="action-button" onClick={onResetCamera}>
            Reset atom view
          </Button>
        )}
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Sensory feedback</h3>
        <label className="settings-toggle" htmlFor="setting-sound">
          <Input
            id="setting-sound"
            variant="unstyled"
            type="checkbox"
            checked={settings.sound}
            onChange={(event) => onChange({ sound: event.target.checked })}
          />{" "}
          Gentle interaction sounds
        </label>
        <label className="settings-toggle" htmlFor="setting-ambient">
          <Input
            id="setting-ambient"
            variant="unstyled"
            type="checkbox"
            checked={settings.ambient}
            onChange={(event) => onChange({ ambient: event.target.checked })}
          />
          Ambient exploration audio
        </label>
        <label className="settings-toggle" htmlFor="setting-haptics">
          <Input
            id="setting-haptics"
            variant="unstyled"
            type="checkbox"
            checked={settings.haptics}
            onChange={(event) => onChange({ haptics: event.target.checked })}
          />{" "}
          Haptics when supported
        </label>
        <p className="panel-copy">
          Sound begins after your interaction. Haptics depend on your browser and device. Animations
          follow your device’s reduced-motion preference.
        </p>
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Controls that work for everyone</h3>
        <p className="panel-copy">
          Use arrow keys or the visible navigation buttons to explore. Swipe to travel between
          elements. Turn on rotation mode to drag the atom, pinch to zoom, and double-tap to reset.
          Hold the atom to peek at its identity.
        </p>
      </section>
    </div>
  );
}
