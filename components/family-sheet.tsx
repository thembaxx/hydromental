"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { DialogShell } from "@/components/dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { categories, elements, phases, type Category, type Element } from "@/lib/elements";

const families = Object.keys(categories) as Category[];

export function FamilySheet({
  open,
  category,
  current,
  favorites,
  onOpenChange,
  onPick,
  onFavorite,
  onDetails,
}: {
  open: boolean;
  category: Category;
  current: number;
  favorites: number[];
  onOpenChange: (open: boolean) => void;
  onPick: (atomicNumber: number) => void;
  onFavorite: (atomicNumber: number) => void;
  onDetails: (atomicNumber: number) => void;
}) {
  const [family, setFamily] = useState(category);
  const [query, setQuery] = useState("");
  const reduced = useReducedMotion();
  const name = categories[family][0];
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return elements.filter((element) => {
      if (element.c !== family) return false;
      if (!needle) return true;
      return (
        element.n.toLowerCase().includes(needle) ||
        element.s.toLowerCase().includes(needle) ||
        String(element.z) === needle
      );
    });
  }, [family, query]);
  useEffect(() => {
    if (!open) return;
    document.querySelector<HTMLElement>(".family-filter[aria-pressed='true']")?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduced ? "instant" : "smooth",
    });
  }, [family, open, reduced]);
  const show = (element: Element) => {
    onPick(element.z);
    onOpenChange(false);
  };
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={name}
      description="Every element in this chemical family. Search by name, symbol, or atomic number."
      className="family-dialog search-dialog"
    >
      <section className="family-sheet" aria-label={`${name} elements`}>
        <div className="search-header">
          <div>
            <h2>{name}</h2>
            <p>
              {query.trim()
                ? `${matches.length} ${matches.length === 1 ? "match" : "matches"}`
                : `${matches.length} ${matches.length === 1 ? "element" : "elements"} in this family`}
            </p>
          </div>
          <Button
            variant="unstyled"
            className="search-close"
            onClick={() => onOpenChange(false)}
            aria-label="Close family"
          >
            <Icon name="close" />
          </Button>
        </div>
        <div className="search-input-row family-search">
          <Icon name="search" />
          <Input
            variant="unstyled"
            className="search-input"
            data-autofocus
            autoComplete="off"
            spellCheck={false}
            placeholder="Search by name, symbol, or atomic number..."
            aria-label={`Search ${name} by name, symbol, or atomic number`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="family-filters" role="group" aria-label="Chemical families">
          {families.map((key) => (
            <Button
              variant="unstyled"
              key={key}
              className="family-filter"
              aria-pressed={key === family}
              style={{ "--family-color": categories[key][1] } as CSSProperties}
              onClick={() => setFamily(key)}
            >
              <i aria-hidden="true" />
              {categories[key][0]}
            </Button>
          ))}
        </div>
        {matches.length === 0 ? (
          <p className="family-empty">Nothing in this family matches that search.</p>
        ) : (
          <ul className="family-results" key={family + query}>
            {matches.map((element, index) => {
              const saved = favorites.includes(element.z);
              return (
                <li key={element.z} className="element-card-item">
                  <Button
                    variant="unstyled"
                    className="element-card"
                    aria-label={`Show ${element.n} on the stage`}
                    aria-current={element.z === current ? "true" : undefined}
                    style={
                      {
                        "--family-color": categories[element.c][1],
                        "--i": String(index),
                      } as CSSProperties
                    }
                    onClick={() => show(element)}
                  >
                    <span className="element-card-top">
                      <span className="element-card-z">{element.z}</span>
                      <span className="element-card-phase" data-phase={element.f}>
                        {phases[element.f]}
                      </span>
                    </span>
                    <span className="element-card-symbol">{element.s}</span>
                    <span className="element-card-name">{element.n}</span>
                    <span className="element-card-foot">
                      <span className="element-card-mass">
                        {element.m} <i className="unit">u</i>
                      </span>
                      <span className="element-card-dot" aria-hidden="true" />
                    </span>
                  </Button>
                  <div className="element-card-actions">
                    <Button
                      variant="unstyled"
                      className={`icon-button${saved ? " is-favorite" : ""}`}
                      aria-label={
                        saved ? `Remove ${element.n} from favorites` : `Favorite ${element.n}`
                      }
                      aria-pressed={saved}
                      onClick={() => onFavorite(element.z)}
                    >
                      <Icon name="favorite" />
                    </Button>
                    <Button
                      variant="unstyled"
                      className="family-story"
                      onClick={() => {
                        onDetails(element.z);
                        onOpenChange(false);
                      }}
                    >
                      Story
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </DialogShell>
  );
}
