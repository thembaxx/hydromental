/** SI units. Up and right are positive; air resistance is neglected. */
export const GRAVITY = 9.8;
export interface ProjectileSetup {
  speed: number;
  angle: number;
  height: number;
}
export const projectilePresets = {
  vertical: { speed: 19.6, angle: 90, height: 0 },
  drop: { speed: 0, angle: 90, height: 19.6 },
  components: { speed: 20, angle: 45, height: 0 },
} satisfies Record<string, ProjectileSetup>;

const finite = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
export function projectile(setup: ProjectileSetup) {
  const speed = finite(setup.speed, 0, 50);
  const angle = finite(setup.angle, 0, 90);
  const height = finite(setup.height, 0, 50);
  const radians = (angle * Math.PI) / 180;
  const vx = angle === 90 ? 0 : speed * Math.cos(radians);
  const uy = speed * Math.sin(radians);
  const duration = (uy + Math.sqrt(uy * uy + 2 * GRAVITY * height)) / GRAVITY;
  const apexTime = uy / GRAVITY;
  return {
    vx,
    uy,
    height,
    duration,
    apexTime,
    maxHeight: height + (uy * uy) / (2 * GRAVITY),
    range: vx * duration,
  };
}
export function projectileAt(setup: ProjectileSetup, seconds: number) {
  const flight = projectile(setup);
  const time = finite(seconds, 0, flight.duration);
  return {
    time,
    x: flight.vx * time,
    y: Math.max(0, flight.height + flight.uy * time - 0.5 * GRAVITY * time * time),
    vx: flight.vx,
    vy: flight.uy - GRAVITY * time,
    ay: -GRAVITY,
  };
}

/** A block on a horizontal, frictionless surface; vertical acceleration is zero. */
export function forceBalance(mass: number, right: number, left: number) {
  const m = finite(mass, 1, 20);
  const appliedRight = finite(right, 0, 100);
  const appliedLeft = finite(left, 0, 100);
  const weight = m * GRAVITY;
  const net = appliedRight - appliedLeft;
  return {
    mass: m,
    right: appliedRight,
    left: appliedLeft,
    weight,
    normal: weight,
    net,
    acceleration: net / m,
  };
}
