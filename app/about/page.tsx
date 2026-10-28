import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Elementals & help",
  description:
    "A local-first science playground: how to start learning, keep your progress and understand the models. Project decisions, source and verification evidence.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="reference-page">
      <header className="reference-header">
        <Link href="/" className="reference-brand">
          Elementals
        </Link>
        <Link href="/elements">Element library</Link>
      </header>
      <div className="reference-intro">
        <span className="eyebrow">About the project · Help</span>
        <h1>A small discovery you can keep.</h1>
        <p>
          Elementals helps curious learners connect the periodic table to everyday life. Explore one
          of 118 elements, read its sourced properties, then practice with a quiz or a learning
          game. No account needed.
        </p>
        <Link className="reference-action" href="/?element=O">
          Start with oxygen
        </Link>
      </div>
      <section className="reference-section" aria-labelledby="first-discovery">
        <h2 id="first-discovery">Your first five minutes</h2>
        <ol className="about-steps">
          <li>
            Choose an element in the library, or use the next/previous buttons beside the atom. Your
            first visit to an element earns 10 XP.
          </li>
          <li>
            Open “Explore” below its name. Read its everyday uses, proton count and source-linked
            properties. The readable reference pages also work without JavaScript.
          </li>
          <li>
            Choose “Try a quick quiz” in the detail panel, or open Learn in the bottom dock. Each
            answer includes feedback; correct answers earn 5 XP once per element per UTC day.
          </li>
          <li>
            Return to your discovery journal to see your progress. Export a progress backup before
            switching devices.
          </li>
        </ol>
        <p>
          New journals start at zero. Discoveries record exploration, and XP records activity;
          neither is a qualification or proof of scientific mastery.
        </p>
        <Link className="reference-action" href="/playground">
          Explore the learning games
        </Link>
      </section>
      <section className="reference-section">
        <h2>Keep, restore or remove your data</h2>
        <p>
          Discoveries, favorites, quiz reviews, games and preferences live in this browser. There is
          no account or cloud sync. Clearing site data, using another browser or ending a private
          session can remove access to that progress.
        </p>
        <p>
          In Learn → Journal, choose “Export progress”. On another device, use “Import progress
          JSON”. Import replaces the current progress, so export that device’s record first. Only
          choose a backup you trust. Playground settings also offer export and restore.
          Investigation notes use their own report export and are separate from progress backups.
        </p>
        <p>
          If storage is blocked or full, the explorer shows “Session only” and you can still export
          the current session. If an earlier save cannot be read, Settings offers its original
          contents for manual recovery. That raw file may need repair and cannot be imported as a
          validated backup.
        </p>
        <p>
          Settings → Your learning data offers a confirmed reset. Close other Elementals tabs before
          resetting so an older session cannot write its state back. Optional measurement is off by
          default and has its own controls.
        </p>
        <Link href="/privacy">Privacy and measurement controls</Link>
      </section>
      <section className="reference-section">
        <h2>Accessible ways to explore</h2>
        <p>
          Use Tab to move between controls and Enter or Space to activate buttons. Left/right arrows
          step through elements when you are not typing. Keys 1, 2 and 3 switch the atom view; M
          toggles optional sound. Escape closes a panel and returns focus to its opener.
        </p>
        <p>
          Model buttons accompany drag and pinch gestures. Device reduced-motion preferences are
          respected. When WebGL is unavailable, element text, properties, quizzes and game controls
          remain available. Use lightweight rendering in Settings on slower devices.
        </p>
        <p>
          The 3D scenes teach relationships. Bohr shells show neutral-atom populations, not literal
          electron paths; the quantum cloud does not calculate orbitals; matter views are
          illustrative, not measured crystal structures. Nuclei use representative isotopes.
        </p>
        <Link href="/elements">Read scientific references and source conditions</Link>
      </section>
      <section className="reference-section">
        <h2>Project notes</h2>
        <p>
          This portfolio project by <a href="https://github.com/thembaxx">thembaxx</a> evolved from
          a supplied interactive prototype into a Next.js and React science playground. The design
          goal is a short loop from curiosity to a sourced explanation, active practice and a
          learner-owned record.
        </p>
        <p>
          Three.js and React Three Fiber provide the interactive models. Rendering is deferred so
          navigation and text can load first. Browser-local learning avoids a sign-up step; portable
          JSON backups provide an explicit way to move progress, with the tradeoff that this is not
          automatic sync.
        </p>
        <p>
          Scientific snapshots and authored activities are committed with the code. Model
          limitations, source conditions and missing values remain visible. Automated tests cover
          learning rules, backups and browser workflows; software WebGL and emulated phones do not
          replace physical-device testing or classroom evaluation.
        </p>
        <div className="element-chips">
          <a className="reference-action" href="https://github.com/thembaxx/hydromental">
            Browse the source
          </a>
          <a
            className="reference-action"
            href="https://github.com/thembaxx/hydromental/blob/main/docs/portfolio-launch.md"
          >
            Read release evidence
          </a>
        </div>
      </section>
      <section className="reference-section">
        <h2>Need help or found a science error?</h2>
        <p>
          Try refreshing, use lightweight rendering, or open the readable element reference if a
          model is unavailable. Keep a progress backup before troubleshooting storage. Offline
          content is limited to pages already cached; reconnect if a reference has not been visited.
        </p>
        <p>
          Report a reproducible problem with the page, browser/device and what you expected. For a
          science correction, include the element, property, reference conditions and a reliable
          source. Do not post personal notes or progress exports in a public issue.
        </p>
        <a className="reference-action" href="https://github.com/thembaxx/hydromental/issues/new">
          Report a problem on GitHub
        </a>
      </section>
      <Link className="reference-action" href="/">
        Back to exploring
      </Link>
    </main>
  );
}
