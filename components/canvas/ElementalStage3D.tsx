"use client";

/* oxlint-disable react/immutability -- Three.js scene objects are mutated by the render loop, outside React state. */
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { cloudPositions, type MatterPhase, type VisualMode } from "@/lib/elemental-stage";
import type { SceneControls } from "@/lib/atom-scene";
import { BohrShellRing, MatterLattice } from "./stage-particles";

export type { VisualMode } from "@/lib/elemental-stage";
export interface ElementalStageProps {
  atomicNumber: number;
  massNumber: number;
  shells: number[];
  categoryColor: string;
  phase: MatterPhase;
  mode: VisualMode;
  reduced: boolean;
  controls: RefObject<SceneControls>;
}

/** Host pointer gestures feed SceneControls; all modes share the same inertial body. */
export function ElementalStage3D({
  atomicNumber,
  massNumber,
  shells,
  categoryColor,
  phase,
  mode,
  reduced,
  controls,
}: ElementalStageProps) {
  const root = useRef<THREE.Group>(null);
  const nucleus = useRef<THREE.InstancedMesh>(null);
  const cloud = useRef<THREE.Points>(null);
  const excitement = useRef(0);
  const time = useRef(0);
  const lastReset = useRef(0);
  const color = useMemo(() => new THREE.Color(categoryColor), [categoryColor]);
  const positions = useMemo(
    () => cloudPositions(atomicNumber, shells.length),
    [atomicNumber, shells.length],
  );
  const count = Math.max(atomicNumber, massNumber);

  useEffect(() => {
    const mesh = nucleus.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const neutron = new THREE.Color("#647584");
    // Fill a sphere from the inside out; actual proton and representative neutron counts.
    const candidates: THREE.Vector3[] = [];
    for (let x = -5; x <= 5; x++)
      for (let y = -5; y <= 5; y++)
        for (let z = -5; z <= 5; z++) {
          candidates.push(new THREE.Vector3(x + (y % 2) * 0.5, y * 0.87, z));
        }
    candidates.sort((a, b) => a.lengthSq() - b.lengthSq());
    for (let i = 0; i < count; i++) {
      dummy.position.copy(candidates[i]).multiplyScalar(0.15);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, i < atomicNumber ? color : neutron);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [atomicNumber, count, color]);

  useEffect(() => {
    if (!root.current) return;
    if (reduced) {
      root.current.scale.setScalar(1);
      return;
    }
    const tween = gsap.fromTo(
      root.current.scale,
      { x: 0.78, y: 0.78, z: 0.78 },
      { x: 1, y: 1, z: 1, duration: 0.65, ease: "elastic.out(1, 0.65)", overwrite: true },
    );
    return () => {
      tween.kill();
    };
  }, [atomicNumber, mode, reduced]);

  useFrame((_, delta) => {
    const group = root.current;
    if (!group) return;
    const dt = Math.min(delta, 0.05);
    const state = controls.current;
    if (lastReset.current !== (state.resetVersion ?? 0)) {
      group.rotation.set(0, 0, 0);
      lastReset.current = state.resetVersion ?? 0;
    }
    if (reduced) {
      group.rotation.set(state.rotationX ?? 0, state.rotationY ?? 0, 0);
      group.position.y = 0;
      group.scale.setScalar(state.spread || state.hold ? 1.25 : 1);
      excitement.current = 0;
      state.bounce = 0;
      return;
    }
    time.current += dt;
    if (state.bounce < 0) {
      excitement.current = 1;
      state.bounce = 0;
    }
    excitement.current *= Math.exp(-3 * dt);
    group.rotation.y += (0.18 + state.spin + excitement.current * 2.4) * dt;
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, state.tilt, 8, dt);
    if (!state.dragging) {
      state.spin *= Math.exp(-2.5 * dt);
      state.tilt *= Math.exp(-0.6 * dt);
    }
    const spread = state.spread || state.hold ? 1.25 : 1;
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, spread, 6, dt));
    group.position.y = Math.sin(time.current * 1.2) * 0.06;
    if (cloud.current) {
      cloud.current.rotation.y -= dt * (0.3 + excitement.current);
      cloud.current.rotation.z = Math.sin(time.current * 0.4) * 0.2;
      const attribute = cloud.current.geometry.getAttribute("position");
      const live = attribute.array;
      for (let i = 0; i < positions.length; i += 3) {
        const angle = Math.sin(time.current * 0.6 + positions[i + 1] * 2) * 0.12;
        live[i] = positions[i] * Math.cos(angle) - positions[i + 2] * Math.sin(angle);
        live[i + 2] = positions[i] * Math.sin(angle) + positions[i + 2] * Math.cos(angle);
      }
      attribute.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 4]} intensity={2.5} />
      <pointLight color={color} intensity={4} position={[-2, 1, 3]} />
      <group ref={root}>
        <instancedMesh
          ref={nucleus}
          name="nucleus"
          args={[undefined, undefined, count]}
          visible={mode !== "matter"}
        >
          <sphereGeometry args={[0.085, 12, 10]} />
          <meshPhysicalMaterial
            roughness={0.24}
            metalness={0.25}
            clearcoat={1}
            emissive={color}
            emissiveIntensity={0.25}
          />
        </instancedMesh>
        {mode === "bohr" &&
          shells.map((electrons, index) => (
            <BohrShellRing
              key={index}
              index={index}
              count={electrons}
              radius={0.95 + index * 0.32}
              color={color}
              excitement={excitement}
              reduced={reduced}
            />
          ))}
        {mode === "cloud" && (
          <points ref={cloud}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[positions.slice(), 3]} />
            </bufferGeometry>
            <pointsMaterial
              color={color}
              size={0.035}
              transparent
              opacity={0.65}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </points>
        )}
        {mode === "matter" && (
          <MatterLattice
            phase={phase}
            color={color}
            atomicNumber={atomicNumber}
            reduced={reduced}
          />
        )}
      </group>
    </>
  );
}
