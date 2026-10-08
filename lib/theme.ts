/** Shared first-paint, browser-chrome and installed-app colors. */
export const themeSurfaces = {
  day: {
    color: "#f0f5fc",
    scheme: "light",
    ink: "#202b48",
    accent: "#4055ce",
    background: "linear-gradient(135deg, #f0f5fc, #f9f7f1)",
  },
  midnight: {
    color: "#0a1028",
    scheme: "dark",
    ink: "#f5f7ff",
    accent: "#abbcff",
    background: "linear-gradient(135deg, #0a1028, #111a36)",
  },
  dusk: {
    color: "#232b65",
    scheme: "dark",
    ink: "#fff",
    accent: "#d6e0ff",
    background:
      "radial-gradient(ellipse at 10% 50%, #455299, transparent 65%), linear-gradient(135deg, #232b65, #343d81)",
  },
  noir: { color: "#000", scheme: "dark", ink: "#d6d6d6", accent: "#ccc", background: "none" },
} as const;
export type SurfaceTheme = keyof typeof themeSurfaces;
export const surfaceThemes = Object.keys(themeSurfaces) as SurfaceTheme[];
export function effectiveTheme(preference: unknown, dark: boolean): SurfaceTheme {
  return typeof preference === "string" && Object.hasOwn(themeSurfaces, preference)
    ? (preference as SurfaceTheme)
    : dark
      ? "midnight"
      : "day";
}
export function themeManifestHref(theme: SurfaceTheme) {
  return `/manifests/${theme}/manifest.webmanifest`;
}
function variables(theme: SurfaceTheme) {
  const surface = themeSurfaces[theme];
  return `--chrome:${surface.color};--bg:${surface.background};--startup-ink:${surface.ink};--startup-accent:${surface.accent};color-scheme:${surface.scheme}`;
}
/** Inline so first paint never waits for stylesheets, fonts or application JavaScript. */
export const themeCriticalCss = [
  `:root{${variables("day")}}`,
  `@media(prefers-color-scheme:dark){:root:not([data-theme]){${variables("midnight")}}}`,
  ...surfaceThemes.map((theme) => `:root[data-theme="${theme}"]{${variables(theme)}}`),
  "html{min-height:100%;background-color:var(--chrome);color:var(--startup-ink)}",
  "body{margin:0;min-height:100vh;min-height:100svh;min-height:100dvh;isolation:isolate;background-color:var(--chrome);color:var(--startup-ink)}",
  // A single viewport layer avoids mobile background-attachment bugs and gradient restarts.
  // Solid edges merge into toolbar/status-bar tint and the overscroll canvas.
  "body::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background-color:var(--chrome);background-image:linear-gradient(to bottom,var(--chrome),transparent max(80px,env(safe-area-inset-top)),transparent calc(100% - max(80px,env(safe-area-inset-bottom))),var(--chrome)),var(--bg)}",
].join("\n");
/** Fixed trusted program; device storage supplies only a whitelisted theme name. */
export const themeBootstrapScript = `(()=>{
const root=document.documentElement;const surfaces=${JSON.stringify(themeSurfaces)};
let preference='';try{const saved=JSON.parse(localStorage.getItem('elementals.learning.v2')||'null');if(saved?.version===2)preference=saved.settings?.theme;else preference=localStorage.getItem('th')||localStorage.getItem('elt')||''}catch{try{preference=localStorage.getItem('th')||localStorage.getItem('elt')||''}catch{}}
if(typeof preference==='string'&&Object.hasOwn(surfaces,preference))root.dataset.theme=preference;else delete root.dataset.theme;
const sync=()=>{const theme=root.dataset.theme;const key=Object.hasOwn(surfaces,theme||'')?theme:matchMedia('(prefers-color-scheme: dark)').matches?'midnight':'day';const surface=surfaces[key];let meta=document.getElementById('app-theme-color');if(!meta){meta=document.createElement('meta');meta.id='app-theme-color';meta.name='theme-color';meta.content=surface.color;document.head.insertBefore(meta,document.head.querySelector('meta[name="theme-color"]'))}else meta.content=surface.color;let link=document.getElementById('app-manifest');if(!link){link=document.createElement('link');link.id='app-manifest';link.rel='manifest';document.head.appendChild(link)}link.setAttribute('href','/manifests/'+key+'/manifest.webmanifest')};
sync();document.addEventListener('DOMContentLoaded',sync,{once:true});
// The standalone offline document has no React runtime to follow OS theme changes.
if(document.documentElement.hasAttribute('data-offline-page'))matchMedia('(prefers-color-scheme: dark)').addEventListener('change',sync);
})();`;
