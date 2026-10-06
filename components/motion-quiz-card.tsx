"use client";

import { useEffect, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { useAnimate } from "motion/react-mini";
import { Card } from "@/components/ui/card";

export function MotionQuizCard({ children }: { children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    // Use native keyframes so `none` retains CSS's perspective interpolation.
    const animation = animate(
      scope.current,
      {
        transform: ["perspective(600px) rotateY(-90deg)", "none"],
        opacity: [0, 1],
      },
      { duration: 0.6, ease: [0.34, 1.5, 0.5, 1] },
    );
    return () => animation.stop();
  }, [animate, reducedMotion, scope]);

  return (
    <Card variant="unstyled" ref={scope} id="qc" className="card g flip">
      {children}
    </Card>
  );
}
