"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { auras } from "@/lib/elemental";
import { Icon } from "@/components/ui/icon";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

gsap.registerPlugin(useGSAP, Draggable, InertiaPlugin, ScrollTrigger);

export function ElementalCarousel({
  active,
  onChange,
}: {
  active: number;
  onChange: (index: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const reduced = useReducedMotionPreference();
  useGSAP(
    () => {
      const viewport = root.current!,
        content = track.current!;
      let drag: Draggable | undefined;
      const resize = () => {
        drag?.kill();
        gsap.set(content, { x: 0 });
        const minX = Math.min(0, viewport.clientWidth - content.scrollWidth);
        if (minX === 0) return;
        const step = content.children[0].getBoundingClientRect().width + 12;
        [drag] = Draggable.create(content, {
          type: "x",
          bounds: { minX, maxX: 0 },
          inertia: !reduced,
          edgeResistance: 0.9,
          allowNativeTouchScrolling: true,
          dragClickables: true,
          minimumMovement: 8,
          snap: (value) => gsap.utils.clamp(minX, 0, Math.round(value / step) * step),
          onThrowComplete() {
            onChangeRef.current(Math.min(auras.length - 1, Math.round(-this.x / step)));
          },
          onDragEnd() {
            if (reduced) {
              const snapped = gsap.utils.clamp(minX, 0, Math.round(this.x / step) * step);
              gsap.set(content, { x: snapped });
              onChangeRef.current(Math.min(auras.length - 1, Math.round(-snapped / step)));
            }
          },
        });
      };
      const observer = new ResizeObserver(resize);
      observer.observe(viewport);
      resize();
      if (!reduced) {
        gsap.from(content.children, {
          opacity: 0,
          y: 20,
          stagger: 0.08,
          duration: 0.7,
          clearProps: "opacity,transform",
        });
        const page = viewport.closest(".hydro-experience");
        page?.querySelectorAll(".discovery-card-motion").forEach((card) => {
          gsap.fromTo(
            card,
            { scale: 0.94, opacity: 0.4 },
            {
              scale: 1,
              opacity: 1,
              ease: "none",
              scrollTrigger: { trigger: card, start: "top 95%", end: "top 65%", scrub: true },
            },
          );
        });
        gsap.fromTo(
          page?.querySelectorAll(".discovery-thought span") ?? [],
          { opacity: 0.2 },
          {
            opacity: 1,
            stagger: 0.15,
            ease: "none",
            scrollTrigger: {
              trigger: page?.querySelector(".discovery-thought"),
              start: "top 85%",
              end: "bottom 55%",
              scrub: true,
            },
          },
        );
      }
      return () => {
        observer.disconnect();
        drag?.kill();
      };
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );
  return (
    <section className="aura-section" aria-label="Elemental atmosphere">
      <div className="aura-heading">
        <h2>Find your element.</h2>
        <span>Same curiosity. A different feeling.</span>
        <small>
          Drag to explore <Icon name="compare" size={15} />
        </small>
      </div>
      <div className="aura-viewport" ref={root}>
        <div className="aura-track" ref={track}>
          {auras.map((aura, index) => (
            <button
              key={aura.id}
              type="button"
              className="aura-card"
              aria-pressed={active === index}
              style={{ "--aura-color": aura.color, "--aura-ink": aura.ink } as CSSProperties}
              onFocus={(event) => {
                const content = track.current!,
                  viewport = root.current!;
                const offset = event.currentTarget.offsetLeft;
                const minX = Math.min(0, viewport.clientWidth - content.scrollWidth);
                gsap.to(content, {
                  x: gsap.utils.clamp(minX, 0, -offset),
                  duration: reduced ? 0 : 0.35,
                  overwrite: true,
                });
              }}
              onClick={() => onChange(index)}
            >
              <Image
                src={`/auras/${aura.id}.png`}
                alt=""
                width={150}
                height={120}
                draggable={false}
                unoptimized
              />
              <span className="aura-card-copy">
                <small>{aura.label}</small>
                <strong>{aura.name}</strong>
                <span>{aura.nature}</span>
              </span>
              <span className="aura-check" aria-hidden="true">
                {active === index ? <Icon name="done" size={13} /> : <Icon name="next" size={13} />}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="aura-caption">
        Auras are artistic atmospheres. Explore real science in every element.
      </p>
    </section>
  );
}
