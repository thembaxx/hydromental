"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LEARNING_STORAGE_KEY, PROGRESS_RECOVERY_KEY, readProgressRecovery } from "@/lib/learning";
import { INVESTIGATION_STORAGE_KEY } from "@/lib/investigations";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

export function ProgressDataControls() {
  const [recovery, setRecovery] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Read device-local recovery after hydration.
    setRecovery(readProgressRecovery());
  }, []);
  function downloadRecovery() {
    if (!recovery) return;
    const url = URL.createObjectURL(new Blob([recovery], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "elementals-unreadable-save.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "Earlier save downloaded. Keep it for manual recovery; it is not a validated progress backup.",
    );
  }
  function reset() {
    try {
      for (const key of [
        LEARNING_STORAGE_KEY,
        PROGRESS_RECOVERY_KEY,
        INVESTIGATION_STORAGE_KEY,
        ONBOARDING_STORAGE_KEY,
        "el",
        "th",
        "elt",
      ])
        localStorage.removeItem(key);
      window.location.replace("/");
    } catch {
      setMessage(
        "Your browser blocked the reset. Allow site storage, then try again, or clear this site's data in browser settings.",
      );
    }
  }
  return (
    <section className="panel-section">
      <h3 className="panel-title">Your learning data</h3>
      <p className="panel-copy">
        Progress is saved in this browser with no account or cloud sync. Export a backup from your
        journal (or Playground settings) before clearing browser data. Private browsing may discard
        it when you close the window.
      </p>
      {recovery && (
        <div className="feature-card">
          <h4>An earlier save could not be fully read</h4>
          <p className="panel-copy">
            Available legacy discoveries may have been recovered. The original is retained on this
            device. Download it before resetting; restore a validated progress JSON in your journal
            if you have one.
          </p>
          <Button variant="unstyled" className="action-button" onClick={downloadRecovery}>
            Download earlier save
          </Button>
        </div>
      )}
      <p className="panel-copy">
        Reset removes this device’s discoveries, XP, favorites, game creations, preferences,
        investigation notes and retained recovery file. Close other Elementals tabs first. Optional
        measurement consent is managed separately below.
      </p>
      {!confirmReset ? (
        <Button variant="unstyled" className="action-button" onClick={() => setConfirmReset(true)}>
          Reset learning data…
        </Button>
      ) : (
        <div className="feature-card" role="group" aria-label="Confirm learning data reset">
          <p className="panel-copy">
            This cannot be undone without your exported backups. Reset this device’s learning data?
          </p>
          <div className="element-chips">
            <Button
              variant="unstyled"
              className="action-button"
              onClick={() => setConfirmReset(false)}
            >
              Keep my data
            </Button>
            <Button variant="unstyled" className="action-button" onClick={reset}>
              Reset this device
            </Button>
          </div>
        </div>
      )}
      <p className="panel-copy" role="status">
        {message}
      </p>
    </section>
  );
}
