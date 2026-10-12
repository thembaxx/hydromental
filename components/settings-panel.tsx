"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
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
        <p className="panel-copy">
          The home atom is a playful illustration of representative electrons. Electrons are
          described by quantum probability distributions rather than fixed planetary paths.
        </p>
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
          Swipe to travel between elements, pinch to zoom, and hold the atom to peek at its
          identity. Tap the chemical family name to browse that family. Arrow keys also move through
          the table.
        </p>
        <Button variant="unstyled" className="action-button" asChild>
          <Link href="/welcome">
            Replay introduction <Icon name="next" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
