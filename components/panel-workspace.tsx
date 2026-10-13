"use client";

import { useId, type ReactNode } from "react";
import { Tabs } from "radix-ui";
import { LayoutGroup, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

export function PanelWorkspace<T extends string>({
  title,
  subtitle,
  value,
  onChange,
  close,
  tabs,
  children,
}: {
  title: string;
  subtitle?: string;
  value: T;
  onChange: (value: T) => void;
  close: () => void;
  tabs: { value: T; label: string; content: ReactNode }[];
  children?: ReactNode;
}) {
  const id = useId();
  const reduced = useReducedMotionPreference();
  return (
    <Tabs.Root
      className="panel-workspace"
      value={value}
      onValueChange={(next) => onChange(next as T)}
    >
      <header className="workspace-header">
        <div className="dh">
          <div>
            {subtitle && <span className="eyebrow">{subtitle}</span>}
            <h2 tabIndex={-1}>{title}</h2>
          </div>
          <Button variant="unstyled" className="icon-button" aria-label="Close" onClick={close}>
            <Icon name="close" />
          </Button>
        </div>
        <LayoutGroup id={id}>
          <Tabs.List className="workspace-tabs" aria-label={`${title} views`}>
            {tabs.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value} className="workspace-tab">
                {value === tab.value && (
                  <motion.span
                    className="workspace-selection"
                    layoutId="workspace-selection"
                    transition={
                      reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }
                    }
                    aria-hidden="true"
                  />
                )}
                <span>{tab.label}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </LayoutGroup>
        {children}
      </header>
      {tabs.map((tab) => (
        <Tabs.Content
          key={tab.value}
          value={tab.value}
          forceMount
          hidden={value !== tab.value}
          className="workspace-view"
        >
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
