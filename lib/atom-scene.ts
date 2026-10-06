import * as THREE from "three";
import { categories, type Element } from "./elements";

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
}

export function createAtomScene(
  canvas: HTMLCanvasElement,
  controls: SceneControls,
  initial: Element,
) {
  const host = canvas.parentElement!;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  // Preserve the reference prototype's linear output and legacy light intensities.
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  scene.add(new THREE.AmbientLight(0xffffff, 0.62 * Math.PI));
  const light = new THREE.DirectionalLight(0xffffff, 0.85 * Math.PI);
  light.position.set(-3, 5, 6);
  scene.add(light);
  const fill = new THREE.PointLight(0x9fb4ff, 0.6 * Math.PI);
  fill.position.set(4, 2, 4);
  scene.add(fill);
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
  const electrons = Array.from({ length: 12 }, () => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x8899ff,
        emissiveIntensity: 0.5,
      }),
    );
    world.add(mesh);
    return mesh;
  });
  const arc = Array.from({ length: 40 }, (_, i) => {
    const angle = Math.PI - (i / 39) * Math.PI * 0.62;
    return [2.35 * Math.cos(angle), 0.2 + 2.6 * Math.sin(angle), 0];
  }).flat();
  const arcGeometry = new THREE.BufferGeometry();
  arcGeometry.setAttribute("position", new THREE.Float32BufferAttribute(arc, 3));
  world.add(
    new THREE.Points(
      arcGeometry,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.075, transparent: true, opacity: 0.75 }),
    ),
  );
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      Array.from({ length: 90 }, () => [
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.3) * 14,
        (Math.random() - 0.5) * 6 - 3,
      ]).flat(),
      3,
    ),
  );
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.5 }),
  );
  scene.add(dust);
  let element = initial;
  let distance = 10;
  let shift = 2.5;
  let disposed = false;
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
      context.arc(Math.random() * 1024, 40 + Math.random() * 432, 4 + Math.random() * 12, 0, 7);
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
  function theme() {
    const root = document.documentElement;
    ring.material.color.set(getComputedStyle(root).getPropertyValue("--ring").trim() || "#8FA6D8");
    const selected = root.dataset.theme;
    const dark = selected ? selected !== "day" : matchMedia("(prefers-color-scheme: dark)").matches;
    dust.material.color.set(dark ? 0xffffff : 0x8fa6d8);
  }
  function fit() {
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    distance = Math.max(9, 3.1 / (Math.tan((19 * Math.PI) / 180) * camera.aspect));
    shift = 2 * Math.tan((19 * Math.PI) / 180) * distance * 0.2;
    camera.updateProjectionMatrix();
  }
  const resize = new ResizeObserver(fit);
  resize.observe(host);
  const themes = new MutationObserver(theme);
  themes.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const scheme = matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", theme);
  fit();
  skin();
  theme();
  void document.fonts.ready.then(() => {
    if (!disposed) skin();
  });
  let frame = 0,
    last = 0,
    elapsed = 0,
    scale = 1,
    scaleVelocity = 0,
    spread = 1,
    spreadVelocity = 0,
    y = 0,
    yVelocity = 0,
    tiltVelocity = 0;
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
    frame = requestAnimationFrame(loop);
    const dt = Math.min((ms - last) / 1000 || 0.016, 0.05);
    last = ms;
    if (!reduced) elapsed += dt;
    if (controls.bounce) {
      scaleVelocity = controls.bounce;
      controls.bounce = 0;
    }
    [scale, scaleVelocity] = spring(scale, scaleVelocity, 1, 170, 9, dt);
    hero.scale.set(
      reduced ? 1 : 1 + (1 - scale) * 0.5,
      reduced ? 1 : scale,
      reduced ? 1 : 1 + (1 - scale) * 0.5,
    );
    if (!reduced) {
      const snapping = Math.abs(controls.spin) < 0.8 && !controls.dragging;
      if (snapping)
        controls.spin +=
          (Math.round(orb.rotation.y / (Math.PI / 2)) * (Math.PI / 2) - orb.rotation.y) * 60 * dt;
      orb.rotation.y += controls.spin * dt;
      controls.spin *= Math.exp(-(snapping ? 7 : 1.8) * dt);
      [controls.tilt, tiltVelocity] = spring(controls.tilt, tiltVelocity, 0, 60, 6, dt);
      orb.rotation.x = controls.tilt;
    }
    [spread, spreadVelocity] = spring(
      spread,
      spreadVelocity,
      controls.hold || controls.spread ? 1.7 : 1,
      90,
      7,
      dt,
    );
    [y, yVelocity] = spring(y, yVelocity, controls.open ? shift : 0, 70, 8, dt);
    world.position.y = y;
    electrons.forEach((mesh, i) => {
      mesh.visible = i < Math.min(12, element.z);
      const angle = elapsed * (0.6 + 0.12 * (i % 4)) + i * 2.1;
      if (i % 2 === 0) {
        const radius = 2.3 * spread;
        mesh.position.set(radius * Math.cos(angle), 0.08, radius * Math.sin(angle));
      } else {
        const radius = 1.75 * spread,
          tilt = i % 4 < 2 ? 0.9 : -0.9,
          x = radius * Math.cos(angle);
        mesh.position.set(x * Math.cos(tilt), 1 + x * Math.sin(tilt), radius * Math.sin(angle));
      }
    });
    camera.position.x += (controls.x * 0.08 * distance - camera.position.x) * Math.min(1, dt * 4);
    camera.position.y = distance * 0.24 + controls.y * 0.05 * distance;
    camera.position.z = distance;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(loop);
  return {
    setElement(next: Element) {
      element = next;
      skin();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      themes.disconnect();
      scheme.removeEventListener("change", theme);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      texture.dispose();
      renderer.dispose();
    },
  };
}
