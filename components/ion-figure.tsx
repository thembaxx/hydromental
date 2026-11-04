"use client";

import { useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { EXAMPLE_ELEMENTS, ionCharge, simpleShells, chargeText } from "@/lib/ion-figure";
import styles from "./ion-figure.module.css";

function ShellModel({ electrons, tilt }: { electrons: number; tilt: number }) {
  const counts = simpleShells(electrons);
  return (
    <group rotation={[0.35, (tilt * Math.PI) / 180, 0.18]}>
      <mesh>
        <sphereGeometry args={[0.53, 32, 24]} />
        <meshStandardMaterial color="#f48b8b" roughness={0.35} />
      </mesh>
      {counts.map((count, shell) => {
        const radius = shell === 0 ? 1.3 : 2.2;
        return (
          <group
            key={shell}
            rotation={[0.16, shell === 0 ? -0.35 : 0.44, shell === 0 ? 0.2 : -0.2]}
          >
            <mesh>
              <torusGeometry args={[radius, 0.016, 8, 96]} />
              <meshBasicMaterial
                color={shell === 0 ? "#80b5f1" : "#83d7bf"}
                transparent
                opacity={0.65}
              />
            </mesh>
            {Array.from({ length: count }, (_, index) => {
              const angle = (index * Math.PI * 2) / Math.max(1, count);
              return (
                <mesh
                  key={index}
                  position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
                >
                  <sphereGeometry args={[0.13, 16, 12]} />
                  <meshStandardMaterial
                    color={shell === 0 ? "#7bb7ff" : "#79e7bf"}
                    metalness={0.15}
                    roughness={0.28}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

export function IonFigure() {
  const [selected, setSelected] = useState(0);
  const [prediction, setPrediction] = useState<"negative" | "positive" | null>(null);
  const [difference, setDifference] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [transfer, setTransfer] = useState<"positive" | "negative" | null>(null);
  const element = EXAMPLE_ELEMENTS[selected];
  const electrons = element.protons + difference;
  const charge = ionCharge(element.protons, electrons);
  const reset = () => {
    setPrediction(null);
    setDifference(0);
    setTilt(0);
    setRevealed(false);
    setTransfer(null);
  };

  return (
    <main className={styles.page}>
      <Link href="/" className={styles.back}>
        ← Elements
      </Link>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Interactive experiment</p>
        <h1>What makes an ion?</h1>
        <p>Change the number of electrons. See how charge responds.</p>
      </header>
      <div className={styles.panel}>
        <section aria-label="Predict" className={styles.step}>
          <p className={styles.eyebrow}>1 · Predict</p>
          <h2>If a neutral atom gains one electron, what charge does it have?</h2>
          <div className={styles.choices} role="group" aria-label="Predict ion charge">
            {(["negative", "positive"] as const).map((answer) => (
              <button
                key={answer}
                type="button"
                className={styles.choice}
                aria-pressed={prediction === answer}
                disabled={prediction !== null}
                onClick={() => setPrediction(answer)}
              >
                {answer === "negative" ? "Negative" : "Positive"}
              </button>
            ))}
          </div>
        </section>
        {prediction !== null && (
          <>
            <section aria-label="Experiment" className={styles.step}>
              <p className={styles.eyebrow}>2 · Try</p>
              <div className={styles.controls}>
                <label>
                  Element
                  <select
                    value={selected}
                    onChange={(event) => {
                      setSelected(Number(event.target.value));
                      setDifference(0);
                      setRevealed(false);
                      setTransfer(null);
                    }}
                  >
                    {EXAMPLE_ELEMENTS.map((item, index) => (
                      <option value={index} key={item.symbol}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Electrons changed{" "}
                  <output>
                    {difference > 0 ? "+" : ""}
                    {difference}
                  </output>
                  <input
                    aria-label="Electrons changed"
                    type="range"
                    min="-1"
                    max="1"
                    step="1"
                    value={difference}
                    onChange={(event) => {
                      setDifference(Number(event.target.value));
                      setRevealed(false);
                      setTransfer(null);
                    }}
                  />
                </label>
                <label>
                  Rotate model <output>{tilt}°</output>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    step="5"
                    value={tilt}
                    onChange={(event) => setTilt(Number(event.target.value))}
                  />
                </label>
              </div>
              <div
                className={styles.stage}
                role="img"
                aria-label={
                  element.name +
                  " with " +
                  element.protons +
                  " protons and " +
                  electrons +
                  " electrons. Net charge " +
                  chargeText(charge) +
                  "."
                }
              >
                <Canvas
                  frameloop="demand"
                  dpr={[1, 1.5]}
                  camera={{ position: [0, 0, 7.5], fov: 45 }}
                  gl={{ alpha: true, antialias: true }}
                >
                  <ambientLight intensity={1.5} />
                  <pointLight position={[3, 4, 5]} intensity={50} />
                  <ShellModel electrons={electrons} tilt={tilt} />
                </Canvas>
              </div>
              <div className={styles.readout} aria-live="polite">
                <span>{element.protons} protons</span>
                <span>{electrons} electrons</span>
                <strong>{chargeText(charge)}</strong>
              </div>
              <p className={styles.caveat}>
                Schematic shell representation only. Electrons occupy quantum orbitals, not
                planetary paths; this does not simulate orbital motion.
              </p>
              <button
                type="button"
                className={styles.primary}
                disabled={difference === 0}
                onClick={() => setRevealed(true)}
              >
                Explain the result
              </button>
            </section>
            {revealed && (
              <section aria-label="Explain" className={styles.step}>
                <p className={styles.eyebrow}>3 · Explain</p>
                <p role="status">
                  {prediction === "negative"
                    ? "Your prediction matched."
                    : "Your prediction differed."}
                </p>
                <p>
                  Protons are positively charged. Electrons are negatively charged. Adding an
                  electron makes an atom more negative; removing one makes it more positive. Net
                  charge is protons minus electrons.
                </p>
                <h2>What charge would oxygen have after losing one electron?</h2>
                <div role="group" aria-label="Apply the ion rule" className={styles.choices}>
                  {(["positive", "negative"] as const).map((answer) => (
                    <button
                      key={answer}
                      type="button"
                      className={styles.choice}
                      aria-pressed={transfer === answer}
                      disabled={transfer !== null}
                      onClick={() => setTransfer(answer)}
                    >
                      {answer === "positive" ? "+1" : "−1"}
                    </button>
                  ))}
                </div>
                {transfer && (
                  <p role="status">
                    {transfer === "positive"
                      ? "Correct. Oxygen has one more proton than electrons."
                      : "Review the charge rule above and try again."}
                  </p>
                )}
                <button type="button" className={styles.secondary} onClick={reset}>
                  Reset experiment
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
