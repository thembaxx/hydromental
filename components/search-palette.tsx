"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { DialogShell } from "@/components/dialog-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { categories, elements, type Category } from "@/lib/elements";
import { searchElements } from "@/lib/search";

export interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
  onPick: (z: number) => void;
  favorites: number[];
  recent: number[];
}

export function SearchPalette({ open, onClose, onPick, favorites, recent }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const matches = useMemo(() => searchElements(query, category), [query, category]);
  const results = matches.slice(0, 12);
  const active = results[Math.min(activeIndex, Math.max(0, results.length - 1))];
  useEffect(() => {
    if (open && active)
      document.getElementById(`${listId}-${active.z}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, listId]);
  const choose = (z: number) => {
    onPick(z);
    onClose();
    setQuery("");
    setCategory("all");
    setActiveIndex(0);
  };
  const shortcut = (z: number) => {
    const element = elements[z - 1];
    return element ? (
      <Button
        variant="unstyled"
        className="search-shortcut"
        key={z}
        onClick={() => choose(z)}
        aria-label={`Explore ${element.n}`}
      >
        <span aria-hidden="true">{element.s}</span> {element.n}
      </Button>
    ) : null;
  };
  return (
    <DialogShell
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="Find an element"
      description="Search by symbol, name or atomic number. Use arrow keys to select a suggestion and Enter to explore."
      className="search-dialog"
    >
      <section className="search-palette" aria-label="Element search">
        <div className="search-header">
          <h2>Find an element</h2>
          <Button
            variant="unstyled"
            className="search-close"
            onClick={onClose}
            aria-label="Close search"
          >
            <Icon name="close" />
          </Button>
        </div>
        <div className="search-input-row">
          <Icon name="search" />
          <Input
            variant="unstyled"
            id="si"
            className="search-input"
            data-autofocus
            autoComplete="off"
            spellCheck={false}
            placeholder="Symbol, name or number"
            aria-label="Search elements"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={active ? `${listId}-${active.z}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const direction = event.key === "ArrowDown" ? 1 : -1;
                setActiveIndex((index) =>
                  results.length ? (index + direction + results.length) % results.length : 0,
                );
              }
              if (event.key === "Enter" && active) {
                event.preventDefault();
                choose(active.z);
              }
            }}
          />
        </div>
        <label className="search-filter-label">
          Element family
          <select
            className="search-family"
            aria-label="Element family"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as Category | "all");
              setActiveIndex(0);
            }}
          >
            <option value="all">All families</option>
            {Object.entries(categories).map(([key, [name]]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {!query && category === "all" && (
          <div className="search-shortcuts">
            {favorites.length > 0 && (
              <div>
                <h3>Favorites</h3>
                {[...new Set(favorites)].slice(0, 5).map(shortcut)}
              </div>
            )}
            {recent.length > 0 && (
              <div>
                <h3>Recently explored</h3>
                {[...new Set(recent)].slice(0, 5).map(shortcut)}
              </div>
            )}
          </div>
        )}
        <div className="search-results" id={listId} role="listbox" aria-label="Suggested elements">
          {results.map((element) => (
            <Button
              variant="unstyled"
              key={element.z}
              id={`${listId}-${element.z}`}
              role="option"
              tabIndex={-1}
              aria-selected={element.z === active?.z}
              className={`search-result${element.z === active?.z ? " active" : ""}`}
              onPointerEnter={() =>
                setActiveIndex(results.findIndex((result) => result.z === element.z))
              }
              onClick={() => choose(element.z)}
              aria-label={`Explore ${element.n}, atomic number ${element.z}`}
            >
              <span className="search-symbol" style={{ borderColor: categories[element.c][1] }}>
                {element.s}
              </span>
              <span className="search-result-name">
                {element.n}
                <small>{categories[element.c][0]}</small>
              </span>
              <span className="search-atomic-number">{element.z}</span>
            </Button>
          ))}
        </div>
        <p className="search-status" role="status">
          {results.length
            ? `${matches.length} matching elements. Arrow keys to browse, Enter to explore.`
            : "No elements found. Try a symbol such as Fe, a number such as 26, or a different family."}
        </p>
      </section>
    </DialogShell>
  );
}
