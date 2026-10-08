import { themeBootstrapScript, themeCriticalCss, themeSurfaces } from "@/lib/theme";
export const dynamic = "force-static";
export function GET() {
  return new Response(
    `<!doctype html><html lang="en" data-offline-page><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Offline | Elementals</title><meta name="color-scheme" content="light dark"><meta name="theme-color" content="${themeSurfaces.day.color}" media="(prefers-color-scheme:light)"><meta name="theme-color" content="${themeSurfaces.midnight.color}" media="(prefers-color-scheme:dark)"><style>${themeCriticalCss}\nbody{font:18px system-ui,sans-serif;display:grid;place-items:center}main{max-width:36rem;padding:calc(2rem + env(safe-area-inset-top)) calc(2rem + env(safe-area-inset-right)) calc(2rem + env(safe-area-inset-bottom)) calc(2rem + env(safe-area-inset-left))}h1{font-size:clamp(2rem,6vw,3rem)}a{color:var(--startup-accent)}p{line-height:1.7}a:focus-visible{outline:3px solid var(--startup-accent);outline-offset:5px}</style><script>${themeBootstrapScript}</script></head><body><main><h1>Science can wait for a signal.</h1><p>This page has not been saved on this device yet. Your learning progress remains on this device, and previously visited pages may still be available.</p><p><a href="/">Open your saved playground</a> · <a href="/elements">Try the element library</a></p><p>Reconnect to explore new pages.</p></main></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
