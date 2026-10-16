"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export function ExplorationHelp() {
  return (
    <div className="panel-content">
      <p className="lead-copy">Your curiosity is the only entry requirement.</p>
      <div className="feature-grid">
        <Card variant="unstyled" className="feature-card">
          <h3>Travel</h3>
          <p>
            Scrub through atomic numbers 1–118, or use the left and right arrow keys to step. Tap
            the chemical family name to browse every element in that family.
          </p>
        </Card>
        <Card variant="unstyled" className="feature-card">
          <h3>Touch</h3>
          <p>
            Drag to spin, tap to excite, and hold to peek at particle counts. Pinch to zoom. Select
            the element name to open its story.
          </p>
        </Card>
        <Card variant="unstyled" className="feature-card">
          <h3>Understand</h3>
          <p>
            Switch between Bohr shell populations, illustrative quantum density, and matter. Clouds
            and matter arrangements are teaching illustrations. Open the element story for sourced
            properties.
          </p>
        </Card>
        <Card variant="unstyled" className="feature-card">
          <h3>Make it yours</h3>
          <p>
            Favorite elements, choose a theme, and adjust rendering quality in Settings. Audio is
            optional and starts only after you enable it.
          </p>
        </Card>
      </div>
      <h3>Keyboard shortcuts</h3>
      <dl className="keyboard-help">
        <div>
          <dt>Arrow keys</dt>
          <dd>Left/right step by atomic number; up/down travel through the table</dd>
        </div>
        <div>
          <dt>1 / 2 / 3</dt>
          <dd>Bohr orbitals / quantum cloud / crystal and matter</dd>
        </div>
        <div>
          <dt>M</dt>
          <dd>Mute or unmute sound effects</dd>
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
        Progress stays on your device. Export it from your journal to move to another device or keep
        a backup. Daily missions are optional, reset at midnight UTC, and never remove earned XP or
        collections.
      </p>
      <Link href="/elements" className="action-button">
        Browse all 118 sourced element pages <Icon name="next" />
      </Link>
    </div>
  );
}
