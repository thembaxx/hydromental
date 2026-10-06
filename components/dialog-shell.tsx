"use client";

import { type ReactNode, useRef } from "react";
import { Dialog } from "radix-ui";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  id?: string;
  children: ReactNode;
  className?: string;
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
}: DialogShellProps) {
  const reducedMotion = useReducedMotion();
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="dialog-overlay"
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.16 }}
          />
        </Dialog.Overlay>
        <Dialog.Content
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
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="sr-only">{description}</Dialog.Description>
            )}
            <div className="dialog-body">{children}</div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
