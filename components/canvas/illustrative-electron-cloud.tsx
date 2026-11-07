"use client";

/* oxlint-disable react/immutability -- Three.js shader uniforms are mutated on render frames. */
import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ModelMotion } from "@/lib/model-motion";

// Illustrative cloud, not a quantum-mechanical orbital density or an electron trajectory.
// Retains the existing Bohr-shell teaching model rather than silently changing its meaning.
const vertexShader = `
  uniform float uTime;
  attribute float aPhase;
  varying float vFade;
  void main() {
    vec3 p = position;
    float drift = uTime * (0.12 + aPhase * 0.15);
    p += vec3(
      sin(aPhase * 19.0 + drift),
      cos(aPhase * 23.0 + drift * 0.7),
      sin(aPhase * 31.0 - drift * 0.8)
    ) * 0.032;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = 1.5 + aPhase * 2.0;
    vFade = 0.4 + 0.6 * sin(aPhase * 17.0 + drift) * sin(aPhase * 17.0 + drift);
  }
`;
const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float glow = 1.0 - smoothstep(0.10, 0.5, d);
    gl_FragColor = vec4(uColor, glow * vFade * uOpacity);
    #include <colorspace_fragment>
  }
`;

export default function IllustrativeElectronCloud({
  shells,
  selectedShell,
  color,
  motion,
  still,
  inspectionProgress = 0,
}: {
  shells: readonly number[];
  selectedShell: number | null;
  color: string;
  motion: RefObject<ModelMotion>;
  still: boolean;
  inspectionProgress?: number;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const count = Math.min(280, Math.max(60, shells.length * 56));
  const attributes = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const shell = i % Math.max(1, shells.length);
      const y = 1 - 2 * ((i + 0.5) / count);
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = i * golden;
      const radius = 1.02 + shell * 0.31 + Math.sin(i * 21.76) * 0.075;
      positions[i * 3] = Math.cos(angle) * r * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(angle) * r * radius;
      phases[i] = (i * 0.61803398875) % 1;
    }
    return { positions, phases };
  }, [count, shells.length]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0.18 },
    }),
    [color],
  );
  useFrame(() => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = still ? 0 : motion.current.time;
    material.current.uniforms.uColor.value.set(color);
    const eased = THREE.MathUtils.smoothstep(inspectionProgress, 0, 1);
    material.current.uniforms.uOpacity.value =
      (selectedShell === null ? 0.19 : 0.1) * (1 - eased);
  });
  return (
    <points frustumCulled={false} raycast={() => {}}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[attributes.phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
