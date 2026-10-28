"use client";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="reference-page">
      <div className="reference-intro">
        <h1>This view could not load.</h1>
        <p>
          Try again to reopen the view. Your saved browser progress is retained. If you are offline,
          reconnect or open a previously visited element reference.
        </p>
      </div>
      <div className="element-chips">
        <button className="reference-action" onClick={retry}>
          Try again
        </button>
        <a className="reference-action" href="/elements">
          Open element references
        </a>
        <a className="reference-action" href="/about">
          Help & recovery
        </a>
      </div>
    </main>
  );
}
