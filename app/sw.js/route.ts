import { serviceWorkerSource } from "@/lib/service-worker-source";

export const dynamic = "force-static";
// Evaluated during static generation: each production build updates offline assets.
const version = `elementals-${(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "local") + "-" + Date.now().toString(36)}`;
export function GET() {
  return new Response(serviceWorkerSource.replace("__CACHE_VERSION__", JSON.stringify(version)), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
