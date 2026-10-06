"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}
function subscribeMotion(notify: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}

/** A count-preserving schematic, not a quantum-orbital simulation. */
export function ElementStructure({
  name,
  shells,
  color,
}: {
  name: string;
  shells: readonly number[];
  color: string;
}) {
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const visible = useSyncExternalStore(
    subscribeVisibility,
    () => !document.hidden,
    () => false,
  );
  const playing = visible && !paused && !reducedMotion;
  return (
    <figure className="element-structure" data-playing={playing}>
      <svg
        viewBox="0 0 260 260"
        width="190"
        height="190"
        role="img"
        aria-label={`Electron shell populations for ${name}: ${shells.join(", ")}. Animated schematic, not literal electron paths; not to scale.`}
      >
        <circle cx="130" cy="130" r="12" fill={color} />
        {shells.map((count, i) => {
          const radius = shells.length > 1 ? 26 + i * (98 / (shells.length - 1)) : 70;
          return (
            <g key={i}>
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeOpacity=".3"
                strokeWidth="1.5"
              />
              <g
                className="structure-electrons"
                data-shell={i + 1}
                style={
                  {
                    "--orbit-duration": `${14 + i * 6}s`,
                    animationDirection: i % 2 ? "reverse" : "normal",
                  } as CSSProperties
                }
              >
                {Array.from({ length: count }, (_, k) => {
                  const angle = (k / count) * Math.PI * 2 + i;
                  return (
                    <circle
                      key={k}
                      cx={130 + radius * Math.cos(angle)}
                      cy={130 + radius * Math.sin(angle)}
                      r="3.4"
                      fill={color}
                    />
                  );
                })}
              </g>
            </g>
          );
        })}
      </svg>
      <figcaption>
        {reducedMotion ? (
          <span className="panel-copy">Animation off · reduced motion</span>
        ) : (
          <Button
            variant="unstyled"
            className="structure-control chip icon-action"
            aria-pressed={paused}
            aria-label={paused ? "Resume structure animation" : "Pause structure animation"}
            title={paused ? "Resume structure animation" : "Pause structure animation"}
            onClick={() => setPaused((value) => !value)}
          >
            <Icon name={paused ? "play" : "pause"} />
          </Button>
        )}
      </figcaption>
    </figure>
  );
}
