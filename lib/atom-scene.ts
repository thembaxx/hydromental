import * as THREE from "three";
import { categories, type Element } from "./elements";
import { getScience } from "./science";

export type AtomInspection = {
  kind: "nucleus" | "shell";
  atomicNumber: number;
  shell?: number;
  electrons?: number;
};
export interface SceneControls {
  spin: number;
  tilt: number;
  bounce: number;
  dragging: boolean;
  x: number;
  y: number;
  hold: boolean;
  spread: boolean;
  open: boolean;
  quality?: "auto" | "low" | "high";
  model?: "playful" | "scientific";
  labels?: boolean;
  zoom?: number;
  rotationMode?: boolean;
  rotationX?: number;
  rotationY?: number;
  selectedShell?: number | null;
  paused?: boolean;
  direction?: "u" | "d" | "l" | "r" | null;
  onInspect?: (inspection: AtomInspection) => void;
}

/** Both views are illustrations. Shell clouds depict populations, not calculated orbital shapes. */
export function createAtomScene(
  canvas: HTMLCanvasElement,
  controls: SceneControls,
  initial: Element,
) {
  const host = canvas.parentElement!;
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionPreference.matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  scene.add(new THREE.AmbientLight(0xffffff, 0.62 * Math.PI));
  const light = new THREE.DirectionalLight(0xffffff, 0.85 * Math.PI);
  light.position.set(-3, 5, 6);
  scene.add(light);
  const fill = new THREE.PointLight(0x9fb4ff, 0.6 * Math.PI);
  fill.position.set(4, 2, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xc4d9ff, 0.18 * Math.PI);
  rim.position.set(2, 3, -4);
  scene.add(rim);
  const world = new THREE.Group();
  scene.add(world);
  const hero = new THREE.Group();
  world.add(hero);
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 512;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.NoColorSpace;
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(1, 64, 40),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.3, metalness: 0.05 }),
  );
  orb.position.y = 1;
  hero.add(orb);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.3, 0.035, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0x363b5e }),
  );
  ring.rotation.x = Math.PI / 2;
  world.add(ring);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 32),
    new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.22 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  world.add(shadow);
  const electronGeometry = new THREE.SphereGeometry(0.1, 16, 12);
  const electrons = Array.from({ length: 12 }, () => {
    const mesh = new THREE.Mesh(
      electronGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x8899ff,
        emissiveIntensity: 0.5,
      }),
    );
    world.add(mesh);
    return mesh;
  });
  const arcGeometry = new THREE.BufferGeometry();
  arcGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      Array.from({ length: 40 }, (_, i) => {
        const angle = Math.PI - (i / 39) * Math.PI * 0.62;
        return [2.35 * Math.cos(angle), 0.2 + 2.6 * Math.sin(angle), 0];
      }).flat(),
      3,
    ),
  );
  const arc = new THREE.Points(
    arcGeometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.075, transparent: true, opacity: 0.75 }),
  );
  world.add(arc);
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      Array.from({ length: 90 }, (_, i) => [
        (random(i + 11) - 0.5) * 16,
        (random(i + 119) - 0.3) * 14,
        (random(i + 229) - 0.5) * 6 - 3,
      ]).flat(),
      3,
    ),
  );
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.5 }),
  );
  scene.add(dust);
  const scientific = new THREE.Group();
  scientific.position.y = 1;
  world.add(scientific);
  const shellGeometry = new THREE.SphereGeometry(1, 32, 20);
  const shells: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>[] = [];
  const clouds: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>[] = [];
  const labels: THREE.Sprite[] = [];
  let element = initial;
  let distance = 10;
  let shift = 2.5;
  let disposed = false;
  let contextLost = false;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let scale = 1;
  let scaleVelocity = 0;
  let spread = 1;
  let spreadVelocity = 0;
  let y = 0;
  let yVelocity = 0;
  let tiltVelocity = 0;
  let travelX = 0;
  let travelY = 0;
  let travelXVelocity = 0;
  let travelYVelocity = 0;
  let automaticLow = navigator.hardwareConcurrency <= 4;
  let slowFrames = 0;
  let quality = "";
  const ownedLabelTextures = new Set<THREE.Texture>();
  function random(seed: number) {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  }
  function skin() {
    const context = textureCanvas.getContext("2d")!;
    context.shadowBlur = 0;
    context.fillStyle = categories[element.c][1];
    context.fillRect(0, 0, 1024, 512);
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "rgba(255,255,255,.28)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0)");
    gradient.addColorStop(1, "rgba(0,0,40,.35)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 110; i++) {
      context.fillStyle = "rgba(0,0,30,.10)";
      context.beginPath();
      context.arc(
        random(i + element.z) * 1024,
        40 + random(i + 211) * 432,
        4 + random(i + 411) * 12,
        0,
        7,
      );
      context.fill();
    }
    context.font = `800 ${element.s.length > 2 ? 150 : element.s.length > 1 ? 190 : 230}px Nunito,sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "rgba(5,10,40,.45)";
    context.shadowBlur = 18;
    context.fillStyle = element.c === "t" ? "#0B1031" : "#fff";
    [0, 0.25, 0.5, 0.75, 1].forEach((u) => context.fillText(element.s, u * 1024, 262));
    texture.needsUpdate = true;
  }
  function buildShells() {
    shells.forEach((mesh) => {
      scientific.remove(mesh);
      mesh.material.dispose();
    });
    clouds.forEach((cloud) => {
      scientific.remove(cloud);
      cloud.geometry.dispose();
      cloud.material.dispose();
    });
    labels.forEach((label) => {
      scientific.remove(label);
      if (label.material.map) {
        ownedLabelTextures.delete(label.material.map);
        label.material.map.dispose();
      }
      label.material.dispose();
    });
    shells.length = clouds.length = labels.length = 0;
    const populations = getScience(element.z).shells;
    populations.forEach((population, index) => {
      const radius = 1.3 + index * 0.25;
      const material = new THREE.MeshBasicMaterial({
        color: categories[element.c][1],
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const shell = new THREE.Mesh(shellGeometry, material);
      shell.scale.setScalar(radius);
      shell.userData.shell = index + 1;
      shell.userData.electrons = population;
      shells.push(shell);
      scientific.add(shell);
      const positions = Array.from({ length: population * 18 }, (_, dot) => {
        const seed = dot + index * 733 + element.z * 191;
        const azimuth = random(seed) * Math.PI * 2;
        const elevation = Math.acos(2 * random(seed + 71) - 1);
        const r = radius * (0.9 + random(seed + 131) * 0.16);
        return [
          r * Math.sin(elevation) * Math.cos(azimuth),
          r * Math.cos(elevation),
          r * Math.sin(elevation) * Math.sin(azimuth),
        ];
      }).flat();
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      const cloud = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: categories[element.c][1],
          size: 0.035,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      );
      clouds.push(cloud);
      scientific.add(cloud);
      const labelCanvas = document.createElement("canvas");
      labelCanvas.width = 512;
      labelCanvas.height = 80;
      const context = labelCanvas.getContext("2d")!;
      context.fillStyle = "rgba(11,16,49,.88)";
      context.roundRect(0, 0, 512, 80, 25);
      context.fill();
      context.font = "700 32px Nunito,sans-serif";
      context.fillStyle = "#fff";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        `Shell ${index + 1} · ${population} electron${population === 1 ? "" : "s"}`,
        256,
        40,
      );
      const map = new THREE.CanvasTexture(labelCanvas);
      ownedLabelTextures.add(map);
      const label = new THREE.Sprite(
        new THREE.SpriteMaterial({ map, depthTest: false, transparent: true }),
      );
      label.position.set(radius + 0.05, (index - (populations.length - 1) / 2) * 0.38, 0);
      label.scale.set(1.85, 0.29, 1);
      labels.push(label);
      scientific.add(label);
    });
  }
  function theme() {
    const root = document.documentElement;
    ring.material.color.set(getComputedStyle(root).getPropertyValue("--ring").trim() || "#8FA6D8");
    const selected = root.dataset.theme;
    const dark = selected ? selected !== "day" : matchMedia("(prefers-color-scheme: dark)").matches;
    dust.material.color.set(dark ? 0xffffff : 0x8fa6d8);
  }
  function updateQuality() {
    const next =
      controls.quality === "low" || (controls.quality !== "high" && automaticLow) ? "low" : "high";
    if (quality === next) return;
    quality = next;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, quality === "low" ? 1 : 2));
    dust.visible = quality !== "low";
    fit();
  }
  function fit() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    distance = Math.max(9, 3.1 / (Math.tan((19 * Math.PI) / 180) * camera.aspect));
    shift = 2 * Math.tan((19 * Math.PI) / 180) * distance * 0.2;
    camera.updateProjectionMatrix();
  }
  function spring(
    value: number,
    velocity: number,
    goal: number,
    stiffness: number,
    damping: number,
    dt: number,
  ) {
    velocity = (velocity + (goal - value) * stiffness * dt) * Math.exp(-damping * dt);
    return [value + velocity * dt, velocity];
  }
  function loop(ms: number) {
    frame = 0;
    if (disposed || contextLost || document.hidden) return;
    const rawDt = (ms - last) / 1000 || 0.016;
    const dt = Math.min(rawDt, 0.05);
    last = ms;
    if (rawDt > 0.04 && !controls.dragging) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 90 && controls.quality !== "high") automaticLow = true;
    updateQuality();
    const animated = !reduced && !controls.paused;
    if (animated) elapsed += dt;
    if (controls.bounce) {
      scaleVelocity = animated ? controls.bounce : 0;
      controls.bounce = 0;
    }
    [scale, scaleVelocity] = spring(scale, scaleVelocity, 1, 170, 9, dt);
    hero.scale.set(
      animated ? 1 + (1 - scale) * 0.5 : 1,
      animated ? scale : 1,
      animated ? 1 + (1 - scale) * 0.5 : 1,
    );
    if (controls.rotationMode) {
      const horizontal = controls.rotationY ?? orb.rotation.y;
      const vertical = Math.max(-1.3, Math.min(1.3, controls.rotationX ?? controls.tilt));
      orb.rotation.set(vertical, horizontal, 0);
      scientific.rotation.set(vertical, horizontal, 0);
    } else if (animated) {
      const snapping = Math.abs(controls.spin) < 0.8 && !controls.dragging;
      if (snapping)
        controls.spin +=
          (Math.round(orb.rotation.y / (Math.PI / 2)) * (Math.PI / 2) - orb.rotation.y) * 60 * dt;
      orb.rotation.y += controls.spin * dt;
      controls.spin *= Math.exp(-(snapping ? 7 : 1.8) * dt);
      [controls.tilt, tiltVelocity] = spring(controls.tilt, tiltVelocity, 0, 60, 6, dt);
      orb.rotation.x = controls.tilt;
      scientific.rotation.set(orb.rotation.x, orb.rotation.y * 0.1, 0);
    }
    const spreadGoal = controls.hold || controls.spread ? 1.7 : 1;
    if (animated) [spread, spreadVelocity] = spring(spread, spreadVelocity, spreadGoal, 90, 7, dt);
    else {
      spread = spreadGoal;
      spreadVelocity = 0;
    }
    if (reduced) {
      y = controls.open ? shift : 0;
      yVelocity = 0;
    } else [y, yVelocity] = spring(y, yVelocity, controls.open ? shift : 0, 70, 8, dt);
    [travelX, travelXVelocity] = spring(travelX, travelXVelocity, 0, 90, 10, dt);
    [travelY, travelYVelocity] = spring(travelY, travelYVelocity, 0, 90, 10, dt);
    world.position.set(animated ? travelX : 0, y + (animated ? travelY : 0), 0);
    const isScientific = controls.model === "scientific";
    orb.scale.setScalar(isScientific ? 0.34 : 1);
    scientific.visible = isScientific;
    scientific.scale.setScalar(spread);
    ring.visible = shadow.visible = arc.visible = !isScientific;
    shells.forEach((shell, index) => {
      const selected = controls.selectedShell === index + 1;
      shell.material.opacity = selected ? 0.19 : 0.055;
      clouds[index].material.opacity = selected ? 0.9 : 0.5;
      labels[index].visible = Boolean(controls.labels);
    });
    electrons.forEach((mesh, i) => {
      mesh.visible = !isScientific && i < Math.min(12, element.z);
      const angle = elapsed * (0.6 + 0.12 * (i % 4)) + i * 2.1;
      if (i % 2 === 0) {
        const radius = 2.3 * spread;
        mesh.position.set(radius * Math.cos(angle), 0.08, radius * Math.sin(angle));
      } else {
        const radius = 1.75 * spread;
        const tilt = i % 4 < 2 ? 0.9 : -0.9;
        const x = radius * Math.cos(angle);
        mesh.position.set(x * Math.cos(tilt), 1 + x * Math.sin(tilt), radius * Math.sin(angle));
      }
    });
    const zoom = Math.max(0.65, Math.min(1.7, controls.zoom ?? 1));
    const zoomDistance = distance / zoom;
    const cameraX = controls.x * 0.08 * zoomDistance;
    if (reduced) camera.position.x = cameraX;
    else camera.position.x += (cameraX - camera.position.x) * Math.min(1, dt * 4);
    camera.position.y = zoomDistance * 0.24 + controls.y * 0.05 * zoomDistance;
    camera.position.z = zoomDistance;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(loop);
  }
  function resume() {
    if (disposed || contextLost || document.hidden || frame) return;
    last = 0;
    frame = requestAnimationFrame(loop);
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else resume();
  }
  function motionChanged() {
    reduced = motionPreference.matches;
  }
  function lost(event: Event) {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function restored() {
    contextLost = false;
    resume();
  }
  const resize = new ResizeObserver(fit);
  resize.observe(host);
  const themes = new MutationObserver(theme);
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", theme);
  motionPreference.addEventListener("change", motionChanged);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  updateQuality();
  skin();
  buildShells();
  theme();
  void document.fonts.ready.then(() => {
    if (!disposed) {
      skin();
      buildShells();
    }
  });
  resume();
  const raycaster = new THREE.Raycaster();
  return {
    setElement(next: Element) {
      if (next.z === element.z) return;
      element = next;
      const direction = controls.direction;
      if (!reduced && !controls.paused) {
        travelX = direction === "l" ? -0.35 : direction === "r" ? 0.35 : 0;
        travelY = direction === "u" ? 0.3 : direction === "d" ? -0.3 : 0;
      }
      controls.direction = null;
      controls.selectedShell = null;
      skin();
      buildShells();
    },
    inspect(clientX: number, clientY: number): AtomInspection | null {
      if (disposed || contextLost) return null;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      scene.updateMatrixWorld(true);
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      let inspection: AtomInspection | null = null;
      if (raycaster.intersectObject(orb).length)
        inspection = { kind: "nucleus", atomicNumber: element.z };
      else if (scientific.visible) {
        // Nested transparent spheres overlap. Select the nearest projected shell
        // boundary so the front of the outer shell does not intercept every click.
        const intersected = new Set(raycaster.intersectObjects(shells).map((hit) => hit.object));
        const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
        let hit: THREE.Mesh | undefined;
        let bestDistance = Infinity;
        for (const shell of shells) {
          if (!intersected.has(shell)) continue;
          const center = shell.getWorldPosition(new THREE.Vector3());
          const radius = shell.getWorldScale(new THREE.Vector3()).x;
          const edge = center.clone().addScaledVector(cameraRight, radius).project(camera);
          center.project(camera);
          const centerX = rect.left + ((center.x + 1) / 2) * rect.width;
          const centerY = rect.top + ((1 - center.y) / 2) * rect.height;
          const projectedRadius = (Math.abs(edge.x - center.x) * rect.width) / 2;
          const proximity = Math.abs(
            Math.hypot(clientX - centerX, clientY - centerY) - projectedRadius,
          );
          if (proximity < bestDistance) {
            bestDistance = proximity;
            hit = shell;
          }
        }
        if (hit)
          inspection = {
            kind: "shell",
            atomicNumber: element.z,
            shell: hit.userData.shell as number,
            electrons: hit.userData.electrons as number,
          };
      }
      if (inspection) {
        controls.selectedShell = inspection.kind === "shell" ? inspection.shell : null;
        controls.onInspect?.(inspection);
      }
      return inspection;
    },
    resetCamera() {
      controls.zoom = 1;
      controls.rotationX = 0;
      controls.rotationY = 0;
      controls.selectedShell = null;
      controls.spin = controls.tilt = controls.x = controls.y = 0;
      orb.rotation.set(0, 0, 0);
      scientific.rotation.set(0, 0, 0);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      themes.disconnect();
      scheme.removeEventListener("change", theme);
      motionPreference.removeEventListener("change", motionChanged);
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points)
          geometries.add(object.geometry);
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.Sprite
        ) {
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(
            (material) => materials.add(material),
          );
        }
      });
      geometries.add(shellGeometry);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      ownedLabelTextures.forEach((map) => map.dispose());
      texture.dispose();
      renderer.dispose();
    },
  };
}
