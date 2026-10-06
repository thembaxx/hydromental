"use client";

import Link from "next/link";
import { categories, group, period, phases, type Element } from "@/lib/elements";
import { elementSlug, getScience } from "@/lib/science";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export function ElementDetails({
  element,
  close,
  onPick,
  onInspectShell,
}: {
  element: Element;
  close: () => void;
  onPick: (z: number) => void;
  onInspectShell: (shell: number) => void;
}) {
  const science = getScience(element.z);
  const mass = science.properties.find((property) => property.label === "Atomic mass")!;
  const color = categories[element.c][1];
  const facts = [
    ["Atomic no.", element.z],
    [`Atomic mass${mass.unit ? ` · ${mass.unit}` : ""}`, mass.value],
    ["Phase", phases[element.f]],
    ["Period", period(element)],
    ["Group", group(element)],
    ["Family", categories[element.c][0]],
  ];
  return (
    <div id="dt" className="sheet open">
      <div className="dh">
        <div>
          <span className="eyebrow">Meet your element</span>
          <h2 id="dn">{element.n}</h2>
        </div>
        <Button
          variant="unstyled"
          id="dx"
          className="icon-button"
          aria-label="Close"
          onClick={close}
        >
          <Icon name="close" />
        </Button>
      </div>
      <div id="dbody" className="panel-content">
        <p className="lead-copy">{science.story}</p>
        <div className="detail-orbit">
          <svg
            viewBox="0 0 260 260"
            width="190"
            height="190"
            role="img"
            aria-label={`Electron shell populations for ${element.n}: ${science.shells.join(", ")}. Diagram is not to scale.`}
          >
            <circle cx="130" cy="130" r="12" fill={color} />
            {science.shells.map((count, i) => {
              const radius =
                science.shells.length > 1 ? 26 + i * (98 / (science.shells.length - 1)) : 70;
              return (
                <g key={i}>
                  <circle
                    cx="130"
                    cy="130"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity=".3"
                    strokeWidth="1.5"
                  />
                  {Array.from({ length: count }, (_, k) => {
                    const angle = (k / count) * Math.PI * 2 + i;
                    return (
                      <circle
                        key={k}
                        cx={130 + radius * Math.cos(angle)}
                        cy={130 + radius * Math.sin(angle)}
                        r="3.4"
                        fill={color}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
          <div>
            <h3>Inside the atom</h3>
            <p className="panel-copy">
              Neutral atoms have {element.z} protons and {element.z} electrons. Rings show electron
              counts by principal shell, rather than literal orbital paths.
            </p>
            <p className="configuration n">{science.configuration}</p>
            {science.configurationNote && <p className="panel-copy">{science.configurationNote}</p>}
            <div className="element-chips">
              {science.shells.map((count, i) => (
                <Button
                  key={i}
                  variant="unstyled"
                  className="tag"
                  onClick={() => onInspectShell(i + 1)}
                  aria-label={`Inspect shell ${i + 1}, ${count} electrons`}
                >
                  Shell {i + 1} · {count}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="fa">
          {facts.map(([label, value]) => (
            <Card variant="unstyled" key={label}>
              {label}
              <b>{value}</b>
            </Card>
          ))}
        </div>
        <section className="panel-section">
          <h3>In your everyday world</h3>
          <p>{science.everyday}</p>
          <Card variant="unstyled" className="fact-callout">
            <Icon name="spark" />
            <p>{science.fact}</p>
          </Card>
        </section>
        <section className="panel-section">
          <h3>One useful connection</h3>
          <p>{science.connection.explanation}</p>
          <Button
            variant="unstyled"
            className="action-button"
            onClick={() => onPick(science.connection.atomicNumber)}
          >
            Explore the connection <Icon name="next" />
          </Button>
        </section>
        <section className="panel-section">
          <h3>Scientific reference</h3>
          <dl className="property-list">
            {science.properties.map((property) => (
              <div key={property.label}>
                <dt>{property.label}</dt>
                <dd>
                  <span className="n">
                    {property.value}
                    {property.unit ? ` ${property.unit}` : ""}
                  </span>
                  {property.note && <small>{property.note}</small>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="panel-copy">
            Atomic weights can depend on isotopic composition. Where stable isotopes do not exist,
            listed mass numbers describe a representative isotope. Unavailable and calculated values
            are labeled in the reference data.
          </p>
        </section>
        <section className="panel-section">
          <h3>Follow the evidence</h3>
          <div className="source-links">
            {science.sources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                {source.label} ↗
              </a>
            ))}
          </div>
          <Link className="text-link" href={`/elements/${elementSlug(element)}`}>
            Open the shareable {element.n} reference page <Icon name="next" />
          </Link>
        </section>
      </div>
    </div>
  );
}
