import { appManifest } from "@/lib/app-manifest";
import { surfaceThemes, type SurfaceTheme } from "@/lib/theme";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return surfaceThemes.map((theme) => ({ theme }));
}
export async function GET(_request: Request, { params }: { params: Promise<{ theme: string }> }) {
  const { theme } = await params;
  if (!surfaceThemes.includes(theme as SurfaceTheme))
    return new Response("Not found", { status: 404 });
  return Response.json(appManifest(theme as SurfaceTheme), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8" },
  });
}
