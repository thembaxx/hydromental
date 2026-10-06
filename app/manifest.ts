import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Elementals — A playful science playground",
    short_name: "Elementals",
    description: "Touch, explore, and discover all 118 elements.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#101422",
    theme_color: "#4d8dff",
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
