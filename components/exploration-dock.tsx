"use client";

import { useId, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

const destinations = [
  {
    value: "table",
    icon: "table",
    label: "Open periodic table",
    title: "Periodic table",
    id: "gb",
  },
  { value: "learning", icon: "learn", label: "Open discovery journal", title: "Discovery journal" },
  { value: "compare", icon: "compare", label: "Compare elements", title: "Compare elements" },
  {
    value: "sandbox",
    icon: "sandbox",
    label: "Open bonding playground",
    title: "Bonding playground",
  },
  { value: "help", icon: "help", label: "Exploration help", title: "Exploration help" },
] as const;

export type DockDestination = (typeof destinations)[number]["value"];

export function ExplorationDock({
  open,
  onOpen,
}: {
  open: string | null;
  onOpen: (destination: DockDestination) => void;
}) {
  const [selected, setSelected] = useState<DockDestination | null>(null);
  const reducedMotion = useReducedMotionPreference();
  const group = useId();
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 430, damping: 36, mass: 0.8 };
  return (
    <LayoutGroup id={group}>
      <nav className="explorer-nav" aria-label="Explore and learn">
        {destinations.map((destination) => {
          const active = selected === destination.value;
          return (
            <Button variant="unstyled" asChild key={destination.value}>
              <motion.button
                id={"id" in destination ? destination.id : undefined}
                aria-label={destination.label}
                title={destination.title}
                aria-haspopup="dialog"
                aria-expanded={open === destination.value}
                data-active={active}
                whileTap={reducedMotion ? undefined : { scale: 0.92 }}
                transition={transition}
                onClick={() => {
                  setSelected(destination.value);
                  onOpen(destination.value);
                }}
              >
                {active && (
                  <motion.span
                    className="dock-selection"
                    layoutId="dock-selection"
                    transition={transition}
                    aria-hidden="true"
                  />
                )}
                <motion.span
                  className="dock-icon"
                  initial={false}
                  animate={{ scale: active && !reducedMotion ? 1.06 : 1 }}
                  transition={transition}
                  aria-hidden="true"
                >
                  <Icon name={destination.icon} />
                </motion.span>
              </motion.button>
            </Button>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}
