import { readdirSync } from "node:fs";
import { join } from "node:path";
import { serviceWorkerSource } from "@/lib/service-worker-source";

export const dynamic = "force-static";
// Evaluated during static generation: each production build updates offline assets.
const version = `elementals-${(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local") + "-" + Date.now().toString(36)}`;
export function GET() {
  // Include the lazy WebGL bundle: it may load before the first worker takes control.
  let buildAssets: string[] = [];
  try {
    buildAssets = readdirSync(join(process.cwd(), ".next/static"), { recursive: true })
      .filter(
        (path): path is string => typeof path === "string" && /\.(js|css|woff2?|ttf)$/.test(path),
      )
      .map((path) => `/_next/static/${path.replaceAll("\\", "/")}`);
  } catch {
    // Development does not register this worker; the static output exists in production.
  }
  return new Response(
    serviceWorkerSource
      .replace("__CACHE_VERSION__", JSON.stringify(version))
      .replace("__BUILD_ASSETS__", JSON.stringify(buildAssets)),
    {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Service-Worker-Allowed": "/",
      },
    },
  );
}
