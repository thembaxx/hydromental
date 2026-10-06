"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { elements, categories, group, period, type Element } from "@/lib/elements";
import { getScience, elementSlug } from "@/lib/science";
import { searchElements } from "@/lib/search";

export function ComparisonPanel({
  current,
  onPick,
}: {
  current: Element;
  onPick: (z: number) => void;
}) {
  const [left, setLeft] = useState(current.z);
  const [right, setRight] = useState(current.z === 8 ? 16 : 8);
  const [query, setQuery] = useState("");
  const [slot, setSlot] = useState<"left" | "right">("right");
  const first = elements[left - 1];
  const second = elements[right - 1];
  const results = query.trim() ? searchElements(query).slice(0, 8) : [];
  const firstScience = getScience(first.z);
  const secondScience = getScience(second.z);
  const propertyLabels = [
    ...new Set(
      [...firstScience.properties, ...secondScience.properties].map((property) => property.label),
    ),
  ];
  const propertyValue = (science: ReturnType<typeof getScience>, label: string) => {
    const property = science.properties.find((item) => item.label === label);
    return property
      ? `${property.value}${property.unit ? ` ${property.unit}` : ""}${property.note ? ` (${property.note})` : ""}`
      : "Not available";
  };
  const sameFamily = first.c === second.c;
  const sameGroup =
    first.g === second.g && !["l", "c"].includes(first.c) && !["l", "c"].includes(second.c);
  return (
    <div className="panel-content">
      <p className="panel-copy">
        Compare two elements and spot the patterns behind the periodic table.
      </p>
      <div className="segmented" aria-label="Choose which element to replace">
        <Button
          variant="unstyled"
          className="action-button"
          aria-pressed={slot === "left"}
          onClick={() => setSlot("left")}
        >
          Replace {first.n}
        </Button>
        <Button
          variant="unstyled"
          className="action-button"
          aria-pressed={slot === "right"}
          onClick={() => setSlot("right")}
        >
          Replace {second.n}
        </Button>
      </div>
      <label className="field-label" htmlFor="compare-search">
        <HugeiconsIcon icon={Search01Icon} size={18} aria-hidden="true" /> Find an element
      </label>
      <Input
        variant="unstyled"
        className="form-input"
        id="compare-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Name, symbol, or atomic number"
        autoComplete="off"
      />
      {query.trim() && (
        <div className="search-suggestions" aria-label="Comparison search results">
          {results.length ? (
            results.map((element) => (
              <Button
                variant="unstyled"
                className="action-button"
                key={element.z}
                onClick={() => {
                  if (slot === "left") setLeft(element.z);
                  else setRight(element.z);
                  setQuery("");
                }}
              >
                {element.s} · {element.n} · {element.z}
              </Button>
            ))
          ) : (
            <p className="panel-copy">No matching element.</p>
          )}
        </div>
      )}
      <div className="comparison-scroll">
        <table className="comparison-table">
          <caption>
            Properties of {first.n} and {second.n}
          </caption>
          <thead>
            <tr>
              <th scope="col">Property</th>
              {[first, second].map((element, index) => (
                <th key={index} scope="col">
                  <Button
                    variant="unstyled"
                    className="action-button"
                    onClick={() => onPick(element.z)}
                  >
                    {element.s} · {element.n}
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Atomic number", first.z, second.z],
              ["Family", categories[first.c][0], categories[second.c][0]],
              ["Group", group(first), group(second)],
              ["Period", period(first), period(second)],
              ["Electron configuration", firstScience.configuration, secondScience.configuration],
              [
                "Electrons by shell",
                firstScience.shells.join(" · "),
                secondScience.shells.join(" · "),
              ],
              ...propertyLabels.map((label) => [
                label,
                propertyValue(firstScience, label),
                propertyValue(secondScience, label),
              ]),
            ].map(([label, a, b]) => (
              <tr key={String(label)}>
                <th scope="row">{label}</th>
                <td className={/^[-+]?\d/.test(String(a)) ? "n" : undefined}>{a}</td>
                <td className={/^[-+]?\d/.test(String(b)) ? "n" : undefined}>{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="panel-section">
        <h3 className="panel-title">What connects them?</h3>
        <Badge variant="unstyled" className="tag">
          {left === right
            ? "Same element"
            : sameGroup
              ? "Same group"
              : sameFamily
                ? "Same family"
                : "Different families"}
        </Badge>
        <p className="panel-copy">
          {left === right
            ? "Choose a second element to compare their properties."
            : sameGroup
              ? `Both sit in group ${first.g}. Elements in the same group often share patterns in their outer electrons and chemical behavior; their size and reactivity can still differ.`
              : sameFamily
                ? `Both belong to the ${categories[first.c][0].toLowerCase()} family. Shared classification helps identify broad patterns, while electron configuration explains the differences.`
                : `${first.n} is a ${categories[first.c][0].toLowerCase()} and ${second.n} is a ${categories[second.c][0].toLowerCase()}. Compare their outer shells to explore why their behavior differs.`}
        </p>
        <p className="panel-copy">
          {first.n}: {firstScience.configurationNote}
        </p>
        {left !== right && (
          <p className="panel-copy">
            {second.n}: {secondScience.configurationNote}
          </p>
        )}
      </section>
      <section className="panel-section">
        <h3 className="panel-title">Learn more</h3>
        {[first, second].map((element, index) => (
          <p key={index} className="panel-copy">
            <a href={`/elements/${elementSlug(element)}`}>{element.n}: story, data, and sources</a>
          </p>
        ))}
        <h4>Data references</h4>
        {[
          ...new Map(
            [...firstScience.sources, ...secondScience.sources].map((source) => [
              source.url,
              source,
            ]),
          ).values(),
        ].map((source) => (
          <p className="panel-copy" key={source.url}>
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          </p>
        ))}
      </section>
    </div>
  );
}
