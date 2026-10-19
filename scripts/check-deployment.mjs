import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const exec = promisify(execFile);
export function deploymentOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.origin !== value ||
    !url.hostname.endsWith(".vercel.app") ||
    url.username ||
    url.password
  )
    throw new Error("Expected a staged HTTPS Vercel deployment origin");
  return url;
}
export function stagedDeploymentUrl(output) {
  let result;
  try {
    result = JSON.parse(output);
  } catch {
    throw new Error("Expected structured deployment output from the locked Vercel CLI");
  }
  if (
    result?.status !== "ok" ||
    result.deployment?.readyState !== "READY" ||
    result.deployment.target !== "production"
  )
    throw new Error("The staged production deployment is not ready");
  return deploymentOrigin(result.deployment.url).origin;
}
export async function readAuthenticatedPage(url, run = exec) {
  if (run === exec && !process.env.VERCEL_TOKEN)
    throw new Error(
      "Authenticated staging checks require the existing VERCEL_TOKEN environment credential",
    );
  // Vercel's authenticated curl uses the existing CLI identity. No token or
  // bypass value is printed, persisted by this script, or included in argv.
  const { stdout } = await run(
    "pnpm",
    [
      "exec",
      "vercel",
      "curl",
      url.href,
      "--",
      "--silent",
      "--show-error",
      "--fail",
      "--max-time",
      "30",
      "--max-redirs",
      "0",
      "--write-out",
      "\n%{http_code}",
    ],
    {
      timeout: 60_000,
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, CI: "1", VERCEL_TELEMETRY_DISABLED: "1", NO_UPDATE_NOTIFIER: "1" },
    },
  );
  const split = stdout.lastIndexOf("\n");
  const status = Number(stdout.slice(split + 1));
  if (!Number.isInteger(status) || status < 200 || status >= 300)
    throw new Error(`Authenticated staged request returned ${status}`);
  return new Response(stdout.slice(0, split), { status });
}
export async function checkDeployment({ origin: value, fetchPage = fetch } = {}) {
  const origin = deploymentOrigin(value);
  for (const [path, expected] of [
    ["/", "Elementals"],
    ["/elements", "Hydrogen"],
    ["/playground", "Your curiosity"],
    ["/physics", "Projectile motion"],
    ["/manifest.webmanifest", "Elementals"],
    ["/element-data.json", '"schemaVersion":2'],
  ]) {
    const response = await fetchPage(new URL(path, origin), {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok || !(await response.text()).includes(expected))
      throw new Error(`Staged deployment failed the ${path} smoke check (${response.status})`);
    console.log(`Verified ${path}`);
  }
}
export function checkConfiguredDeployment(env = process.env, run = exec) {
  return checkDeployment({
    origin: env.DEPLOYMENT_URL,
    fetchPage: env.VERCEL_TOKEN ? (url) => readAuthenticatedPage(url, run) : fetch,
  });
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await checkConfiguredDeployment();
}
