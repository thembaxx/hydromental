/** A configured public origin keeps previews, canonical URLs, and local development honest. */
export function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configured) return "http://localhost:3000";
  try {
    const url = new URL(configured.includes("://") ? configured : `https://${configured}`);
    if (!["http:", "https:"].includes(url.protocol)) return "http://localhost:3000";
    return url.origin;
  } catch {
    return "http://localhost:3000";
  }
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
