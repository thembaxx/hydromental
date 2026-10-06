"use client";

import { useEffect } from "react";

/** Keep browser chrome in sync with manual themes as well as the system theme. */
export function BrowserChrome() {
  useEffect(() => {
    const root = document.documentElement;
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const color = getComputedStyle(root).getPropertyValue("--chrome").trim();
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = color;
        meta.removeAttribute("media");
      });
    };
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    system.addEventListener("change", sync);
    sync();
    return () => {
      observer.disconnect();
      system.removeEventListener("change", sync);
    };
  }, []);
  return null;
}
