export interface SpringValue {
  value: number;
  target: number;
  velocity: number;
}

export function springValue(value: number): SpringValue {
  return { value, target: value, velocity: 0 };
}

/** Substeps keep the damped spring stable on both slow phones and fast displays. */
export function advanceSpring(spring: SpringValue, delta: number, stiffness = 170, damping = 22) {
  const duration = Math.max(0, Math.min(delta, 0.064));
  const steps = Math.max(1, Math.ceil(duration * 120));
  const dt = duration / steps;
  for (let i = 0; i < steps; i++) {
    spring.velocity +=
      ((spring.target - spring.value) * stiffness - spring.velocity * damping) * dt;
    spring.value += spring.velocity * dt;
  }
  if (Math.abs(spring.velocity) + Math.abs(spring.target - spring.value) < 0.0001) {
    spring.value = spring.target;
    spring.velocity = 0;
  }
}

export function createModelMotion() {
  return {
    x: -0.15,
    y: 0.25,
    vx: 0,
    vy: 0,
    dragging: false,
    time: 0,
    zoom: springValue(1),
    spread: springValue(0),
    pulse: springValue(0),
  };
}
export type ModelMotion = ReturnType<typeof createModelMotion>;
export const clampZoom = (zoom: number) => Math.max(0.65, Math.min(1.85, zoom));

/** Shell numbers are one-based in the UI. Invalid or unselected shells stay unannounced. */
export function getShellFocus(shells: readonly number[], selectedShell: number | null) {
  if (
    selectedShell === null ||
    !Number.isInteger(selectedShell) ||
    selectedShell < 1 ||
    selectedShell > shells.length
  ) {
    return null;
  }
  return { number: selectedShell, electrons: shells[selectedShell - 1] };
}

export function rotateModel(state: ModelMotion, dx: number, dy: number, seconds = 0.016) {
  state.x = Math.max(-1.35, Math.min(1.35, state.x + dy * 0.007));
  state.y += dx * 0.007;
  const dt = Math.max(0.008, seconds);
  state.vx = Math.max(-3, Math.min(3, (dy * 0.007) / dt));
  state.vy = Math.max(-4, Math.min(4, (dx * 0.007) / dt));
}

export function advanceModelMotion(state: ModelMotion, delta: number, still = false) {
  const dt = Math.max(0, Math.min(delta, 0.064));
  if (still) {
    state.vx = state.vy = 0;
    for (const spring of [state.zoom, state.spread, state.pulse]) {
      spring.value = spring.target;
      spring.velocity = 0;
    }
    return;
  }
  state.time += dt;
  if (!state.dragging) {
    // Integrate exponential drag analytically so momentum is frame-rate independent.
    const drag = Math.exp(-4.5 * dt);
    state.x = Math.max(-1.35, Math.min(1.35, state.x + (state.vx * (1 - drag)) / 4.5));
    state.y += (state.vy * (1 - drag)) / 4.5 + dt * 0.075;
    state.vx *= drag;
    state.vy *= drag;
  }
  advanceSpring(state.zoom, dt);
  advanceSpring(state.spread, dt, 100, 17);
  advanceSpring(state.pulse, dt, 110, 10);
}

export function nucleusLayout(atomicNumber: number, massNumber: number) {
  const count = Math.max(atomicNumber, massNumber);
  const points: Array<[number, number, number]> = [];
  for (let x = -5; x <= 5; x++)
    for (let y = -5; y <= 5; y++)
      for (let z = -5; z <= 5; z++) points.push([x + (y % 2) * 0.5, y * 0.87, z]);
  points.sort(
    (a, b) => a.reduce((sum, n) => sum + n * n, 0) - b.reduce((sum, n) => sum + n * n, 0),
  );
  const chosen = points.slice(0, count);
  const center = [0, 1, 2].map(
    (axis) => chosen.reduce((sum, point) => sum + point[axis], 0) / count,
  );
  const extent = Math.max(1, ...chosen.map((point) => Math.hypot(...point)));
  const spacing = 0.48 / extent;
  return {
    radius: count === 1 ? 0.23 : spacing * 0.56,
    particles: chosen.map((point, i) => ({
      position: point.map((value, axis) => (value - center[axis]) * spacing) as [
        number,
        number,
        number,
      ],
      proton: Math.floor(((i + 1) * atomicNumber) / count) > Math.floor((i * atomicNumber) / count),
    })),
  };
}
