const origin = new URL(process.env.DEPLOYMENT_URL);
if (origin.protocol !== "https:" || !origin.hostname.endsWith(".vercel.app")) {
  throw new Error("Expected a staged HTTPS Vercel deployment");
}
const headers = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
  : {};
for (const [path, expected] of [
  ["/", "Elementals"],
  ["/elements", "Hydrogen"],
  ["/manifest.webmanifest", "Elementals"],
]) {
  const response = await fetch(new URL(path, origin), {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok || !(await response.text()).includes(expected)) {
    throw new Error(`Staged deployment failed the ${path} smoke check (${response.status})`);
  }
  console.log(`Verified ${path}`);
}
