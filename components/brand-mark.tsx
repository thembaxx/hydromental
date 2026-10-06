import type { SVGProps } from "react";

/** Elementals' orbital mark. Decorative by default; label the containing link. */
export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" width="32" height="32" fill="none" aria-hidden="true" {...props}>
      <circle cx="32" cy="32" r="6" fill="currentColor" />
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="11"
        stroke="currentColor"
        strokeWidth="3"
        transform="rotate(-35 32 32)"
      />
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="11"
        stroke="currentColor"
        strokeWidth="3"
        transform="rotate(35 32 32)"
      />
      <circle cx="51" cy="18" r="4" fill="currentColor" />
    </svg>
  );
}
