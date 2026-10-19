"use client";

/* oxlint-disable react/immutability -- Three.js objects belong to the frame loop. */
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { advanceSpring, type ModelMotion } from "@/lib/model-motion";
import { projectile, projectileAt, type ProjectileSetup, type forceBalance } from "@/lib/physics";

interface Props {
  mode: "projectile" | "forces";
  setup: ProjectileSetup;
  time: number;
  forces: ReturnType<typeof forceBalance>;
  view: RefObject<ModelMotion>;
  reduced: boolean;
  visible: boolean;
  onReady: (callback: () => void) => void;
}

class PhysicsBoundary extends Component<
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

function Arrow({
  direction,
  length,
  color,
  position,
}: {
  direction: [number, number, number];
  length: number;
  color: string;
  position: [number, number, number];
}) {
  const rotation = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(...direction).normalize(),
      ),
    [direction],
  );
  if (length < 0.001) return null;
  const tip = Math.min(0.22, length * 0.4);
  return (
    <group position={position} quaternion={rotation}>
      <mesh position={[0, (length - tip) / 2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, Math.max(0.001, length - tip), 12]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.25} />
      </mesh>
      <mesh position={[0, length - tip / 2, 0]}>
        <coneGeometry args={[tip * 0.45, tip, 18]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.25} />
      </mesh>
    </group>
  );
}

function Flight({ setup, time }: { setup: ProjectileSetup; time: number }) {
  const result = projectile(setup);
  const state = projectileAt(setup, time);
  const scale = Math.min(8 / Math.max(5, result.range), 5 / Math.max(5, result.maxHeight));
  const offset = (-result.range * scale) / 2;
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const summary = projectile(setup);
    for (let i = 0; i < 80; i++) {
      const a = projectileAt(setup, (summary.duration * i) / 80);
      const b = projectileAt(setup, (summary.duration * (i + 1)) / 80);
      points.push(new THREE.Vector3(offset + a.x * scale, -2.5 + a.y * scale, 0));
      points.push(new THREE.Vector3(offset + b.x * scale, -2.5 + b.y * scale, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [setup, scale, offset]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <lineSegments geometry={geometry}>
        <lineBasicMaterial color="#80d8c3" transparent opacity={0.7} />
      </lineSegments>
      <mesh position={[offset + state.x * scale, -2.5 + state.y * scale, 0]}>
        <sphereGeometry args={[0.22, 32, 24]} />
        <meshPhysicalMaterial color="#f3c36d" roughness={0.2} metalness={0.32} clearcoat={1} />
      </mesh>
      <mesh position={[offset, -2.69, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.24, 48]} />
        <meshBasicMaterial color="#85b7a7" side={THREE.DoubleSide} />
      </mesh>
      <gridHelper position={[0, -2.7, 0]} args={[12, 12, "#365c57", "#203d39"]} />
      <mesh position={[0, -2.73, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color="#0e221d" />
      </mesh>
    </>
  );
}

function FreeBody({ forces }: { forces: Props["forces"] }) {
  const scale = 2.1 / Math.max(forces.weight, forces.right, forces.left, 1);
  return (
    <>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshPhysicalMaterial color="#dce6df" roughness={0.25} metalness={0.15} clearcoat={1} />
      </mesh>
      <Arrow
        position={[0.5, 0, 0]}
        direction={[1, 0, 0]}
        length={forces.right * scale}
        color="#efc56d"
      />
      <Arrow
        position={[-0.5, 0, 0]}
        direction={[-1, 0, 0]}
        length={forces.left * scale}
        color="#ee8b8c"
      />
      <Arrow
        position={[0, 0.5, 0]}
        direction={[0, 1, 0]}
        length={forces.normal * scale}
        color="#7ad3c0"
      />
      <Arrow
        position={[0, -0.5, 0]}
        direction={[0, -1, 0]}
        length={forces.weight * scale}
        color="#82b5ff"
      />
      <gridHelper position={[0, -3, 0]} args={[12, 12, "#365c57", "#203d39"]} />
    </>
  );
}

function Model(props: Props) {
  const { gl, scene, invalidate } = useThree();
  const { onReady, mode, setup, time, forces, reduced } = props;
  const root = useRef<THREE.Group>(null);
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    generator.dispose();
    room.dispose();
    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, scene]);
  useEffect(() => {
    onReady(invalidate);
    invalidate();
  }, [onReady, mode, setup, time, forces, reduced, invalidate]);
  useFrame((_, delta) => {
    if (!root.current) return;
    const state = props.view.current;
    if (props.reduced) {
      state.zoom.value = state.zoom.target;
      state.zoom.velocity = 0;
    } else advanceSpring(state.zoom, delta);
    root.current.rotation.set(state.x, state.y, 0);
    root.current.scale.setScalar(state.zoom.value);
    if (Math.abs(state.zoom.value - state.zoom.target) + Math.abs(state.zoom.velocity) > 0.0001)
      invalidate();
  });
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-4, 5, 5]} color="#fff0d4" intensity={2.5} />
      <directionalLight position={[4, 1, -2]} color="#91cfd2" intensity={2} />
      <group ref={root}>
        {props.mode === "projectile" ? (
          <Flight setup={props.setup} time={props.time} />
        ) : (
          <FreeBody forces={props.forces} />
        )}
      </group>
    </>
  );
}

function Activity({ visible, onLost }: { visible: boolean; onLost: (value: boolean) => void }) {
  const { gl, set, invalidate } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const sync = () => {
      const active = visible && !document.hidden;
      set({ frameloop: active ? "demand" : "never" });
      canvas.dataset.renderState = active ? "on-demand" : "paused";
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
  }, [gl, set, invalidate, visible, onLost]);
  return null;
}

export default function PhysicsScene(props: Props) {
  const [lost, setLost] = useState(false);
  const fallback = (
    <p className="physics-scene-message" role="status">
      3D is unavailable. You can still adjust every parameter and use the equations and numerical
      results.
    </p>
  );
  return (
    <PhysicsBoundary fallback={fallback}>
      {lost && fallback}
      <Canvas
        camera={{ position: [0, 0.4, 12], fov: 39 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        fallback={fallback}
      >
        <Activity visible={props.visible && !lost} onLost={setLost} />
        <Model {...props} />
      </Canvas>
    </PhysicsBoundary>
  );
}
