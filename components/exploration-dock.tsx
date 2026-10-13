"use client";

import Link from "next/link";
import { useId } from "react";
import { LayoutGroup, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

const destinations = [
  {
    value: "table",
    workspace: "library",
    icon: "table",
    label: "Open element library",
    title: "Explore",
    id: "gb",
  },
  {
    value: "learning",
    workspace: "learning",
    icon: "learn",
    label: "Open discovery journal",
    title: "Learn",
  },
  {
    value: "compare",
    workspace: "lab",
    icon: "compare",
    label: "Open experiment lab",
    title: "Lab",
  },
] as const;

export type DockDestination = (typeof destinations)[number]["value"];

export function ExplorationDock({
  open,
  onOpen,
}: {
  open: string | null;
  onOpen: (destination: DockDestination) => void;
}) {
  const reducedMotion = useReducedMotionPreference();
  const group = useId();
  const transition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 430, damping: 36, mass: 0.8 };
  return (
    <LayoutGroup id={group}>
      <nav className="explorer-nav" aria-label="Explore and learn">
        {destinations.map((destination) => {
          const active = (open ?? "library") === destination.workspace;
          return (
            <Button variant="unstyled" asChild key={destination.value}>
              <motion.button
                id={"id" in destination ? destination.id : undefined}
                aria-label={destination.label}
                title={destination.title}
                aria-haspopup="dialog"
                aria-expanded={open === destination.workspace}
                data-active={active}
                whileTap={reducedMotion ? undefined : { scale: 0.92 }}
                transition={transition}
                onClick={() => {
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
                  <Icon name={destination.icon} weight={active ? "fill" : "regular"} size={26} />
                </motion.span>
              </motion.button>
            </Button>
          );
        })}
        <Link
          href="/playground"
          className="dock-link"
          aria-label="Open game playground"
          aria-current={open === "games" ? "page" : undefined}
        >
          {open === "games" && (
            <motion.span
              className="dock-selection"
              layoutId="dock-selection"
              transition={transition}
              aria-hidden="true"
            />
          )}
          <span className="dock-icon" aria-hidden="true">
            <Icon name="sandbox" weight={open === "games" ? "fill" : "regular"} size={26} />
          </span>
        </Link>
      </nav>
    </LayoutGroup>
  );
}
