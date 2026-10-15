import type { Metadata } from "next";
import { MeasurementPreferences } from "@/components/measurement";

export const metadata: Metadata = {
  title: "Privacy and measurement",
  alternates: { canonical: "/privacy" },
};
export default function PrivacyPage() {
  return (
    <main className="reference-page">
      <header className="reference-header">
        <a href="/">Elementals</a>
        <a href="/elements">Element library</a>
      </header>
      <h1>Privacy and measurement</h1>
      <p>
        Your discoveries, journal, settings and saved creations stay in your browser. Progress
        exports are files you control. There is no account or cross-device sync.
      </p>
      <MeasurementPreferences />
      <section className="reference-section">
        <h2>What optional measurement includes</h2>
        <p>
          When enabled, Vercel Web Analytics and Speed Insights receive page paths, loading and
          interaction performance, broad rendering-speed categories, 3D failures and fixed product
          events such as quiz concepts, public element numbers and lesson completion. They provide
          aggregate reports with coarse browser, device and geographic dimensions. No application
          user ID is assigned.
        </p>
        <p>
          The app removes query strings and fragments from measured page URLs. It never attaches
          search text, notes, creation titles, progress exports or account information. Optional
          events are not queued while offline. Browser privacy signals override your choice.
        </p>
        <p>
          Vercel processes requests as the hosting and measurement provider, including network
          information needed to serve them. Its analytics uses a short-lived anonymous hash rather
          than tracking cookies. Turning measurement off stops future app measurements; it does not
          delete previously aggregated reports or hosting access logs.
        </p>
        <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noreferrer">
          Vercel’s analytics privacy documentation ↗
        </a>
      </section>
      <a className="reference-action" href="/">
        Back to exploring
      </a>
    </main>
  );
}
