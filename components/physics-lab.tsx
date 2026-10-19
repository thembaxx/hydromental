"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import { createModelMotion, clampZoom } from "@/lib/model-motion";
import { useModelGestures } from "@/lib/use-model-gestures";
import {
  forceBalance,
  GRAVITY,
  projectile,
  projectileAt,
  projectilePresets,
  type ProjectileSetup,
} from "@/lib/physics";

const PhysicsScene = dynamic(() => import("@/components/canvas/physics-scene"), {
  ssr: false,
  loading: () => (
    <p className="physics-scene-message" role="status">
      Preparing your experiment…
    </p>
  ),
});

const number = (value: number) => (Math.abs(value) < 0.005 ? "0.00" : value.toFixed(2));
function Parameter({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="physics-parameter">
      <span>
        {label}
        <b className="n">
          {value} <small>{unit}</small>
        </b>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${value} ${unit}`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function PhysicsLab() {
  const [mode, setMode] = useState<"projectile" | "forces">("projectile");
  const [setup, setSetup] = useState<ProjectileSetup>(projectilePresets.vertical);
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mass, setMass] = useState(5);
  const [right, setRight] = useState(30);
  const [left, setLeft] = useState(10);
  const host = useRef<HTMLDivElement>(null);
  const view = useRef(createModelMotion());
  const redraw = useRef<() => void>(() => {});
  const reduced = useReducedMotionPreference();
  const flight = projectile(setup);
  const position = projectileAt(setup, time);
  const ended = time >= flight.duration;
  const forces = forceBalance(mass, right, left);
  const invalidate = useCallback(() => redraw.current(), []);
  const ready = useCallback((callback: () => void) => {
    redraw.current = callback;
  }, []);
  useModelGestures(host, view, { still: true, invalidate, onZoom: invalidate, onTap: () => {} });
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!running || reduced || !visible || mode !== "projectile" || ended) return;
    let frame = 0,
      previous = 0;
    const tick = (now: number) => {
      if (!document.hidden && previous) {
        const delta = Math.min(0.1, (now - previous) / 1000);
        setTime((value) => Math.min(flight.duration, value + delta));
      }
      previous = document.hidden ? 0 : now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, reduced, visible, mode, flight.duration, ended]);
  const change = (next: ProjectileSetup) => {
    setSetup(next);
    setTime(0);
    setRunning(false);
  };
  const seek = (seconds: number) => {
    setTime(Math.max(0, Math.min(flight.duration, seconds)));
    setRunning(false);
  };
  const playing = running && !reduced && time < flight.duration;
  return (
    <div className="playground-page physics-page">
      <a className="skip-link" href="#physics-main">
        Skip to physics lab
      </a>
      <header className="playground-header">
        <Link href="/" className="game-brand" aria-label="Elementals home">
          <Icon name="sandbox" />
          <span>
            Elementals <b>physics lab</b>
          </span>
        </Link>
        <Link href="/playground" className="action-button">
          <Icon name="previous" /> Playground
        </Link>
      </header>
      <main id="physics-main" className="physics-main">
        <div className="physics-intro">
          <span className="eyebrow">Physical sciences · CAPS / NSC</span>
          <h1>
            Make the invisible
            <br />
            <em>make sense.</em>
          </h1>
          <p>Follow a flight. Balance a force. Connect what you see to the equations you solve.</p>
        </div>
        <div className="physics-switch" role="group" aria-label="Physics experiment">
          {(
            [
              ["projectile", "Projectile motion"],
              ["forces", "Force vectors"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              variant="unstyled"
              aria-pressed={mode === id}
              onClick={() => {
                setMode(id);
                setRunning(false);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="physics-workspace">
          <section className="physics-visual" aria-label="Interactive physics scene">
            <div className="physics-scene-heading">
              <span className="eyebrow">Live model · 3D</span>
              <span className="n">
                {mode === "projectile" ? `t = ${number(position.time)} s` : "ΣF = ma"}
              </span>
            </div>
            {mode === "projectile" && (
              <div className="physics-playback">
                <Button
                  variant="unstyled"
                  className="action-button game-primary"
                  disabled={reduced || flight.duration === 0}
                  onClick={() => {
                    if (time >= flight.duration) setTime(0);
                    setRunning(!playing);
                  }}
                >
                  <Icon name={playing ? "pause" : "play"} />
                  {playing
                    ? "Pause flight"
                    : time >= flight.duration
                      ? "Replay flight"
                      : "Start flight"}
                </Button>
                <Button variant="unstyled" className="action-button" onClick={() => seek(0)}>
                  Reset time
                </Button>
                <Button
                  variant="unstyled"
                  className="icon-button"
                  aria-label="Step flight forward 0.1 seconds"
                  disabled={time >= flight.duration}
                  onClick={() => seek(time + 0.1)}
                >
                  <Icon name="next" />
                </Button>
              </div>
            )}
            {mode === "projectile" && reduced && (
              <p className="physics-motion-note">
                Motion is reduced. Use the timeline or step controls.
              </p>
            )}
            <div
              className="physics-canvas"
              ref={host}
              role="group"
              aria-label={
                mode === "projectile"
                  ? "3D projectile trajectory: right is positive x and up is positive y"
                  : "Free-body diagram of a block on a horizontal frictionless surface"
              }
            >
              <PhysicsScene
                mode={mode}
                setup={setup}
                time={position.time}
                forces={forces}
                view={view}
                reduced={reduced}
                visible={visible}
                onReady={ready}
              />
            </div>
            <div className="physics-camera" role="group" aria-label="Physics camera controls">
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label="Rotate physics view left"
                onClick={() => {
                  view.current.y -= 0.25;
                  invalidate();
                }}
              >
                <Icon name="previous" />
              </Button>
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label="Rotate physics view right"
                onClick={() => {
                  view.current.y += 0.25;
                  invalidate();
                }}
              >
                <Icon name="next" />
              </Button>
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label="Zoom physics view in"
                onClick={() => {
                  view.current.zoom.target = clampZoom(view.current.zoom.target + 0.15);
                  invalidate();
                }}
              >
                <Icon name="zoomIn" />
              </Button>
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label="Zoom physics view out"
                onClick={() => {
                  view.current.zoom.target = clampZoom(view.current.zoom.target - 0.15);
                  invalidate();
                }}
              >
                <Icon name="zoomOut" />
              </Button>
              <Button
                variant="unstyled"
                className="icon-button"
                aria-label="Reset physics camera"
                onClick={() => {
                  Object.assign(view.current, createModelMotion());
                  invalidate();
                }}
              >
                <Icon name="reset" />
              </Button>
            </div>
            <p className="physics-gesture">Drag to orbit · Pinch or scroll to zoom</p>
            {mode === "projectile" ? (
              <div className="physics-transport">
                <label className="physics-timeline">
                  Flight timeline{" "}
                  <span className="n">
                    {number(position.time)} / {number(flight.duration)} s
                  </span>
                  <input
                    type="range"
                    aria-label="Flight time"
                    min={0}
                    max={Math.max(flight.duration, 0.01)}
                    step="any"
                    value={position.time}
                    disabled={flight.duration === 0}
                    aria-valuetext={`${number(position.time)} seconds`}
                    onChange={(event) => seek(Number(event.target.value))}
                  />
                </label>
              </div>
            ) : (
              <div className="physics-vector-key">
                <span>
                  <i style={{ background: "#efc56d" }} />
                  Rightward force
                </span>
                <span>
                  <i style={{ background: "#ee8b8c" }} />
                  Leftward force
                </span>
                <span>
                  <i style={{ background: "#7ad3c0" }} />
                  Normal force
                </span>
                <span>
                  <i style={{ background: "#82b5ff" }} />
                  Weight
                </span>
              </div>
            )}
          </section>
          <section className="physics-controls" aria-label="Experiment parameters">
            <span className="eyebrow">Change one thing. Notice what follows.</span>
            <h2>{mode === "projectile" ? "A question of motion." : "Find the resultant."}</h2>
            {mode === "projectile" ? (
              <>
                <div className="physics-presets" role="group" aria-label="Projectile examples">
                  <Button
                    variant="unstyled"
                    className="chip"
                    onClick={() => change(projectilePresets.vertical)}
                  >
                    Vertical throw
                  </Button>
                  <Button
                    variant="unstyled"
                    className="chip"
                    onClick={() => change(projectilePresets.drop)}
                  >
                    Drop from a height
                  </Button>
                  <Button
                    variant="unstyled"
                    className="chip"
                    onClick={() => change(projectilePresets.components)}
                  >
                    Vector components
                  </Button>
                </div>
                <Parameter
                  label="Initial speed"
                  value={setup.speed}
                  min={0}
                  max={30}
                  step={0.1}
                  unit="m/s"
                  onChange={(speed) => change({ ...setup, speed })}
                />
                <Parameter
                  label="Launch angle"
                  value={setup.angle}
                  min={0}
                  max={90}
                  unit="°"
                  onChange={(angle) => change({ ...setup, angle })}
                />
                <Parameter
                  label="Initial height"
                  value={setup.height}
                  min={0}
                  max={30}
                  step={0.1}
                  unit="m"
                  onChange={(height) => change({ ...setup, height })}
                />
                <dl className="physics-readouts" aria-label="Projectile results">
                  <div>
                    <dt>Height</dt>
                    <dd data-physics="height">
                      {number(position.y)} <small>m</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Vertical velocity</dt>
                    <dd data-physics="vy">
                      {number(position.vy)} <small>m/s</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Horizontal distance</dt>
                    <dd data-physics="distance">
                      {number(position.x)} <small>m</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Horizontal velocity</dt>
                    <dd data-physics="vx">
                      {number(position.vx)} <small>m/s</small>
                    </dd>
                  </div>
                </dl>
                <p className="physics-insight" role="status">
                  {time >= flight.duration
                    ? "The projectile has reached the ground. The final velocity is evaluated just before impact; no bounce is modelled."
                    : Math.abs(position.vy) < 0.05
                      ? "At the highest point, vertical velocity is zero. Acceleration is still downward."
                      : position.vy > 0
                        ? "Rising: vertical velocity decreases while gravity remains downward."
                        : "Falling: vertical velocity is negative and the downward speed increases."}
                </p>
              </>
            ) : (
              <>
                <Parameter
                  label="Block mass"
                  value={mass}
                  min={1}
                  max={20}
                  unit="kg"
                  onChange={setMass}
                />
                <Parameter
                  label="Rightward force"
                  value={right}
                  min={0}
                  max={100}
                  unit="N"
                  onChange={setRight}
                />
                <Parameter
                  label="Leftward force"
                  value={left}
                  min={0}
                  max={100}
                  unit="N"
                  onChange={setLeft}
                />
                <dl className="physics-readouts" aria-label="Force results">
                  <div>
                    <dt>Resultant force</dt>
                    <dd data-physics="net">
                      {number(forces.net)} <small>N</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Acceleration</dt>
                    <dd data-physics="acceleration">
                      {number(forces.acceleration)} <small>m/s²</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Weight, downward</dt>
                    <dd>
                      {number(forces.weight)} <small>N</small>
                    </dd>
                  </div>
                  <div>
                    <dt>Normal, upward</dt>
                    <dd>
                      {number(forces.normal)} <small>N</small>
                    </dd>
                  </div>
                </dl>
                <p className="physics-insight" role="status">
                  {forces.net === 0
                    ? "Balanced forces: acceleration is zero. The block could be at rest or moving at constant velocity."
                    : `The resultant and acceleration point ${forces.net > 0 ? "right" : "left"}. The diagram shows the forces; it does not show the block’s displacement.`}
                </p>
              </>
            )}
          </section>
        </div>
        <section className="physics-working" aria-labelledby="physics-working-title">
          <div>
            <span className="eyebrow">Show your working</span>
            <h2 id="physics-working-title">The model, in equations.</h2>
            <p>
              SI units throughout. Right and up are positive. Take g = {GRAVITY} m/s² downward.
              Displayed values are rounded; calculations retain full precision.
            </p>
          </div>
          {mode === "projectile" ? (
            <div className="physics-equations">
              <p>
                <b>vᵧ = uᵧ + at</b>
                <span>
                  {number(position.vy)} ≈ {number(flight.uy)} − 9.8 × {number(position.time)}{" "}
                  <small>m/s</small>
                </span>
              </p>
              <p>
                <b>y = y₀ + uᵧt + ½at²</b>
                <span>
                  {number(position.y)} ≈ {number(flight.height)} + {number(flight.uy)} ×{" "}
                  {number(position.time)} − 4.9 × {number(position.time)}² <small>m</small>
                </span>
              </p>
              <p>
                <b>x = uₓt</b>
                <span>
                  {number(position.x)} ≈ {number(flight.vx)} × {number(position.time)}{" "}
                  <small>m</small>
                </span>
              </p>
              <p>
                <b>Predicted flight</b>
                <span>
                  {number(flight.duration)} s to ground · {number(flight.maxHeight)} m maximum
                  height · {number(flight.range)} m range
                </span>
              </p>
            </div>
          ) : (
            <div className="physics-equations">
              <p>
                <b>ΣFₓ = Fᵣ − Fₗ = maₓ</b>
                <span>
                  {number(right)} − {number(left)} = {number(forces.net)} N; aₓ ={" "}
                  {number(forces.net)} / {mass} ≈ {number(forces.acceleration)} m/s²
                </span>
              </p>
              <p>
                <b>ΣFᵧ = N − mg = 0</b>
                <span>
                  N = {mass} × 9.8 = {number(forces.normal)} N
                </span>
              </p>
            </div>
          )}
        </section>
        <aside className="physics-context">
          <h2>From the lab to your exam.</h2>
          <p>
            CAPS Physical Sciences covers vectors and Newton’s laws, and Grade 12 vertical
            projectile motion. Begin with the vertical throw or drop. The angled launch is an
            extension for exploring horizontal and vertical components.
          </p>
          <p>
            Projectiles are point masses under constant gravity, without air resistance, spin or
            bouncing. The force diagram assumes a horizontal frictionless surface with no vertical
            acceleration. Geometry is fitted uniformly to the viewport; use the numerical results
            for measurements.
          </p>
          <a
            href="https://www.education.gov.za/LinkClick.aspx?fileticket=uVcOcx728Y8%3d&tabid=570&portalid=0&mid=1558"
            target="_blank"
            rel="noreferrer"
          >
            DBE: CAPS Physical Sciences, Grades 10–12 <Icon name="next" size={14} />
          </a>
        </aside>
        <noscript>
          <p>
            The initial equations and assumptions are readable here. Enable JavaScript to adjust and
            run the simulations.
          </p>
        </noscript>
      </main>
    </div>
  );
}
