"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { PanelWorkspace } from "@/components/panel-workspace";
import { PeriodicTable } from "@/components/periodic-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { categories, elements, phases, type Category } from "@/lib/elements";
import { searchElements } from "@/lib/search";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

export type LibraryView = "search" | "family" | "table";

/** One query and family selection, with three complementary ways to browse. */
export function ElementLibrary({
  view,
  onView,
  query,
  onQuery: setQuery,
  category,
  onCategory: setCategory,
  current,
  found,
  favorites,
  recent,
  onPick,
  onFavorite,
  onDetails,
  onQuiz,
  close,
}: {
  view: LibraryView;
  onView: (view: LibraryView) => void;
  query: string;
  onQuery: (query: string) => void;
  category: Category | "all";
  onCategory: (category: Category | "all") => void;
  current: number;
  found: Set<number>;
  favorites: number[];
  recent: number[];
  onPick: (z: number) => void;
  onFavorite: (z: number) => void;
  onDetails: (z: number) => void;
  onQuiz: () => void;
  close: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const reduced = useReducedMotionPreference();
  const matches = useMemo(() => searchElements(query, category), [query, category]);
  const tableMatches = useMemo(() => new Set(matches.map((element) => element.z)), [matches]);
  const results = matches.slice(0, 12);
  const active = results[Math.min(activeIndex, Math.max(0, results.length - 1))];
  useEffect(() => {
    if (view === "search" && active)
      document.getElementById(`${listId}-${active.z}`)?.scrollIntoView({ block: "nearest" });
  }, [view, active, listId]);
  useEffect(() => {
    if (view === "family")
      document.querySelector<HTMLElement>(".family-filter[aria-pressed='true']")?.scrollIntoView({
        inline: "center",
        block: "nearest",
        behavior: reduced ? "instant" : "smooth",
      });
  }, [view, category, reduced]);
  const choose = (z: number) => {
    onPick(z);
    close();
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
    <PanelWorkspace
      title="Element library"
      subtitle="118 elements, one place to explore"
      value={view}
      onChange={onView}
      close={close}
      tabs={[
        {
          value: "search",
          label: "Search",
          content: (
            <div className="library-search-results">
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
              <div
                className="search-results"
                id={listId}
                role="listbox"
                aria-label="Suggested elements"
              >
                {results.map((element, index) => (
                  <Button
                    variant="unstyled"
                    key={element.z}
                    id={`${listId}-${element.z}`}
                    role="option"
                    tabIndex={-1}
                    aria-selected={element.z === active?.z}
                    className={`search-result${element.z === active?.z ? " active" : ""}`}
                    onPointerEnter={() => setActiveIndex(index)}
                    onClick={() => choose(element.z)}
                    aria-label={`Explore ${element.n}, atomic number ${element.z}`}
                  >
                    <span
                      className="search-symbol"
                      style={{ borderColor: categories[element.c][1] }}
                    >
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
            </div>
          ),
        },
        {
          value: "family",
          label: "Families",
          content: (
            <section
              className="library-cards"
              aria-label={
                category === "all" ? "All element families" : `${categories[category][0]} elements`
              }
            >
              <div className="family-filters" role="group" aria-label="Chemical families">
                <Button
                  variant="unstyled"
                  className="family-filter"
                  aria-pressed={category === "all"}
                  onClick={() => setCategory("all")}
                >
                  All families
                </Button>
                {(Object.keys(categories) as Category[]).map((key) => (
                  <Button
                    variant="unstyled"
                    key={key}
                    className="family-filter"
                    aria-pressed={key === category}
                    style={{ "--family-color": categories[key][1] } as CSSProperties}
                    onClick={() => {
                      setCategory(key);
                      setActiveIndex(0);
                    }}
                  >
                    <i aria-hidden="true" />
                    {categories[key][0]}
                  </Button>
                ))}
              </div>
              <ul className="family-results">
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
                            "--i": String(Math.min(index, 12)),
                          } as CSSProperties
                        }
                        onClick={() => choose(element.z)}
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
                          onClick={() => onDetails(element.z)}
                        >
                          Story
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        },
        {
          value: "table",
          label: "Periodic table",
          content: (
            <PeriodicTable
              embedded
              active={view === "table"}
              current={current - 1}
              found={found}
              matches={tableMatches}
              pick={(index) => onPick(index + 1)}
              close={close}
              quiz={onQuiz}
            />
          ),
        },
      ]}
    >
      <div className="library-controls">
        <div className="search-input-row">
          <Icon name="search" />
          <Input
            variant="unstyled"
            id="si"
            className="search-input"
            data-autofocus={view === "search" ? "" : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Symbol, name or number"
            aria-label="Search elements"
            role={view === "search" ? "combobox" : undefined}
            aria-autocomplete={view === "search" ? "list" : undefined}
            aria-expanded={view === "search" ? true : undefined}
            aria-controls={view === "search" ? listId : undefined}
            aria-activedescendant={
              view === "search" && active ? `${listId}-${active.z}` : undefined
            }
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (view !== "search") return;
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
          {query && (
            <Button
              variant="unstyled"
              className="icon-button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setActiveIndex(0);
                document.getElementById("si")?.focus();
              }}
            >
              <Icon name="close" />
            </Button>
          )}
        </div>
        <div className="library-filter-row">
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
          <p className="search-status" role="status">
            {matches.length
              ? `${matches.length} matching elements${view === "search" ? ". Arrow keys to browse, Enter to explore." : "."}`
              : "No elements found. Try another name or family."}
          </p>
        </div>
      </div>
    </PanelWorkspace>
  );
}
