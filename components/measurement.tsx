"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import {
  measurementAllowed,
  measurementUrl,
  setMeasurementConsent,
  subscribeMeasurement,
  trackProductEvent,
} from "@/lib/measurement";
import { Input } from "@/components/ui/input";

const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((module) => module.Analytics),
  { ssr: false },
);
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((module) => module.SpeedInsights),
  { ssr: false },
);
const serverSnapshot = () => false;

export function Measurement() {
  const allowed = useSyncExternalStore(subscribeMeasurement, measurementAllowed, serverSnapshot);
  useEffect(() => {
    if (!allowed || process.env.NEXT_PUBLIC_PRODUCT_EVENTS_ENABLED !== "true") return;
    let active = true;
    void import("web-vitals")
      .then(({ onLCP, onINP, onCLS }) => {
        if (!active || !measurementAllowed()) return;
        const report = (metric: { name: string; rating: string; value: number }) => {
          if (active)
            trackProductEvent("web_vital", {
              metric: metric.name,
              rating: metric.rating,
              value:
                metric.name === "CLS"
                  ? Math.round(metric.value * 1000) / 1000
                  : Math.round(metric.value / 10) * 10,
            });
        };
        onLCP(report);
        onINP(report);
        onCLS(report);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [allowed]);
  if (!allowed) return null;
  return (
    <>
      <Analytics
        mode="production"
        beforeSend={(event) =>
          measurementAllowed() && navigator.onLine
            ? { ...event, url: measurementUrl(event.url) }
            : null
        }
      />
      <SpeedInsights
        beforeSend={(event) =>
          measurementAllowed() && navigator.onLine
            ? { ...event, url: measurementUrl(event.url) }
            : null
        }
      />
    </>
  );
}
export function MeasurementPreferences() {
  const allowed = useSyncExternalStore(subscribeMeasurement, measurementAllowed, serverSnapshot);
  const [notice, setNotice] = useState("");
  return (
    <section className="panel-section" aria-labelledby="measurement-title">
      <h3 id="measurement-title">Help improve Elementals</h3>
      <label className="settings-toggle" htmlFor="setting-measurement">
        <Input
          id="setting-measurement"
          variant="unstyled"
          type="checkbox"
          checked={allowed}
          onChange={(event) => {
            const saved = setMeasurementConsent(event.target.checked);
            setNotice(
              saved
                ? event.target.checked && !measurementAllowed()
                  ? "Your browser’s privacy signal keeps measurement off."
                  : "Preference saved on this device."
                : "Your browser could not save this preference. Measurement is off for this session.",
            );
          }}
        />
        Share anonymous usage and performance statistics
      </label>
      <p className="panel-copy">
        Off until you choose it. Helps identify slow rendering, unfinished lessons and difficult
        quiz concepts. Search text, journal entries, creations and progress backups are never
        included. Do Not Track and Global Privacy Control keep measurement off. This choice is
        separate from progress exports.
      </p>
      <a className="text-link" href="/privacy">
        How measurement works
      </a>
      {notice && (
        <p className="panel-copy" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
