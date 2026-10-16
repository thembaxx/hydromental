"use client";

/* oxlint-disable react/immutability -- R3F owns these mutable Three.js objects and uniforms; frame updates intentionally bypass React. */

import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Element } from "@/lib/elements";
import type { SceneControls } from "@/lib/atom-scene";
import { categories } from "@/lib/elements";
import { getScience } from "@/lib/science";
import { matterPhase, representativeMassNumber, type VisualMode } from "@/lib/elemental-stage";
import { ElementalStage3D } from "@/components/canvas/ElementalStage3D";
import { trackProductEvent } from "@/lib/measurement";
import type { Aura, ElementalSceneApi } from "@/lib/elemental";
import {
  createElementalUniforms,
  elementalVertexShader,
  elementalFragmentShader,
} from "@/lib/elemental-shader";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; kind?: "asset" | "renderer" },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    trackProductEvent("webgl_error", { kind: this.props.kind ?? "renderer" });
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function ElementalScene({
  aura,
  element,
  controls,
  apiRef,
  reduced,
  mode,
}: {
  aura: Aura;
  element: Element;
  controls: RefObject<SceneControls>;
  apiRef: RefObject<ElementalSceneApi | null>;
  reduced: boolean;
  mode: VisualMode;
}) {
  const { viewport, size, gl, camera, invalidate } = useThree();
  const backdrop = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, -3));
  const world = useRef<THREE.Group>(null);
  const auraMaterial = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => createElementalUniforms(), []);
  const colorA = useMemo(() => new THREE.Color(aura.color), [aura.color]);
  const colorB = useMemo(() => new THREE.Color(aura.secondary), [aura.secondary]);
  const target = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const timer = useRef(0);
  const sample = useRef({ elapsed: 0, frames: 0, reported: false });
  const science = getScience(element.z);
  const modelRadius =
    mode === "bohr"
      ? 1.05 + (science.shells.length - 1) * 0.32
      : mode === "cloud"
        ? 2.1
        : element.f === "g"
          ? 2.5
          : 1.6;
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.id = "gl";
    canvas.setAttribute(
      "aria-label",
      `Interactive ${element.n} ${mode} model. Drag to rotate; tap or use Excite atom for an energy burst.`,
    );
    apiRef.current = {
      inspect(x, y) {
        if (!world.current) return null;
        const rect = canvas.getBoundingClientRect();
        raycaster.setFromCamera(
          new THREE.Vector2(
            ((x - rect.left) / rect.width) * 2 - 1,
            (-(y - rect.top) / rect.height) * 2 + 1,
          ),
          camera,
        );
        if (
          !raycaster
            .intersectObject(world.current, true)
            .some((hit) => hit.object.name === "nucleus")
        )
          return null;
        const hit = { kind: "nucleus" as const, atomicNumber: element.z };
        controls.current.onInspect?.(hit);
        return hit;
      },
      invalidate,
      resetCamera() {
        Object.assign(controls.current, { x: 0, y: 0, spin: 0, tilt: 0, zoom: 1 });
        Object.assign(controls.current, { rotationX: 0, rotationY: 0 });
        controls.current.resetVersion = (controls.current.resetVersion ?? 0) + 1;
        invalidate();
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, gl, camera, element, aura.name, controls, raycaster, invalidate, mode]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const state = controls.current;
    if (!reduced && !state.paused) timer.current += dt;
    uniforms.uTime.value = timer.current;
    uniforms.uAspect.value = size.width / size.height;
    uniforms.uColorA.value.lerp(colorA, reduced ? 1 : 1 - Math.exp(-4 * dt));
    uniforms.uColorB.value.lerp(colorB, reduced ? 1 : 1 - Math.exp(-4 * dt));
    const touch = state.touch;
    target.set(touch?.x ?? 0.5, touch?.y ?? 0.5);
    uniforms.uTouch.value.lerp(target, 1 - Math.exp(-18 * dt));
    if (touch) touch.strength *= Math.exp(-4.5 * Math.min(delta, 1));
    uniforms.uTouchStrength.value = reduced ? 0 : (touch?.strength ?? 0);
    // R3F copies uniform containers when applying props. Write to the live materials.
    const syncUniforms = (material: THREE.Material | THREE.Material[] | null | undefined) => {
      if (!(material instanceof THREE.ShaderMaterial)) return;
      for (const name of Object.keys(uniforms) as (keyof typeof uniforms)[]) {
        if (material.uniforms[name]) material.uniforms[name].value = uniforms[name].value;
      }
    };
    syncUniforms(auraMaterial.current);
    if (world.current) {
      const scale =
        ((Math.min(viewport.width, viewport.height) * 0.34) / modelRadius) * (state.zoom ?? 1);
      world.current.scale.setScalar(scale);
      world.current.position.y = 0.15 + (reduced ? 0 : Math.sin(timer.current * 0.65) * 0.06);
    }
    if (!reduced && delta > 0 && delta < 0.25) {
      sample.current.elapsed += delta;
      sample.current.frames += 1;
      if (sample.current.elapsed >= 5) {
        const fps = sample.current.frames / sample.current.elapsed;
        if (!sample.current.reported) {
          trackProductEvent("render_sample", {
            fps: fps < 30 ? "under_30" : fps < 50 ? "30_to_49" : "50_plus",
            quality: state.quality ?? "auto",
          });
          sample.current.reported = true;
        }
        if (state.quality === "auto" && fps < 30 && gl.getPixelRatio() > 1) {
          gl.setPixelRatio(Math.max(1, gl.getPixelRatio() - 0.25));
          trackProductEvent("quality_adjusted", { quality: "low" });
        }
        sample.current.elapsed = 0;
        sample.current.frames = 0;
      }
    }
  });
  return (
    <>
      <mesh position={[0, 0, -3]} scale={[backdrop.width, backdrop.height, 1]}>
        <planeGeometry />
        <shaderMaterial
          uniforms={uniforms}
          ref={auraMaterial}
          vertexShader={elementalVertexShader}
          fragmentShader={elementalFragmentShader}
          transparent
          depthWrite={false}
        />
      </mesh>
      <group ref={world}>
        <ElementalStage3D
          atomicNumber={element.z}
          massNumber={representativeMassNumber(science.isotopes, element.z)}
          shells={science.shells}
          categoryColor={categories[element.c][1]}
          phase={matterPhase(element.f)}
          mode={mode}
          controls={controls}
          reduced={reduced}
        />
      </group>
    </>
  );
}
function ContextLifecycle({ onLost }: { onLost: (lost: boolean) => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onLost(true);
      trackProductEvent("webgl_error", { kind: "context_lost" });
    };
    const restored = () => {
      onLost(false);
      trackProductEvent("webgl_error", { kind: "context_restored" });
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, onLost]);
  return null;
}
function RenderActivity({ suspended, reduced }: { suspended: boolean; reduced: boolean }) {
  const set = useThree((state) => state.set);
  const invalidate = useThree((state) => state.invalidate);
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const sync = () => {
      const active = !suspended && !document.hidden;
      set({ frameloop: active ? (reduced ? "demand" : "always") : "never" });
      gl.domElement.dataset.renderState = active ? (reduced ? "on-demand" : "active") : "paused";
      if (!suspended && !document.hidden) invalidate();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [suspended, reduced, set, invalidate, gl]);
  return null;
}
export default function ElementalCanvas({
  aura,
  element,
  controls,
  apiRef,
  suspended,
  quality,
  mode = "bohr",
}: {
  aura: Aura;
  element: Element;
  controls: RefObject<SceneControls>;
  apiRef: RefObject<ElementalSceneApi | null>;
  suspended: boolean;
  quality: "auto" | "low" | "high";
  mode?: VisualMode;
}) {
  const reduced = useReducedMotionPreference();
  const [lost, setLost] = useState(false);
  const [visible, setVisible] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "80px",
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const fallback = (
    <div className="elemental-fallback" role="status">
      <img src={`/auras/${aura.id}.png`} alt="" width="400" height="320" />
      <span>3D is temporarily unavailable. Every element, story, and quiz is still here.</span>
    </div>
  );
  return (
    <div ref={container} className="elemental-canvas" data-aura={aura.id} data-mode={mode}>
      <SceneBoundary fallback={fallback}>
        {lost && fallback}
        <Canvas
          camera={{ position: [0, 0, 8.5], fov: 46 }}
          dpr={quality === "low" ? 1 : [1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        >
          <ContextLifecycle onLost={setLost} />
          <RenderActivity suspended={suspended || lost || !visible} reduced={reduced} />
          <Suspense fallback={null}>
            <ElementalScene
              aura={aura}
              element={element}
              controls={controls}
              apiRef={apiRef}
              reduced={reduced}
              mode={mode}
            />
          </Suspense>
          {quality !== "low" && !reduced && (
            <EffectComposer enableNormalPass={false} multisampling={0}>
              <Bloom luminanceThreshold={0.7} intensity={0.6} mipmapBlur />
            </EffectComposer>
          )}
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
