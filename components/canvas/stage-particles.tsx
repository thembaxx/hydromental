"use client";

/* oxlint-disable react/immutability -- Mutable Three.js instances belong to the R3F render loop. */
import { useCallback, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MatterPhase } from "@/lib/elemental-stage";

export function BohrShellRing({
  index,
  count,
  radius,
  color,
  excitement,
  reduced,
}: {
  index: number;
  count: number;
  radius: number;
  color: THREE.Color;
  excitement: RefObject<number>;
  reduced: boolean;
}) {
  const orbit = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (orbit.current && !reduced)
      orbit.current.rotation.z +=
        (Math.min(delta, 0.05) * (1 + excitement.current * 4) * (index % 2 ? -1 : 1)) / (index + 1);
  });
  return (
    <group rotation={[0.3 + index * 0.2, index * 0.65, 0]}>
      <mesh>
        <torusGeometry args={[radius, 0.008, 6, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.38} />
      </mesh>
      <group ref={orbit}>
        {Array.from({ length: count }, (_, i) => {
          const angle = (i / count) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}>
              <sphereGeometry args={[0.042, 10, 8]} />
              <meshStandardMaterial
                color="white"
                emissive={color}
                emissiveIntensity={3}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function MatterLattice({
  phase,
  color,
  atomicNumber,
  reduced,
}: {
  phase: MatterPhase;
  color: THREE.Color;
  atomicNumber: number;
  reduced: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const time = useRef(0);
  const spacing = phase === "gas" ? 1.25 : phase === "liquid" ? 0.62 : 0.72;
  const fill = useCallback(
    (elapsed: number) => {
      if (!mesh.current) return;
      for (let i = 0; i < 27; i++) {
        const seed = i * 2.39996 + atomicNumber;
        const jitter = phase === "gas" ? 0.28 : phase === "liquid" ? 0.16 : 0;
        dummy.position.set(
          ((i % 3) - 1) * spacing + Math.sin(seed + elapsed) * jitter,
          ((Math.floor(i / 3) % 3) - 1) * spacing + Math.cos(seed * 1.3 + elapsed * 0.8) * jitter,
          (Math.floor(i / 9) - 1) * spacing + Math.sin(seed * 1.7 + elapsed * 0.6) * jitter,
        );
        dummy.scale.setScalar(phase === "gas" ? 0.6 : 1);
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
      mesh.current.instanceMatrix.needsUpdate = true;
      mesh.current.computeBoundingSphere();
    },
    [phase, atomicNumber, spacing, dummy],
  );
  useLayoutEffect(() => {
    fill(0);
  }, [fill]);
  useFrame((_, delta) => {
    if (reduced || phase === "solid" || phase === "unknown") return;
    time.current += Math.min(delta, 0.05);
    fill(time.current);
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 27]}>
      <sphereGeometry args={[0.22, 16, 12]} />
      <meshPhysicalMaterial
        color={color}
        metalness={phase === "solid" ? 0.8 : 0.1}
        roughness={phase === "liquid" ? 0.06 : 0.25}
        clearcoat={1}
        transmission={phase === "gas" ? 0.6 : phase === "liquid" ? 0.15 : 0}
        transparent={phase === "gas"}
        opacity={phase === "gas" ? 0.55 : 1}
        wireframe={phase === "unknown"}
      />
    </instancedMesh>
  );
}
