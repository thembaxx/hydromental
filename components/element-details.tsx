"use client";

import Link from "next/link";
import { categories, group, period, type Element } from "@/lib/elements";
import { elementSlug, getScience } from "@/lib/science";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { ElementStructure } from "@/components/element-structure";

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
    [
      "Standard state",
      science.properties.find((property) => property.label === "Standard state")!.value,
    ],
    ["Period", period(element)],
    ["Group", group(element) === "—" ? "f-block" : group(element)],
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
        <p className="lead-copy">{science.description}</p>
        <p className="panel-copy">{science.story}</p>
        <section className="panel-section">
          <h3>In your everyday world</h3>
          <p>{science.everyday}</p>
          <Card variant="unstyled" className="fact-callout">
            <Icon name="spark" />
            <p>{science.fact}</p>
          </Card>
        </section>
        <div className="detail-orbit">
          <ElementStructure
            key={element.z}
            name={element.n}
            shells={science.shells}
            color={color}
          />
          <div className="detail-atom-copy">
            <h3>Inside the atom</h3>
            <p className="panel-copy">
              Neutral atoms have <span className="n">{element.z}</span> protons and{" "}
              <span className="n">{element.z}</span> electrons. Rings show electron counts by
              principal shell, rather than literal orbital paths.
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
                  Shell{" "}
                  <span className="n">
                    {i + 1} · {count}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="fa">
          {facts.map(([label, value]) => (
            <Card variant="unstyled" key={label}>
              {label}
              <b className={/^\d/.test(String(value)) ? "n" : undefined}>{value}</b>
            </Card>
          ))}
        </div>
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
                  <span className={/^[-+]?\d/.test(property.value) ? "n" : undefined}>
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
            the source mass value may describe a representative isotope rather than a standard
            atomic weight. Unavailable and calculated values are labeled in the reference data.
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
