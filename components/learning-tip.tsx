"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Fade without moving the controls; the full guidance remains in Help and Settings. */
export function LearningTip({
  active,
  children,
  className,
  id,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, [active]);
  return (
    <span id={id} className={`learning-tip ${className ?? ""}`} aria-hidden={!visible}>
      {children}
    </span>
  );
}
