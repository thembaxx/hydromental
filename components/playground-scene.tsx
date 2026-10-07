"use client";

import { useEffect, useImperativeHandle, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { elements, categories } from "@/lib/elements";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import type { ModelAtom, ModelBond } from "@/lib/playground";

export interface SceneHandle {
  pickAt: (x: number, y: number) => number | null;
}
interface Props {
  atoms: ModelAtom[];
  bonds: ModelBond[];
  title: string;
  note: string;
  api: RefObject<SceneHandle | null>;
  onPick: (index: number) => void;
  onDrop?: (index: number, z: number) => void;
  paused: boolean;
  quality: "auto" | "low" | "high";
}
export function PlaygroundScene({
  atoms,
  bonds,
  title,
  note,
  api,
  onPick,
  onDrop,
  paused,
  quality,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const pick = useRef<SceneHandle["pickAt"]>(() => null);
  useImperativeHandle(api, () => ({ pickAt: (x, y) => pick.current(x, y) }), []);
  const latest = useRef({ atoms, bonds, onPick, onDrop, paused });
  const rebuild = useRef<(() => void) | null>(null);
  const controls = useRef<{
    zoom: (delta: number) => void;
    reset: () => void;
    rotate: (delta: number) => void;
  } | null>(null);
  const [fallback, setFallback] = useState(false);
  const reduced = useReducedMotionPreference();
  const reducedRef = useRef(reduced);
  useEffect(() => {
    reducedRef.current = reduced;
  }, [reduced]);
  useEffect(() => {
    latest.current = { atoms, bonds, onPick, onDrop, paused };
  }, [atoms, bonds, onPick, onDrop, paused]);
  useEffect(() => {
    rebuild.current?.();
  }, [atoms, bonds]);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: quality !== "low",
        powerPreference: "low-power",
      });
    } catch {
      // The WebGL capability result arrives after DOM hydration.
      queueMicrotask(() => setFallback(true));
      return;
    }
    queueMicrotask(() => setFallback(false));
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    node.append(canvas);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === "low" ? 1 : 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 7;
    const group = new THREE.Group();
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(3, 4, 6);
    scene.add(light);
    const ray = new THREE.Raycaster();
    const point = new THREE.Vector2();
    let dirty = true;
    let contextLost = false;
    let previous: Array<{ z: number; ghost?: boolean }> = [];
    let meshes: THREE.Mesh[] = [];
    let width = 1,
      height = 1;
    function disposeModel() {
      group.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          item.geometry.dispose();
          const mats = Array.isArray(item.material) ? item.material : [item.material];
          mats.forEach((mat) => mat.dispose());
        }
      });
      group.clear();
      meshes = [];
    }
    function build() {
      dirty = true;
      disposeModel();
      const noir = document.documentElement.dataset.theme === "noir";
      latest.current.atoms.forEach((atom, i) => {
        const color = noir
          ? atom.kind === "electron"
            ? "#eeeeee"
            : atom.kind === "neutron"
              ? "#777777"
              : "#bbbbbb"
          : atom.kind === "proton"
            ? "#cf5866"
            : atom.kind === "neutron"
              ? "#a4afc3"
              : atom.kind === "electron"
                ? "#5e85c8"
                : categories[elements[Math.max(1, atom.z) - 1].c][1];
        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.35,
          metalness: 0.12,
          transparent: !!atom.ghost,
          opacity: atom.ghost ? 0.2 : 1,
          wireframe: !!atom.ghost,
        });
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(atom.kind ? 0.11 : atom.z === 1 ? 0.27 : 0.39, 24, 16),
          material,
        );
        if (
          !atom.ghost &&
          (previous[i]?.ghost || (previous[i] && previous[i].z !== atom.z)) &&
          !latest.current.paused &&
          !reducedRef.current
        )
          mesh.scale.setScalar(0.55);
        mesh.position.fromArray(atom.position);
        mesh.userData.index = i;
        group.add(mesh);
        meshes.push(mesh);
      });
      previous = latest.current.atoms.map((atom) => ({ z: atom.z, ghost: atom.ghost }));
      latest.current.bonds.forEach((bond) => {
        const a = new THREE.Vector3(...latest.current.atoms[bond.a].position);
        const b = new THREE.Vector3(...latest.current.atoms[bond.b].position);
        const delta = b.clone().sub(a);
        const center = a.clone().add(b).multiplyScalar(0.5);
        const perpendicular = delta.clone().cross(new THREE.Vector3(0, 0, 1));
        if (perpendicular.length() < 0.01) perpendicular.set(1, 0, 0);
        perpendicular.normalize();
        for (let n = 0; n < (bond.order ?? 1); n++) {
          const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.045, delta.length(), 10),
            new THREE.MeshStandardMaterial({ color: noir ? "#aaaaaa" : "#8c9bb6", roughness: 0.6 }),
          );
          mesh.position
            .copy(center)
            .addScaledVector(perpendicular, (n - ((bond.order ?? 1) - 1) / 2) * 0.15);
          mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize());
          group.add(mesh);
        }
      });
    }
    rebuild.current = build;
    build();
    const observer = new MutationObserver(build);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    function resize() {
      width = Math.max(1, node!.clientWidth);
      height = Math.max(1, node!.clientHeight);
      dirty = true;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    const size = new ResizeObserver(resize);
    size.observe(node);
    resize();
    function pickAt(x: number, y: number) {
      const bounds = canvas.getBoundingClientRect();
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null;
      point.set(
        ((x - bounds.left) / bounds.width) * 2 - 1,
        (-(y - bounds.top) / bounds.height) * 2 + 1,
      );
      group.updateMatrixWorld();
      ray.setFromCamera(point, camera);
      const hit = ray.intersectObjects(meshes)[0];
      if (hit) return hit.object.userData.index as number;
      let best: number | null = null;
      let distance = 40;
      meshes.forEach((mesh, i) => {
        const p = mesh.getWorldPosition(new THREE.Vector3()).project(camera);
        const d = Math.hypot(
          ((p.x + 1) * width) / 2 + bounds.left - x,
          ((1 - p.y) * height) / 2 + bounds.top - y,
        );
        if (d < distance) {
          best = i;
          distance = d;
        }
      });
      return best;
    }
    pick.current = pickAt;
    controls.current = {
      zoom(delta) {
        dirty = true;
        camera.position.z = THREE.MathUtils.clamp(camera.position.z + delta, 4, 12);
      },
      rotate(delta) {
        dirty = true;
        group.rotation.y += delta;
      },
      reset() {
        dirty = true;
        group.rotation.set(0, 0, 0);
        camera.position.z = 7;
      },
    };
    const pointers = new Map<number, { x: number; y: number }>();
    let moved = false;
    let startX = 0,
      startY = 0;
    const down = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        startX = event.clientX;
        startY = event.clientY;
        moved = false;
      } else moved = true;
    };
    const move = (event: PointerEvent) => {
      dirty = true;
      const old = pointers.get(event.pointerId);
      if (!old) return;
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 6) moved = true;
      if (pointers.size === 2) {
        const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)![1];
        const before = Math.hypot(old.x - other.x, old.y - other.y);
        const after = Math.hypot(event.clientX - other.x, event.clientY - other.y);
        controls.current?.zoom((before - after) * 0.015);
      } else {
        group.rotation.y += (event.clientX - old.x) * 0.008;
        group.rotation.x += (event.clientY - old.y) * 0.008;
      }
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    };
    const up = (event: PointerEvent) => {
      if (!moved && pointers.size === 1 && event.type !== "pointercancel") {
        const picked = pickAt(event.clientX, event.clientY);
        if (picked !== null) latest.current.onPick(picked);
      }
      pointers.delete(event.pointerId);
    };
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      controls.current?.zoom(event.deltaY * 0.01);
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      setFallback(true);
    };
    const restored = () => {
      contextLost = false;
      dirty = true;
      setFallback(false);
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    let frame = 0,
      last = 0;
    const render = (time: number) => {
      frame = requestAnimationFrame(render);
      if (contextLost || document.hidden || time - last < (quality === "low" ? 50 : 30)) return;
      if (
        !dirty &&
        !meshes.some((mesh) => mesh.scale.x < 0.999) &&
        (latest.current.paused || reducedRef.current) &&
        !pointers.size
      )
        return;
      dirty = false;
      const elapsed = Math.min(50, time - last);
      last = time;
      for (const mesh of meshes)
        if (mesh.scale.x < 1)
          mesh.scale.setScalar(
            latest.current.paused || reducedRef.current
              ? 1
              : Math.min(1, mesh.scale.x + elapsed * 0.003),
          );
      if (!latest.current.paused && !reducedRef.current && !pointers.size)
        group.rotation.y += elapsed * 0.00007;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      size.disconnect();
      observer.disconnect();
      pick.current = () => null;
      controls.current = null;
      rebuild.current = null;
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      disposeModel();
      renderer.dispose();
      canvas.remove();
    };
  }, [quality]);
  return (
    <figure className="game-model">
      <div
        className="game-canvas"
        ref={host}
        data-renderer={fallback ? "fallback" : "three"}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const z = Number(e.dataTransfer.getData("application/element"));
          const index = api.current?.pickAt(e.clientX, e.clientY);
          if (index != null && Number.isInteger(z) && z >= 1 && z <= 118) onDrop?.(index, z);
        }}
      >
        {fallback && (
          <div className="game-model-fallback">
            <Icon name="spread" />
            <p>3D rendering is unavailable. All controls and challenges still work below.</p>
          </div>
        )}
      </div>
      <figcaption>
        <strong>{title}</strong>
        <span>{note}</span>
      </figcaption>
      <div className="game-camera-tools">
        <Button
          variant="unstyled"
          className="icon-button"
          disabled={fallback}
          aria-label="Rotate model left"
          onClick={() => controls.current?.rotate(-0.4)}
        >
          <Icon name="previous" />
        </Button>
        <Button
          variant="unstyled"
          className="icon-button"
          disabled={fallback}
          aria-label="Rotate model right"
          onClick={() => controls.current?.rotate(0.4)}
        >
          <Icon name="next" />
        </Button>
        <Button
          variant="unstyled"
          className="icon-button"
          disabled={fallback}
          aria-label="Zoom in"
          onClick={() => controls.current?.zoom(-0.7)}
        >
          <Icon name="zoomIn" />
        </Button>
        <Button
          variant="unstyled"
          className="icon-button"
          disabled={fallback}
          aria-label="Zoom out"
          onClick={() => controls.current?.zoom(0.7)}
        >
          <Icon name="zoomOut" />
        </Button>
        <Button
          variant="unstyled"
          className="icon-button"
          disabled={fallback}
          aria-label="Reset view"
          onClick={() => controls.current?.reset()}
        >
          <Icon name="rotate" />
        </Button>
      </div>
    </figure>
  );
}
