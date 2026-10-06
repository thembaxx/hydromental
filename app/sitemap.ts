import type { MetadataRoute } from "next";
import { elements } from "@/lib/elements";
import { elementSlug } from "@/lib/science";
import { siteOrigin } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  return [
    { url: origin, priority: 1 },
    { url: `${origin}/elements`, priority: 0.9 },
    ...elements.map((element) => ({
      url: `${origin}/elements/${elementSlug(element)}`,
      priority: 0.7,
    })),
  ];
}
