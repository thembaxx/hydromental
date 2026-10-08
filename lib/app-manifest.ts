import type { MetadataRoute } from "next";
import { themeSurfaces, type SurfaceTheme } from "./theme";
export function appManifest(theme: SurfaceTheme = "day"): MetadataRoute.Manifest {
  const color = themeSurfaces[theme].color;
  return {
    id: "/",
    name: "Elementals — A playful science playground",
    short_name: "Elementals",
    description: "Touch, explore, and discover all 118 elements.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: color,
    theme_color: color,
    lang: "en",
    categories: ["education", "science"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Explore all elements",
        short_name: "Elements",
        url: "/elements",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
