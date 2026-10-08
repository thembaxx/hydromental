"use client";

import { useEffect } from "react";
import { effectiveTheme, themeManifestHref, themeSurfaces } from "@/lib/theme";

/** The early head script handles startup; this follows live settings and navigation. */
export function BrowserChrome() {
  useEffect(() => {
    const root = document.documentElement;
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const theme = effectiveTheme(root.dataset.theme, system.matches);
      const surface = themeSurfaces[theme];
      // Own mutable nodes outside React's static metadata. Mutating React-managed
      // content/href before hydration makes its hoistable matching create duplicates.
      let meta = document.getElementById("app-theme-color") as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.id = "app-theme-color";
        meta.name = "theme-color";
        meta.content = surface.color;
        document.head.insertBefore(meta, document.head.querySelector('meta[name="theme-color"]'));
      } else if (meta.content !== surface.color) meta.content = surface.color;
      let link = document.getElementById("app-manifest") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = "app-manifest";
        link.rel = "manifest";
        document.head.appendChild(link);
      }
      const href = themeManifestHref(theme);
      if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    };
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    // Next can reinsert metadata on client navigation. Only observe head children,
    // so updating attributes above never schedules an observer loop.
    const headObserver = new MutationObserver(sync);
    headObserver.observe(document.head, { childList: true, subtree: true });
    system.addEventListener("change", sync);
    window.addEventListener("pageshow", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      headObserver.disconnect();
      system.removeEventListener("change", sync);
      window.removeEventListener("pageshow", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  return null;
}
