"use client";

import { type CSSProperties, type ReactNode, useRef } from "react";
import { Dialog } from "radix-ui";
import { motion, useDragControls } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";

export interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  id?: string;
  children: ReactNode;
  className?: string;
  bottomSheet?: boolean;
  style?: CSSProperties;
}

/** Radix owns focus trapping, Escape dismissal and focus restoration. */
export function DialogShell({
  open,
  onOpenChange,
  title,
  description,
  id,
  children,
  className,
  bottomSheet = false,
  style,
}: DialogShellProps) {
  const reducedMotion = useReducedMotionPreference();
  const dragControls = useDragControls();
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {open && (
        <Dialog.Portal forceMount>
          <Dialog.Overlay forceMount asChild>
            <motion.div
              className="dialog-overlay"
              initial={{ opacity: reducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.16 }}
            />
          </Dialog.Overlay>
          <Dialog.Content
            forceMount
            asChild
            {...(!description ? { "aria-describedby": undefined } : {})}
            onOpenAutoFocus={(event) => {
              returnFocus.current =
                document.activeElement instanceof HTMLElement ? document.activeElement : null;
              const preferred = (
                event.currentTarget as HTMLElement | null
              )?.querySelector<HTMLElement>("[data-autofocus]");
              if (preferred) {
                event.preventDefault();
                preferred.focus();
              }
            }}
            onCloseAutoFocus={(event) => {
              if (returnFocus.current?.isConnected) {
                event.preventDefault();
                returnFocus.current.focus();
              }
            }}
          >
            <motion.div
              id={id}
              className={cn("dialog-content", className)}
              style={style}
              initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
              drag={bottomSheet ? "y" : false}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.35 }}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (bottomSheet && (info.offset.y > 90 || info.velocity.y > 650))
                  onOpenChange(false);
              }}
            >
              <Dialog.Title className="sr-only">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="sr-only">{description}</Dialog.Description>
              )}
              {bottomSheet && (
                <div
                  className="sheet-drag-handle"
                  aria-hidden="true"
                  onPointerDown={(event) => dragControls.start(event)}
                >
                  <span />
                </div>
              )}
              <div className="dialog-body">{children}</div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
