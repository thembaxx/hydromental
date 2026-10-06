"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Download01Icon, Share01Icon } from "@hugeicons/core-free-icons";
import { categories, type Element } from "@/lib/elements";
import { getScience, elementSlug } from "@/lib/science";

const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!,
  );

export function DiscoveryCard({
  element,
  discovered,
  mastery,
  playful = false,
}: {
  element: Element;
  discovered: boolean;
  mastery?: number;
  playful?: boolean;
}) {
  const [feedback, setFeedback] = useState("");
  const [sharing, setSharing] = useState(false);
  const science = getScience(element.z);
  const mass = science.properties.find((property) => property.label === "Atomic mass")!;
  const isotopeMass = mass.note?.includes("without stable isotopes");
  const family = categories[element.c];
  function download() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" rx="48" fill="#0e1728"/><circle cx="400" cy="360" r="210" fill="none" stroke="${family[1]}" stroke-width="3"/><circle cx="400" cy="360" r="150" fill="none" stroke="${family[1]}" stroke-width="2"/><circle cx="400" cy="150" r="12" fill="${family[1]}"/><g font-family="system-ui,sans-serif" text-anchor="middle" fill="#fff"><text x="400" y="100" font-size="28">ELEMENTALS · DISCOVERY CARD</text><text x="400" y="300" font-size="30">${element.z}</text><text x="400" y="420" font-size="140" font-weight="700">${escapeXml(element.s)}</text><text x="400" y="645" font-size="56">${escapeXml(element.n)}</text><text x="400" y="710" font-size="26" fill="${family[1]}">${escapeXml(family[0])}</text><text x="400" y="775" font-size="24">Atomic mass: ${escapeXml(mass.value)}${mass.unit ? ` ${escapeXml(mass.unit)}` : ""}</text><text x="400" y="845" font-size="24">${discovered ? "Discovered" : "Ready to explore"}${mastery ? ` · ${mastery} correct reviews` : ""}</text><text x="400" y="890" font-size="18">${isotopeMass ? "Isotope value; not a standard atomic weight." : "Natural isotope composition can vary."}</text><text x="400" y="930" font-size="18">Illustrative atom · Data: PubChem / Royal Society of Chemistry</text></g></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `elementals-${element.n.toLowerCase()}.svg`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback("Discovery card downloaded as SVG.");
  }
  async function share() {
    const url = `${window.location.origin}/elements/${elementSlug(element)}`;
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${element.n} · Elementals`,
          text: `Explore ${element.n}, element ${element.z}.`,
          url,
        });
        setFeedback("Element shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setFeedback("Element link copied.");
      } else {
        setFeedback(`Share this link: ${url}`);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        setFeedback(`Sharing unavailable. Element link: ${url}`);
    } finally {
      setSharing(false);
    }
  }
  return (
    <div className="panel-content">
      <Card
        variant="unstyled"
        className="discovery-card"
        style={{ "--family-color": family[1] } as React.CSSProperties}
      >
        <Badge variant="unstyled" className="tag">
          {discovered && <HugeiconsIcon icon={Tick02Icon} size={16} aria-hidden="true" />}
          {discovered ? "Discovered" : "Ready to explore"}
        </Badge>
        <span className="discovery-card-number">{element.z}</span>
        <div className="discovery-card-symbol">{element.s}</div>
        <h3 className="panel-title">{element.n}</h3>
        <p className="panel-copy">
          {family[0]} · {mass.value}
          {mass.unit ? ` ${mass.unit}` : ""}
        </p>
        {mass.note && <p className="panel-copy">{mass.note}</p>}
        <p className="panel-copy">{science.fact}</p>
        {playful && (
          <p className="panel-copy discovery-personality">
            {
              {
                a: "One outer electron. Plenty of personality.",
                e: "Keeping the periodic table grounded.",
                t: "A little metallic character goes a long way.",
                p: "There’s more to me than a shiny surface.",
                m: "Comfortably between two worlds.",
                n: "Life’s little building blocks have big stories.",
                h: "Looking for a connection? That’s my specialty.",
                g: "Noble gas energy: keeping my circle small.",
                l: "Rare-earth charm, atomic-scale sparkle.",
                c: "A heavyweight with a history.",
              }[element.c]
            }
          </p>
        )}
      </Card>
      <div className="action-row">
        <Button
          variant="unstyled"
          className="action-button icon-action"
          aria-label="Download card"
          title="Download card"
          onClick={download}
        >
          <HugeiconsIcon icon={Download01Icon} size={20} aria-hidden="true" />
        </Button>
        <Button
          variant="unstyled"
          className="action-button icon-action"
          aria-label="Share element"
          title={sharing ? "Sharing…" : "Share element"}
          aria-busy={sharing}
          onClick={share}
          disabled={sharing}
        >
          <HugeiconsIcon icon={Share01Icon} size={20} aria-hidden="true" />
        </Button>
      </div>
      <p className="panel-copy" role="status">
        {feedback}
      </p>
      <p className="panel-copy">
        The orbital art is illustrative. Downloaded cards include scientific-data attribution.
      </p>
    </div>
  );
}
