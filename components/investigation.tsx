"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { elements } from "@/lib/elements";
import { getScience, scienceMetadata } from "@/lib/science";
import {
  INVESTIGATION_STORAGE_KEY,
  investigations,
  investigationReport,
  investigationShareUrl,
  newInvestigationDraft,
  parseInvestigationId,
  readInvestigationDrafts,
  restoreInvestigationDrafts,
  type InvestigationDraft,
  type InvestigationDrafts,
  type InvestigationEvidence,
  type InvestigationId,
} from "@/lib/investigations";

/** The parent may key this component by a validated URL ID to open a teacher's link. */
export function Investigation({ initialId }: { initialId?: string | null }) {
  const [selected, setSelected] = useState<InvestigationId>(
    parseInvestigationId(initialId) || investigations[0].id,
  );
  const [drafts, setDrafts] = useState<InvestigationDrafts>({});
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [originalRecord, setOriginalRecord] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // Restore external device storage after hydration; never write the empty initial state.
  /* oxlint-disable react/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(INVESTIGATION_STORAGE_KEY);
      const restored = restoreInvestigationDrafts(raw);
      if (restored === null) {
        setDrafts(readInvestigationDrafts(raw));
        setStorageBlocked(true);
        setOriginalRecord(raw);
        setMessage(
          "Saved investigation notes could not be read. The original browser record has not been replaced.",
        );
      } else setDrafts(restored);
    } catch {
      setStorageBlocked(true);
      setMessage(
        "Your browser cannot open saved notes. You can still investigate and download your response.",
      );
    }
    setReady(true);
  }, []);
  /* oxlint-enable react/set-state-in-effect */
  const investigation = investigations.find((item) => item.id === selected)!;
  const draft = drafts[selected] || newInvestigationDraft(selected);
  const evidence: InvestigationEvidence[] = investigation.atomicNumbers.map((z) => {
    const element = elements[z - 1];
    const science = getScience(z);
    return {
      atomicNumber: z,
      symbol: element.s,
      name: element.n,
      everyday: science.everyday,
      properties: science.properties.filter((property) =>
        investigation.propertyLabels.some((label) => label === property.label),
      ),
    };
  });

  function update(change: Partial<InvestigationDraft>) {
    const nextDraft = { ...draft, ...change, id: selected, updatedAt: new Date().toISOString() };
    const next = { ...drafts, [selected]: nextDraft };
    setDrafts(next);
    if (storageBlocked) {
      setMessage(
        "Your edits are only in this open screen. Download your response to keep them; the original saved record remains unchanged.",
      );
      return;
    }
    try {
      localStorage.setItem(INVESTIGATION_STORAGE_KEY, JSON.stringify({ version: 1, drafts: next }));
      setMessage(
        "Notes saved on this browser. Download a copy before clearing site data or changing devices.",
      );
    } catch {
      setMessage(
        "These notes could not be saved on this browser. Download your response before leaving.",
      );
    }
  }

  function advance(stage: InvestigationDraft["stage"]) {
    update({ stage });
    requestAnimationFrame(() => heading.current?.focus());
  }

  function replaceSavedRecord() {
    if (
      !window.confirm(
        "Replace the unreadable saved investigation record with the notes currently visible in these activities? Download the original record first to keep any notes that could not be restored.",
      )
    )
      return;
    try {
      localStorage.setItem(INVESTIGATION_STORAGE_KEY, JSON.stringify({ version: 1, drafts }));
      setStorageBlocked(false);
      setOriginalRecord(null);
      setMessage("Your current investigation notes replaced the saved record on this browser.");
    } catch {
      setMessage("The saved record could not be replaced. Download your response before leaving.");
    }
  }

  function downloadOriginal() {
    if (originalRecord === null) return;
    try {
      const url = URL.createObjectURL(new Blob([originalRecord], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "hydromental-original-investigation-record.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Original record download requested. Check the download before replacing it.");
    } catch {
      setMessage(
        "The original record could not be downloaded. It remains unchanged in this browser.",
      );
    }
  }

  async function share() {
    try {
      const url = investigationShareUrl(selected, window.location.origin);
      setShareLink(url);
      if (!navigator.clipboard?.writeText) {
        setMessage("Copy the investigation link below. Your answers are not included.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Investigation link copied. Your answers are not included.");
    } catch {
      setMessage("Copy the investigation link below. Your answers are not included.");
    }
  }

  function download() {
    try {
      const report = investigationReport(draft, evidence, scienceMetadata.retrievedAt);
      const url = URL.createObjectURL(new Blob([report], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `hydromental-${selected}-response.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage(
        "Your response download was requested. It includes your notes and the displayed source data.",
      );
    } catch {
      setMessage("The response could not be downloaded. Your notes remain visible here.");
    }
  }

  const phase = ["Predict", "Observe", "Explain", "Your response"][draft.stage];
  return (
    <section className="panel-section" aria-label="Shared science investigations">
      <h3 className="panel-title">Investigate an idea</h3>
      <p className="panel-copy">
        Predict, inspect the evidence, then explain. Share an activity with a learner; their notes
        stay on their browser until they choose to download them. No account is needed.
      </p>
      {storageBlocked && (
        <div className="feature-card">
          <p className="panel-copy" role="alert">
            Saved notes could not be restored completely. Edits stay in this open screen until you
            explicitly replace that record. Download your response before leaving.
          </p>
          {originalRecord !== null && (
            <Button
              type="button"
              variant="unstyled"
              className="action-button"
              onClick={downloadOriginal}
            >
              Download original saved record
            </Button>
          )}
          <Button
            type="button"
            variant="unstyled"
            className="action-button"
            onClick={replaceSavedRecord}
          >
            Replace saved record with current notes
          </Button>
        </div>
      )}
      <label className="field-label" htmlFor="investigation-choice">
        Choose an investigation
      </label>
      <select
        className="form-input"
        id="investigation-choice"
        value={selected}
        disabled={!ready}
        onChange={(event) => {
          const id = parseInvestigationId(event.target.value);
          if (id) {
            setSelected(id);
            setShareLink("");
            setMessage("");
          }
        }}
      >
        {investigations.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="unstyled"
        className="action-button"
        onClick={() => void share()}
      >
        Copy activity link
      </Button>
      {shareLink && (
        <label className="field-label">
          Activity link (no answers)
          <input
            className="form-input"
            value={shareLink}
            readOnly
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
      <h4 className="panel-title" tabIndex={-1} ref={heading}>
        {phase}: {investigation.title}
      </h4>
      <p className="panel-copy">{investigation.question}</p>
      {!ready ? (
        <p className="panel-copy">Opening your local notes…</p>
      ) : (
        <>
          {draft.stage === 0 && (
            <>
              <label className="field-label" htmlFor="investigation-prediction">
                {investigation.predictionPrompt}
              </label>
              <textarea
                id="investigation-prediction"
                className="form-input"
                rows={4}
                maxLength={2000}
                value={draft.prediction}
                onChange={(event) => update({ prediction: event.target.value })}
              />
              <Button
                type="button"
                variant="unstyled"
                className="action-button"
                disabled={!draft.prediction.trim()}
                onClick={() => advance(1)}
              >
                Save prediction and reveal evidence
              </Button>
            </>
          )}
          {draft.stage >= 1 && (
            <>
              <p className="panel-copy">
                <strong>Your prediction:</strong> {draft.prediction}
              </p>
              <div className="feature-grid" aria-label="Source evidence">
                {evidence.map((item) => (
                  <article className="feature-card" key={item.atomicNumber}>
                    <h4>
                      {item.name} ({item.symbol}) · Z {item.atomicNumber}
                    </h4>
                    {item.properties.map((property) => (
                      <div key={property.label}>
                        <p className="panel-copy">
                          <strong>
                            {property.label}: {property.value} {property.unit || ""}
                          </strong>
                        </p>
                        <p className="panel-copy">{property.note}</p>
                        <p className="panel-copy">
                          <a href={property.source.url} target="_blank" rel="noreferrer">
                            {property.source.label} · {property.source.edition}
                          </a>{" "}
                          · retrieved {property.source.retrievedAt}
                        </p>
                      </div>
                    ))}
                    <p className="panel-copy">{item.everyday}</p>
                  </article>
                ))}
              </div>
              <p className="panel-copy">
                Snapshot retrieved {scienceMetadata.retrievedAt}. Values and model limits come from
                the existing source catalogue. This is a data investigation, not an instruction to
                handle or test these substances.
              </p>
            </>
          )}
          {draft.stage === 1 && (
            <>
              <label className="field-label" htmlFor="investigation-observation">
                {investigation.observationPrompt}
              </label>
              <textarea
                id="investigation-observation"
                className="form-input"
                rows={4}
                maxLength={2000}
                value={draft.observation}
                onChange={(event) => update({ observation: event.target.value })}
              />
              <Button
                type="button"
                variant="unstyled"
                className="action-button"
                onClick={() => advance(0)}
              >
                Edit prediction (evidence has been seen)
              </Button>
              <Button
                type="button"
                variant="unstyled"
                className="action-button"
                disabled={!draft.observation.trim()}
                onClick={() => advance(2)}
              >
                Save observation and explain
              </Button>
            </>
          )}
          {draft.stage >= 2 && (
            <p className="panel-copy">
              <strong>Your observation:</strong> {draft.observation}
            </p>
          )}
          {draft.stage === 2 && (
            <>
              <label className="field-label" htmlFor="investigation-explanation">
                {investigation.explanationPrompt}
              </label>
              <textarea
                id="investigation-explanation"
                className="form-input"
                rows={5}
                maxLength={2000}
                value={draft.explanation}
                onChange={(event) => update({ explanation: event.target.value })}
              />
              <Button
                type="button"
                variant="unstyled"
                className="action-button"
                onClick={() => advance(1)}
              >
                Edit observation
              </Button>
              <Button
                type="button"
                variant="unstyled"
                className="action-button"
                disabled={!draft.explanation.trim()}
                onClick={() => advance(3)}
              >
                Save my explanation
              </Button>
            </>
          )}
          {draft.stage === 3 && (
            <>
              <p className="panel-copy">
                <strong>Your explanation:</strong> {draft.explanation}
              </p>
              <h4 className="panel-title">Compare with this teaching note</h4>
              <p className="panel-copy">{investigation.reflectionGuide}</p>
              <p className="panel-copy">
                Your writing is not automatically graded or teacher-verified. Completing this
                investigation does not establish mastery or award XP.
              </p>
              <Button
                type="button"
                variant="unstyled"
                className="action-button"
                onClick={() => advance(2)}
              >
                Revise my explanation
              </Button>
            </>
          )}
          <Button type="button" variant="unstyled" className="action-button" onClick={download}>
            Download my response and sources
          </Button>
        </>
      )}
      <p className="panel-copy" role="status">
        {message}
      </p>
    </section>
  );
}
