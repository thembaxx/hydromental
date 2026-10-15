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
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Element } from "@/lib/elements";
import type { SceneControls } from "@/lib/atom-scene";
import { prepareElementalModel } from "@/lib/elemental-model";
import { elementalAssets } from "@/lib/elemental";
import { trackProductEvent } from "@/lib/measurement";
import type { ElementalAsset, Aura, ElementalSceneApi } from "@/lib/elemental";
import {
  createElementalUniforms,
  elementalVertexShader,
  elementalFragmentShader,
  coreVertexShader,
  coreFragmentShader,
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
function ModelAsset({
  asset,
  uniforms,
  controls,
  reduced,
}: {
  asset: ElementalAsset;
  uniforms: ReturnType<typeof createElementalUniforms>;
  controls: RefObject<SceneControls>;
  reduced: boolean;
}) {
  const { scene, animations } = useLoader(GLTFLoader, asset.path);
  const model = useMemo(() => {
    const material =
      asset.material === "procedural"
        ? new THREE.ShaderMaterial({
            uniforms,
            vertexShader: coreVertexShader,
            fragmentShader: coreFragmentShader,
          })
        : undefined;
    const prepared = prepareElementalModel(scene, material);
    material?.dispose();
    return prepared;
  }, [scene, asset.material, uniforms]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model.scene), [model]);
  useEffect(() => {
    const clip = asset.animation
      ? animations.find((item) => item.name === asset.animation)
      : animations[0];
    if (clip) mixer.clipAction(clip).play();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model.scene);
    };
  }, [asset.animation, animations, mixer, model]);
  useEffect(() => () => model.dispose(), [model]);
  useFrame((_, delta) => {
    if (!reduced && !controls.current.paused) mixer.update(Math.min(delta, 0.05));
  });
  return <primitive object={model.root} dispose={null} />;
}
function ElementalScene({
  aura,
  element,
  controls,
  apiRef,
  reduced,
}: {
  aura: Aura;
  element: Element;
  controls: RefObject<SceneControls>;
  apiRef: RefObject<ElementalSceneApi | null>;
  reduced: boolean;
}) {
  const { viewport, size, gl, camera } = useThree();
  const backdrop = viewport.getCurrentViewport(camera, new THREE.Vector3(0, 0, -3));
  const world = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const auraMaterial = useRef<THREE.ShaderMaterial>(null);
  const electrons = useRef<THREE.Group>(null);
  const uniforms = useMemo(() => createElementalUniforms(), []);
  const colorA = useMemo(() => new THREE.Color(aura.color), [aura.color]);
  const colorB = useMemo(() => new THREE.Color(aura.secondary), [aura.secondary]);
  const target = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const timer = useRef(0);
  const sample = useRef({ elapsed: 0, frames: 0, reported: false });
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.id = "gl";
    canvas.setAttribute(
      "aria-label",
      `Interactive ${element.n} atom with ${aura.name} aura. Swipe to explore; use Element details to learn more.`,
    );
    apiRef.current = {
      inspect(x, y) {
        if (!core.current) return null;
        const rect = canvas.getBoundingClientRect();
        raycaster.setFromCamera(
          new THREE.Vector2(
            ((x - rect.left) / rect.width) * 2 - 1,
            (-(y - rect.top) / rect.height) * 2 + 1,
          ),
          camera,
        );
        if (!raycaster.intersectObject(core.current, true).length) return null;
        const hit = { kind: "nucleus" as const, atomicNumber: element.z };
        controls.current.onInspect?.(hit);
        return hit;
      },
      resetCamera() {
        Object.assign(controls.current, { x: 0, y: 0, spin: 0, tilt: 0, zoom: 1 });
        if (core.current) core.current.rotation.set(0, 0, 0);
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, gl, camera, element, aura.name, controls, raycaster]);
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
    core.current?.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (Array.isArray(node.material)) node.material.forEach(syncUniforms);
        else syncUniforms(node.material);
      }
    });
    syncUniforms(auraMaterial.current);
    if (world.current) {
      const scale = (size.width < 600 ? 0.88 : 1) * (state.zoom ?? 1);
      world.current.scale.setScalar(scale);
      world.current.position.y = 0.15 + (reduced ? 0 : Math.sin(timer.current * 0.65) * 0.06);
    }
    if (core.current && !reduced) {
      core.current.rotation.y += dt * (0.1 + state.spin * 0.15);
      core.current.rotation.x = state.tilt;
      state.spin *= Math.exp(-3 * dt);
      state.tilt *= Math.exp(-3 * dt);
    }
    if (electrons.current) {
      const spread = state.spread || state.hold ? 1.3 : 1;
      electrons.current.scale.setScalar(
        THREE.MathUtils.damp(electrons.current.scale.x, spread, 5, dt),
      );
      electrons.current.children.forEach((child, i) => {
        const angle = timer.current * (0.12 + i * 0.015) + i * Math.PI * 0.68;
        child.position.set(Math.cos(angle) * 2.05, Math.sin(angle) * 0.6, Math.sin(angle) * 1.4);
      });
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
  const material = (
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={coreVertexShader}
      fragmentShader={coreFragmentShader}
    />
  );
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
        <group ref={core}>
          <Suspense
            fallback={
              <mesh>
                <sphereGeometry args={[1.25, 48, 32]} />
                {material}
              </mesh>
            }
          >
            <SceneBoundary
              key={aura.id}
              kind="asset"
              fallback={
                <mesh>
                  <sphereGeometry args={[1.25, 48, 32]} />
                  {material}
                </mesh>
              }
            >
              <ModelAsset
                asset={elementalAssets[aura.id]}
                uniforms={uniforms}
                controls={controls}
                reduced={reduced}
              />
            </SceneBoundary>
          </Suspense>
        </group>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.38, i * 0.42, i * 0.65]}>
            <torusGeometry args={[1.9 + i * 0.16, 0.006, 6, 160]} />
            <meshBasicMaterial color={aura.color} transparent opacity={0.18 + i * 0.07} />
          </mesh>
        ))}
        <group ref={electrons}>
          {Array.from({ length: Math.min(8, element.z) }, (_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[i % 3 === 0 ? 0.038 : 0.021, 12, 8]} />
              <meshBasicMaterial color={aura.color} toneMapped={false} />
            </mesh>
          ))}
        </group>
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
}: {
  aura: Aura;
  element: Element;
  controls: RefObject<SceneControls>;
  apiRef: RefObject<ElementalSceneApi | null>;
  suspended: boolean;
  quality: "auto" | "low" | "high";
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
    <div ref={container} className="elemental-canvas" data-aura={aura.id}>
      <SceneBoundary fallback={fallback}>
        {lost && fallback}
        <Canvas
          camera={{ position: [0, 0, 7], fov: 42 }}
          dpr={quality === "low" ? 1 : [1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        >
          <ContextLifecycle onLost={setLost} />
          <RenderActivity suspended={suspended || lost || !visible} reduced={reduced} />
          <ElementalScene
            aura={aura}
            element={element}
            controls={controls}
            apiRef={apiRef}
            reduced={reduced}
          />
          {quality === "high" && !reduced && (
            <EffectComposer multisampling={0}>
              <Bloom luminanceThreshold={0.7} intensity={0.6} mipmapBlur />
            </EffectComposer>
          )}
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
