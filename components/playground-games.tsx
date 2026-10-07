"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { PlaygroundScene, type SceneHandle } from "@/components/playground-scene";
import { categories, elements } from "@/lib/elements";
import type { GameSession, LearningSettings } from "@/lib/learning";
import {
  atomTargets,
  crystalInfo,
  equationCounts,
  equations,
  isotopeSource,
  knownIsotopes,
  molecules,
  mysteryClues,
  mysteryElements,
  objects,
  periodicHoles,
  propertyRounds,
  propertyValue,
  sessionModel,
} from "@/lib/playground";
import { getScience } from "@/lib/science";

interface Props {
  session: GameSession;
  onChange: (session: GameSession) => void;
  onInspect: (z: number) => void;
  paused: boolean;
  settings: LearningSettings;
  solved: boolean;
}
function ElementPalette({
  zs,
  selected,
  onSelect,
  api,
  onPlace,
}: {
  zs: number[];
  selected: number;
  onSelect: (z: number) => void;
  api?: React.RefObject<SceneHandle | null>;
  onPlace?: (slot: number, z: number) => void;
}) {
  const drag = useRef<{ x: number; y: number; z: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  return (
    <div className="game-palette" role="group" aria-label="Element ingredients">
      {zs.map((z) => (
        <Button
          key={z}
          variant="unstyled"
          className="game-ingredient"
          style={{ "--element-color": categories[elements[z - 1].c][1] } as React.CSSProperties}
          aria-label={`Select ${elements[z - 1].n}`}
          aria-pressed={selected === z}
          onClick={(event) => {
            if (!suppressClick.current || event.detail === 0) onSelect(z);
            suppressClick.current = false;
          }}
          draggable={!!onPlace}
          onDragStart={(e) => {
            e.dataTransfer.setData("application/element", String(z));
            onSelect(z);
          }}
          onPointerDown={(e) => {
            suppressClick.current = false;
            if (e.pointerType !== "touch" || !onPlace) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, z, moved: false };
          }}
          onPointerMove={(e) => {
            if (
              drag.current &&
              Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 10
            )
              drag.current.moved = true;
          }}
          onPointerUp={(e) => {
            const start = drag.current;
            drag.current = null;
            if (start?.moved) {
              const slot = api?.current?.pickAt(e.clientX, e.clientY);
              if (slot != null) onPlace?.(slot, start.z);
              suppressClick.current = true;
            }
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <span className="n">{elements[z - 1].s}</span>
          <small>{elements[z - 1].n}</small>
        </Button>
      ))}
    </div>
  );
}
export function GameView(props: Props) {
  const { session } = props;
  switch (session.game) {
    case "molecule":
      return <MoleculeGame {...props} />;
    case "atom":
      return <AtomGame {...props} />;
    case "balance":
      return <BalanceGame {...props} />;
    case "periodic":
      return <PeriodicGame {...props} />;
    case "detective":
      return <DetectiveGame {...props} />;
    case "mystery":
      return <MysteryGame {...props} />;
    case "crystal":
      return <CrystalGame {...props} />;
    case "properties":
      return <PropertyGame {...props} />;
  }
}
function MoleculeGame({ session, onChange, onInspect, paused, settings, solved }: Props) {
  const api = useRef<SceneHandle | null>(null);
  const molecule = molecules[session.index];
  const model = useMemo(
    () =>
      sessionModel({
        game: session.game,
        index: session.index,
        values: session.values,
        crystal: session.crystal,
        units: session.units,
      }),
    [session.game, session.index, session.values, session.crystal, session.units],
  );
  const zs = [...new Set(molecule.atoms.map((atom) => atom.z))];
  const place = (slot: number, z: number) => {
    if (solved) return;
    onChange({ ...session, values: session.values.map((v, i) => (i === slot ? z : v)) });
  };
  return (
    <div className="game-body">
      <p className="game-task">
        Build <strong>{molecule.name}</strong> <span className="n">{molecule.formula}</span>. Select
        an ingredient, then tap a ghost atom or a position below. You can also drag an ingredient
        onto the model.
      </p>
      <PlaygroundScene
        {...model}
        api={api}
        paused={paused}
        quality={settings.quality}
        onPick={(slot) => {
          if (session.values[slot] > 0) onInspect(session.values[slot]);
          else if (session.choice) place(slot, session.choice);
        }}
        onDrop={place}
      />
      <ElementPalette
        zs={zs}
        selected={session.choice}
        onSelect={(choice) => onChange({ ...session, choice })}
        api={api}
        onPlace={place}
      />
      <div className="game-slots" role="group" aria-label="Atom positions">
        {molecule.atoms.map((_, i) => (
          <div key={i} className="game-slot">
            <Button
              variant="unstyled"
              className="action-button"
              aria-label={`Place selected atom in position ${i + 1}`}
              disabled={!session.choice || solved}
              onClick={() => place(i, session.choice)}
            >
              <span className="n">{i + 1}</span>{" "}
              {session.values[i] > 0 ? elements[session.values[i] - 1].s : "Empty"}
            </Button>
            {session.values[i] > 0 && (
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label={`Remove atom from position ${i + 1}`}
                disabled={solved}
                onClick={() => place(i, -1)}
              >
                <Icon name="close" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <p className="panel-copy">
        Placed{" "}
        <span className="n">
          {session.values.filter((z) => z > 0).length}/{molecule.atoms.length}
        </span>{" "}
        atoms. Bonds snap into place when both positions are filled. Tap a placed atom to learn
        about its element.
      </p>
      <details className="game-source">
        <summary>Geometry and source</summary>
        <p>
          {molecule.geometry}. Atom sizes and bond lengths are illustrative; the target geometry and
          bond orders are simplified chemical models.
        </p>
        <a href={molecule.source} target="_blank" rel="noreferrer">
          PubChem: {molecule.name}
        </a>
      </details>
    </div>
  );
}
function AtomGame({ session, onChange, onInspect, paused, settings }: Props) {
  const api = useRef<SceneHandle | null>(null);
  const model = useMemo(
    () =>
      sessionModel({
        game: session.game,
        index: session.index,
        values: session.values,
        crystal: session.crystal,
        units: session.units,
      }),
    [session.game, session.index, session.values, session.crystal, session.units],
  );
  const [p, n, e] = session.values;
  const change = (index: number, value: number) => {
    const max = index === 1 ? 180 : 118,
      min = index === 0 ? 1 : 0;
    if (!Number.isFinite(value)) return;
    onChange({
      ...session,
      values: session.values.map((v, i) =>
        i === index ? Math.max(min, Math.min(max, Math.round(value))) : v,
      ),
    });
  };
  return (
    <div className="game-body">
      <p className="game-task">
        {session.free
          ? "Explore particles freely. Change protons to change the element, neutrons to change the mass number, and electrons to change the charge."
          : atomTargets[session.index].description}
      </p>
      <PlaygroundScene
        {...model}
        api={api}
        paused={paused}
        quality={settings.quality}
        onPick={() => onInspect(p)}
      />
      <div className="particle-controls">
        {["Protons", "Neutrons", "Electrons"].map((label, i) => (
          <div key={label} className="particle-control">
            <span>{label}</span>
            <div>
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label={`Decrease ${label.toLowerCase()}`}
                disabled={session.values[i] === (i ? 0 : 1)}
                onClick={() => change(i, session.values[i] - 1)}
              >
                <Icon name="down" />
              </Button>
              <Input
                variant="unstyled"
                className="form-input n"
                aria-label={label}
                type="number"
                min={i ? 0 : 1}
                max={i === 1 ? 180 : 118}
                value={session.values[i]}
                onChange={(event) => change(i, event.target.valueAsNumber)}
              />
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label={`Increase ${label.toLowerCase()}`}
                disabled={session.values[i] === (i === 1 ? 180 : 118)}
                onClick={() => change(i, session.values[i] + 1)}
              >
                <Icon name="up" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="game-readout">
        <strong>{elements[p - 1].n}</strong>
        <span>
          Atomic number <b className="n">{p}</b>
        </span>
        <span>
          Mass number <b className="n">{p + n}</b>
        </span>
        <span>
          Charge{" "}
          <b className="n">
            {p - e > 0 ? "+" : ""}
            {p - e}
          </b>
        </span>
      </div>
      <p className="panel-copy">
        {knownIsotopes[p]?.includes(p + n)
          ? "This mass number is in the NIST isotopic-composition reference. Charge is set independently by your electron count."
          : "This is an exploratory particle composition, not a claim that the isotope or ion is stable or naturally occurring."}{" "}
        Particle dots are capped at 18 of each type; the controls show exact counts. A positive ion
        has fewer electrons than protons.
      </p>
      <a className="game-source" href={isotopeSource} target="_blank" rel="noreferrer">
        NIST isotope reference
      </a>
    </div>
  );
}
function BalanceGame({ session, onChange, solved }: Props) {
  const equation = equations[session.index];
  const species = [...equation.left, ...equation.right];
  return (
    <div className="game-body">
      <p className="game-task">
        {equation.name}. Balance the equation with the smallest whole-number coefficients. The
        formulas stay fixed.
      </p>
      <div className="equation-line">
        {species.map((item, i) => (
          <div className="equation-term" key={i}>
            {i > 0 && (
              <span className="equation-operator">
                {i === equation.left.length ? (session.index === 2 ? "⇌" : "→") : "+"}
              </span>
            )}
            <label>
              <Input
                variant="unstyled"
                className="form-input n"
                type="number"
                min={1}
                max={9}
                aria-label={`Coefficient for ${item.label} ${i < equation.left.length ? "reactant" : "product"}`}
                value={session.values[i]}
                disabled={solved}
                onChange={(e) => {
                  const v = e.target.valueAsNumber;
                  if (Number.isFinite(v))
                    onChange({
                      ...session,
                      values: session.values.map((old, n) =>
                        n === i ? Math.max(1, Math.min(9, Math.round(v))) : old,
                      ),
                    });
                }}
              />
              <span className="n">{item.label}</span>
            </label>
          </div>
        ))}
      </div>
      <table className="game-counts">
        <caption>Atom conservation</caption>
        <thead>
          <tr>
            <th scope="col">Element</th>
            <th scope="col">Reactants</th>
            <th scope="col">Products</th>
            <th scope="col">Match</th>
          </tr>
        </thead>
        <tbody>
          {equationCounts(session.index, session.values).map((row) => (
            <tr key={row.z}>
              <th scope="row">{elements[row.z - 1].s}</th>
              <td className="n">{row.left}</td>
              <td className="n">{row.right}</td>
              <td>{row.left === row.right ? "Equal" : "Unequal"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="panel-copy">
        This is an atom-counting exercise. Reaction conditions, heat and reaction rate are outside
        this model.
      </p>
      <a
        className="game-source"
        href="https://openstax.org/books/chemistry-2e/pages/4-1-writing-and-balancing-chemical-equations"
        target="_blank"
        rel="noreferrer"
      >
        OpenStax: writing and balancing chemical equations
      </a>
    </div>
  );
}
function PeriodicGame({ session, onChange, solved }: Props) {
  const holes = periodicHoles[session.index];
  return (
    <div className="game-body">
      <p className="game-task">
        Restore four missing tiles in the first four periods. Select an element below, then choose
        its period and group. Scroll the table sideways on smaller screens.
      </p>
      <div
        className="game-table-scroll"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users must be able to scroll the overflow table.
        tabIndex={0}
        role="region"
        aria-label="Scrollable periodic puzzle"
      >
        <div className="game-mini-table">
          {elements.slice(0, 20).map((element) => {
            const slot = holes.indexOf(element.z);
            const z = slot < 0 ? element.z : session.values[slot];
            return slot < 0 ? (
              <div
                key={element.z}
                className="game-tile"
                style={{ gridColumn: element.g, gridRow: element.p }}
              >
                <span className="n">{element.z}</span>
                <strong>{element.s}</strong>
              </div>
            ) : (
              <Button
                key={element.z}
                variant="unstyled"
                className="game-tile game-tile-hole"
                style={{ gridColumn: element.g, gridRow: element.p }}
                aria-label={`Period ${element.p}, group ${element.g}`}
                disabled={!session.choice || solved}
                onClick={() =>
                  onChange({
                    ...session,
                    values: session.values.map((v, i) => (i === slot ? session.choice : v)),
                  })
                }
              >
                <small className="n">
                  P{element.p} G{element.g}
                </small>
                <strong>{z > 0 ? elements[z - 1].s : "?"}</strong>
              </Button>
            );
          })}
        </div>
      </div>
      <ElementPalette
        zs={[...holes].reverse()}
        selected={session.choice}
        onSelect={(choice) => onChange({ ...session, choice })}
      />
      <p className="panel-copy">
        The full reference table still contains all 118 elements. These empty tiles are the puzzle.
      </p>
      <a
        className="game-source"
        href="https://iupac.org/what-we-do/periodic-table-of-elements/"
        target="_blank"
        rel="noreferrer"
      >
        IUPAC periodic table
      </a>
    </div>
  );
}
function ObjectDrawing({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 400 240" aria-hidden="true" className="game-object-svg">
      <defs>
        <linearGradient id={`object-${kind}`} x2="1" y2="1">
          <stop stopColor="var(--accent-soft)" />
          <stop offset="1" stopColor="var(--chip)" />
        </linearGradient>
      </defs>
      {kind === "phone" ? (
        <>
          <rect
            x="133"
            y="15"
            width="134"
            height="210"
            rx="24"
            fill={`url(#object-${kind})`}
            stroke="currentColor"
            strokeWidth="4"
          />
          <rect x="146" y="48" width="108" height="151" rx="12" fill="var(--dw)" />
          <rect x="181" y="20" width="38" height="9" rx="4" fill="currentColor" />
          <rect
            x="165"
            y="72"
            width="40"
            height="40"
            rx="8"
            fill="var(--accent-soft)"
            stroke="currentColor"
          />
          <path d="M205 92h31v67h-36" fill="none" stroke="currentColor" strokeWidth="3" />
          <rect
            x="173"
            y="132"
            width="35"
            height="51"
            rx="7"
            fill="var(--chip)"
            stroke="currentColor"
          />
          <path d="M169 212h62" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : kind === "bicycle" ? (
        <>
          <circle cx="91" cy="162" r="56" fill="var(--dw)" stroke="currentColor" strokeWidth="6" />
          <circle cx="310" cy="162" r="56" fill="var(--dw)" stroke="currentColor" strokeWidth="6" />
          <path
            d="M91 162l55-92 64 92H91l58-77h113l48 77M210 162l45-103M131 61h42M251 59l-9-27h35"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="7"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <circle
            cx="210"
            cy="162"
            r="16"
            fill="var(--accent-soft)"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path d="M210 162l17 18h16" stroke="currentColor" strokeWidth="4" />
          <circle cx="270" cy="39" r="8" fill="var(--chip)" stroke="currentColor" />
        </>
      ) : (
        <>
          <path
            d="M147 170c0-38-26-52-26-91a79 79 0 01158 0c0 39-26 53-26 91z"
            fill={`url(#object-${kind})`}
            stroke="currentColor"
            strokeWidth="4"
          />
          <path d="M148 174h104v38H148z" fill="var(--chip)" stroke="currentColor" strokeWidth="3" />
          <path d="M160 220h80M148 186h104M148 199h104" stroke="currentColor" strokeWidth="4" />
          <rect
            x="178"
            y="75"
            width="44"
            height="24"
            rx="6"
            fill="var(--accent-soft)"
            stroke="currentColor"
          />
          <path
            d="M178 84h-15v43h73V84h-14M163 129v38M236 129v38"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
        </>
      )}
    </svg>
  );
}
function DetectiveGame({ session, onChange, solved }: Props) {
  const object = objects[session.index];
  const part = Math.max(0, Math.min(3, session.choice));
  const targets =
    object.kind === "phone"
      ? [
          [45, 40],
          [61, 56],
          [48, 66],
          [54, 89],
        ]
      : object.kind === "bicycle"
        ? [
            [42, 41],
            [53, 69],
            [24, 80],
            [68, 16],
          ]
        : [
            [50, 36],
            [42, 76],
            [60, 56],
            [50, 15],
          ];
  const coordinates =
    object.kind === "phone"
      ? [
          [23, 36],
          [78, 40],
          [23, 70],
          [78, 82],
        ]
      : object.kind === "bicycle"
        ? [
            [42, 41],
            [53, 73],
            [24, 80],
            [68, 16],
          ]
        : [
            [28, 38],
            [28, 82],
            [75, 59],
            [72, 15],
          ];
  return (
    <div className="game-body">
      <p className="game-task">
        {object.name}. Pick a numbered part, then assign the element most closely associated with
        that material.
      </p>
      <div className="game-object">
        <ObjectDrawing kind={object.kind} />
        <svg
          className="game-object-leaders"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {coordinates.map(([x, y], i) => (
            <line
              key={i}
              x1={x}
              y1={y}
              x2={targets[i][0]}
              y2={targets[i][1]}
              stroke="currentColor"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        {object.parts.map((label, i) => (
          <Button
            key={label}
            variant="unstyled"
            className="game-hotspot n"
            aria-label={`Inspect ${label}`}
            aria-pressed={part === i}
            style={{ left: `${coordinates[i][0]}%`, top: `${coordinates[i][1]}%` }}
            onClick={() => onChange({ ...session, choice: i })}
          >
            {i + 1}
          </Button>
        ))}
      </div>
      <div className="game-part-list">
        {object.parts.map((label, i) => (
          <Button
            key={label}
            variant="unstyled"
            className="action-button"
            aria-pressed={part === i}
            onClick={() => onChange({ ...session, choice: i })}
          >
            <span className="n">{i + 1}</span> {label}{" "}
            <strong className="n">
              {session.values[i] > 0 ? elements[session.values[i] - 1].s : "?"}
            </strong>
          </Button>
        ))}
      </div>
      <p className="game-task">
        <strong>Assign element to: {object.parts[part]}</strong>
      </p>
      <ElementPalette
        zs={object.choices}
        selected={session.values[part]}
        onSelect={(z) => {
          if (!solved)
            onChange({ ...session, values: session.values.map((v, i) => (i === part ? z : v)) });
        }}
      />
      {(session.hints > 0 || solved) && <p className="game-hint">{object.explanations[part]}</p>}
      {solved && (
        <ul className="game-explanations">
          {object.explanations.map((text, i) => (
            <li key={text}>
              <strong>{object.parts[i]}:</strong> {text}
            </li>
          ))}
        </ul>
      )}
      <details className="game-source">
        <summary>Material references</summary>
        <p>
          Products vary. These examples refer to elements within common alloys and compounds, rather
          than pure elemental lumps.
        </p>
        {object.answers.map((z) => (
          <a key={z} href={getScience(z).sources[0].url} target="_blank" rel="noreferrer">
            {getScience(z).sources[0].label}: {elements[z - 1].n}
          </a>
        ))}
      </details>
    </div>
  );
}
function MysteryGame({ session, onChange, solved }: Props) {
  const [search, setSearch] = useState("");
  const clues = mysteryClues(session.index);
  const matches = elements.filter(
    (e) => !search || `${e.n} ${e.s} ${e.z}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="game-body">
      <div className="mystery-orb" aria-hidden="true">
        <Icon name="help" />
      </div>
      <p className="game-task">
        Who am I? Choose any of the 118 elements. Use fewer clues for a tougher challenge.
      </p>
      <ol className="game-clues">
        {clues.slice(0, Math.min(4, session.hints + 1)).map((clue) => (
          <li key={clue}>{clue}</li>
        ))}
      </ol>
      <label className="field-group" htmlFor="mystery-search">
        <span className="field-label">Find your answer</span>
        <Input
          variant="unstyled"
          className="form-input"
          id="mystery-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, symbol or atomic number"
        />
      </label>
      <label className="field-group">
        <span className="field-label">Mystery element</span>
        <select
          className="form-input"
          aria-label="Mystery element"
          value={session.choice}
          disabled={solved}
          onChange={(e) => onChange({ ...session, choice: Number(e.target.value) })}
        >
          <option value={0}>Choose an element</option>
          {session.choice > 0 && !matches.some((e) => e.z === session.choice) && (
            <option value={session.choice}>{elements[session.choice - 1].n}</option>
          )}
          {matches.map((e) => (
            <option key={e.z} value={e.z}>
              {e.z} · {e.n} ({e.s})
            </option>
          ))}
        </select>
      </label>
      {matches.length === 0 && (
        <p className="panel-copy">No matching elements. Try a symbol such as Fe.</p>
      )}
      {solved && <p className="game-hint">{getScience(mysteryElements[session.index]).everyday}</p>}
    </div>
  );
}
function CrystalGame({ session, onChange, paused, settings, onInspect }: Props) {
  const api = useRef<SceneHandle | null>(null);
  const model = useMemo(
    () =>
      sessionModel({
        game: session.game,
        index: session.index,
        values: session.values,
        crystal: session.crystal,
        units: session.units,
      }),
    [session.game, session.index, session.values, session.crystal, session.units],
  );
  const target = (["salt", "diamond", "graphite"] as const)[session.index];
  return (
    <div className="game-body">
      <p className="game-task">
        {session.free
          ? "Explore how the same atoms can form very different repeating structures."
          : crystalInfo[target].clue}
      </p>
      <PlaygroundScene
        {...model}
        api={api}
        paused={paused}
        quality={settings.quality}
        onPick={(i) => {
          if (!model.atoms[i].ghost) onInspect(model.atoms[i].z);
        }}
      />
      <div className="game-part-list" role="group" aria-label="Crystal structure">
        {(["salt", "diamond", "graphite"] as const).map((crystal) => (
          <Button
            key={crystal}
            variant="unstyled"
            className="action-button"
            aria-pressed={session.crystal === crystal}
            onClick={() => onChange({ ...session, crystal, units: 0 })}
          >
            {crystalInfo[crystal].title}
          </Button>
        ))}
      </div>
      <div className="game-toolbar">
        <Button
          variant="unstyled"
          className="action-button"
          disabled={session.units === 3}
          onClick={() => onChange({ ...session, units: session.units + 1 })}
        >
          Add section
        </Button>
        <Button
          variant="unstyled"
          className="icon-button"
          disabled={session.units === 0}
          aria-label="Remove crystal section"
          onClick={() => onChange({ ...session, units: session.units - 1 })}
        >
          <Icon name="close" />
        </Button>
        <span className="n">{session.units}/3</span>
      </div>
      <p className="panel-copy">{crystalInfo[session.crystal].explanation}</p>
      <a
        className="game-source"
        href={
          session.crystal === "salt"
            ? "https://openstax.org/books/chemistry-2e/pages/10-6-lattice-structures-in-crystalline-solids"
            : getScience(6).sources[0].url
        }
        target="_blank"
        rel="noreferrer"
      >
        Structure reference: {crystalInfo[session.crystal].title}
      </a>
    </div>
  );
}
function PropertyGame({ session, onChange, solved, onInspect }: Props) {
  const round = propertyRounds[session.index];
  const dragging = useRef<number | null>(null);
  const move = (from: number, to: number) => {
    if (solved || from === to || to < 0 || to >= 4) return;
    const values = [...session.values];
    const [z] = values.splice(from, 1);
    values.splice(to, 0, z);
    onChange({ ...session, values });
  };
  return (
    <div className="game-body">
      <p className="game-task">
        Order these elements by <strong>{round.name.toLowerCase()}</strong>, from lowest to highest.
        Use the arrow controls or drag rows.
      </p>
      <ol className="property-order">
        {session.values.map((z, i) => (
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Dragging is an optional pointer alternative; each row has labeled keyboard reorder buttons.
          <li
            key={z}
            draggable={!solved}
            onDragStart={() => {
              dragging.current = i;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging.current != null) move(dragging.current, i);
              dragging.current = null;
            }}
          >
            <span className="game-rank n">{i + 1}</span>
            <Button
              variant="unstyled"
              className="game-property-element"
              aria-label={`Inspect ${elements[z - 1].n}`}
              onClick={() => onInspect(z)}
            >
              <strong className="n">{elements[z - 1].s}</strong>
              <span>{elements[z - 1].n}</span>
            </Button>
            <span className="n game-property-value">
              {solved ? `${propertyValue(session.index, z)} ${round.unit}` : ""}
            </span>
            <Button
              variant="unstyled"
              className="icon-button"
              aria-label={`Move ${elements[z - 1].n} earlier`}
              disabled={!i || solved}
              onClick={() => move(i, i - 1)}
            >
              <Icon name="up" />
            </Button>
            <Button
              variant="unstyled"
              className="icon-button"
              aria-label={`Move ${elements[z - 1].n} later`}
              disabled={i === 3 || solved}
              onClick={() => move(i, i + 1)}
            >
              <Icon name="down" />
            </Button>
          </li>
        ))}
      </ol>
      {session.hints > 0 && (
        <p className="game-hint">
          {elements[round.zs[0] - 1].n}:{" "}
          <span className="n">
            {propertyValue(session.index, round.zs[0])} {round.unit}
          </span>
          . {elements[round.zs[3] - 1].n}:{" "}
          <span className="n">
            {propertyValue(session.index, round.zs[3])} {round.unit}
          </span>
          .
        </p>
      )}
      <p className="panel-copy">{round.explanation}</p>
      <details className="game-source">
        <summary>Data and conditions</summary>
        <p>
          Values come from the app’s documented periodic-table snapshot. Density and melting points
          depend on reference conditions. Electronegativity uses the Pauling scale.
        </p>
        {round.zs.map((z) => (
          <a key={z} href={getScience(z).sources[0].url} target="_blank" rel="noreferrer">
            {elements[z - 1].n} reference
          </a>
        ))}
      </details>
    </div>
  );
}
export function gameHint(session: GameSession): string {
  if (session.game === "molecule") {
    const molecule = molecules[session.index];
    const counts = new Map<number, number>();
    molecule.atoms.forEach((a) => counts.set(a.z, (counts.get(a.z) ?? 0) + 1));
    return `${molecule.formula} needs ${[...counts].map(([z, count]) => `${count} ${elements[z - 1].n.toLowerCase()} atom${count > 1 ? "s" : ""}`).join(" and ")}. Position 1 is ${elements[molecule.atoms[0].z - 1].n}.`;
  }
  if (session.game === "atom")
    return "Mass number = protons + neutrons. Charge = protons − electrons. Keep the proton count fixed when changing only the isotope or ion.";
  if (session.game === "balance")
    return `Start with ${equations[session.index].left[0].label}: its smallest coefficient is ${equations[session.index].solution[0]}. Then compare the counters for each element.`;
  if (session.game === "periodic")
    return "Groups are the vertical columns; periods are the horizontal rows. Hydrogen begins period 1 in group 1, and helium ends it in group 18.";
  if (session.game === "detective")
    return "The material clue for your selected part is now shown below its ingredients. Select another part to see its clue.";
  if (session.game === "mystery")
    return "Another clue has been revealed. Check that your answer fits every clue.";
  if (session.game === "crystal")
    return session.index === 0
      ? "Look for alternating sodium and chloride ions, rather than a carbon network."
      : session.index === 1
        ? "Diamond has a three-dimensional tetrahedral carbon network."
        : "Graphite has carbon sheets separated by weaker interactions.";
  return "Two reference values are now shown beneath the order controls. You can also inspect each element’s data.";
}
