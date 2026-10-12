"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { DialogShell } from "@/components/dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { categories, elements, type Category, type Element } from "@/lib/elements";

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
  const show = (element: Element) => {
    onPick(element.z);
    onOpenChange(false);
  };
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={name}
      description="Every element in this chemical family. Filter by name, or switch family."
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
        <div className="search-input-row">
          <Icon name="search" />
          <Input
            variant="unstyled"
            className="search-input"
            data-autofocus
            autoComplete="off"
            spellCheck={false}
            placeholder="Filter by name"
            aria-label={`Filter ${name} by name`}
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
          <p className="family-empty">Nothing in this family matches that name.</p>
        ) : (
          <ul className="family-results">
            {matches.map((element) => {
              const saved = favorites.includes(element.z);
              return (
                <li key={element.z} className="family-row">
                  <Button
                    variant="unstyled"
                    className="family-open"
                    aria-label={`Show ${element.n} on the stage`}
                    aria-current={element.z === current ? "true" : undefined}
                    onClick={() => show(element)}
                  >
                    <span
                      className="family-symbol"
                      style={{
                        background: categories[element.c][1],
                        color:
                          element.c === "t" || element.c === "l" || element.c === "e"
                            ? "#0B1031"
                            : "#fff",
                      }}
                    >
                      {element.s}
                    </span>
                    <span className="family-name">
                      {element.n}
                      <small>
                        {element.z} · {element.m} u
                      </small>
                    </span>
                  </Button>
                  <div className="family-actions">
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
