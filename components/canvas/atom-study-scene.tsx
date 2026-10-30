"use client";

/* oxlint-disable react/immutability -- Three.js objects are owned and updated by the renderer. */
import {
  Component,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { advanceModelMotion, nucleusLayout, type ModelMotion } from "@/lib/model-motion";

interface Props {
  atomicNumber: number;
  massNumber: number;
  shells: readonly number[];
  color: string;
  selectedShell: number | null;
  motion: RefObject<ModelMotion>;
  still: boolean;
  onReady: (invalidate: () => void) => void;
}

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Shell({
  index,
  count,
  color,
  selected,
  motion,
}: {
  index: number;
  count: number;
  color: string;
  selected: boolean | null;
  motion: RefObject<ModelMotion>;
}) {
  const ring = useRef<THREE.Group>(null);
  const electrons = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const radius = 1.02 + index * 0.31;
  useFrame(() => {
    const state = motion.current;
    if (ring.current)
      ring.current.scale.setScalar(
        1 + state.spread.value * (0.14 + index * 0.035) + state.pulse.value * 0.08,
      );
    if (!electrons.current) return;
    const angle = (state.time * (index % 2 ? -0.32 : 0.4)) / (1 + index * 0.32);
    for (let i = 0; i < count; i++) {
      const theta = angle + (i / count) * Math.PI * 2;
      dummy.position.set(Math.cos(theta) * radius, Math.sin(theta) * radius, 0);
      dummy.updateMatrix();
      electrons.current.setMatrixAt(i, dummy.matrix);
    }
    electrons.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group rotation={[0.48 + index * 0.29, -0.4 + index * 0.76, index * 0.12]}>
      <group ref={ring}>
        <mesh>
          <torusGeometry args={[radius, selected ? 0.012 : 0.006, 8, 128]} />
          <meshStandardMaterial
            color={selected === false ? "#48575d" : color}
            metalness={0.45}
            roughness={0.28}
            transparent
            opacity={selected === false ? 0.28 : 0.65}
          />
        </mesh>
        {selected === true && (
          <mesh>
            <torusGeometry args={[radius, 0.029, 8, 96]} />
            <meshBasicMaterial color={color} transparent opacity={0.23} depthWrite={false} />
          </mesh>
        )}
        <instancedMesh ref={electrons} args={[undefined, undefined, count]} frustumCulled={false}>
          <sphereGeometry args={[selected ? 0.067 : 0.048, 16, 12]} />
          <meshPhysicalMaterial
            color={selected === false ? "#78858a" : "#effff9"}
            emissive={color}
            emissiveIntensity={selected === false ? 0.05 : 0.5}
            roughness={0.16}
            metalness={0.2}
            clearcoat={1}
          />
        </instancedMesh>
      </group>
    </group>
  );
}

function StudyAtom({
  atomicNumber,
  massNumber,
  shells,
  color,
  selectedShell,
  motion,
  still,
  onReady,
}: Props) {
  const { viewport, gl, scene, invalidate } = useThree();
  const body = useRef<THREE.Group>(null);
  const core = useRef<THREE.InstancedMesh>(null);
  const layout = useMemo(() => nucleusLayout(atomicNumber, massNumber), [atomicNumber, massNumber]);
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    room.dispose();
    generator.dispose();
    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, scene]);
  useLayoutEffect(() => {
    const mesh = core.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const proton = new THREE.Color(color);
    const neutron = new THREE.Color("#d7e2db");
    layout.particles.forEach((particle, i) => {
      dummy.position.fromArray(particle.position);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, particle.proton ? proton : neutron);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    invalidate();
  }, [layout, color, invalidate]);
  useEffect(() => {
    onReady(invalidate);
    invalidate();
  }, [onReady, invalidate, selectedShell, still]);
  useFrame((_, delta) => {
    advanceModelMotion(motion.current, delta, still);
    if (!body.current) return;
    const state = motion.current;
    const radius = 1.15 + (shells.length - 1) * 0.31;
    const fit = (Math.min(viewport.width, viewport.height) * 0.32) / radius;
    body.current.scale.setScalar(fit * state.zoom.value * (1 + state.pulse.value * 0.035));
    body.current.rotation.set(state.x, state.y, 0);
    if (core.current) {
      core.current.rotation.set(state.time * 0.035, -state.time * 0.06, 0);
      core.current.scale.setScalar(1 + state.pulse.value * 0.1);
    }
  });
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[-3, 5, 5]} color="#fff5df" intensity={2.8} />
      <directionalLight position={[4, -1, -2]} color="#80bdbf" intensity={2} />
      <pointLight position={[0, 2, 3]} color={color} intensity={5} />
      <group ref={body}>
        <instancedMesh ref={core} args={[undefined, undefined, layout.particles.length]}>
          <sphereGeometry args={[layout.radius, 24, 20]} />
          <meshPhysicalMaterial
            roughness={0.22}
            metalness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.12}
          />
        </instancedMesh>
        {shells.map((count, index) => (
          <Shell
            key={index}
            index={index}
            count={count}
            color={color}
            selected={selectedShell === null ? null : selectedShell === index + 1}
            motion={motion}
          />
        ))}
      </group>
    </>
  );
}

function RenderActivity({
  still,
  visible,
  onLost,
}: {
  still: boolean;
  visible: boolean;
  onLost: (lost: boolean) => void;
}) {
  const { gl, set, invalidate } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const sync = () => {
      const active = visible && !document.hidden;
      set({ frameloop: active ? (still ? "demand" : "always") : "never" });
      canvas.dataset.renderState = active ? (still ? "on-demand" : "active") : "paused";
      if (active) invalidate();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      onLost(true);
      set({ frameloop: "never" });
    };
    const restored = () => {
      onLost(false);
      sync();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, set, invalidate, visible, still, onLost]);
  return null;
}

export default function AtomStudyScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [lost, setLost] = useState(false);
  useEffect(() => {
    if (!host.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const fallback = (
    <p className="atom-study-fallback" role="status">
      3D is unavailable on this device. The shell counts and element reference remain available
      below.
    </p>
  );
  return (
    <div className="atom-study-renderer" ref={host}>
      <SceneBoundary fallback={fallback}>
        {lost && fallback}
        <Canvas
          camera={{ position: [0, 0, 8], fov: 38 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          fallback={fallback}
        >
          <RenderActivity still={props.still} visible={visible && !lost} onLost={setLost} />
          <StudyAtom {...props} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
