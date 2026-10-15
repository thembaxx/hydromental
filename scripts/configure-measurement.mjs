import { appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import * as http from "node:http";
http.setGlobalProxyFromEnv?.();

export async function configureMeasurement({ token, teamId, projectId, request = fetch }) {
  if (
    !token ||
    !/^team_[A-Za-z0-9]+$/.test(teamId ?? "") ||
    !/^prj_[A-Za-z0-9]+$/.test(projectId ?? "")
  )
    throw new Error("Existing Vercel deployment credentials and project IDs are required");
  async function api(path, body) {
    const response = await request(new URL(path, "https://api.vercel.com"), {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(`Vercel measurement configuration returned HTTP ${response.status}`);
    return response.json();
  }
  const teamResponse = await api(`/v2/teams/${encodeURIComponent(teamId)}`);
  const team = teamResponse.team ?? teamResponse;
  const supported = ["pro", "enterprise"].includes(team?.billing?.plan);
  await api(
    `/web/insights/toggle?projectId=${encodeURIComponent(projectId)}&teamId=${encodeURIComponent(teamId)}`,
    { value: true },
  );
  return supported;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const supported = await configureMeasurement({
    token: process.env.VERCEL_TOKEN,
    teamId: process.env.VERCEL_ORG_ID,
    projectId: process.env.VERCEL_PROJECT_ID,
  });
  if (process.env.GITHUB_ENV)
    await appendFile(process.env.GITHUB_ENV, `NEXT_PUBLIC_PRODUCT_EVENTS_ENABLED=${supported}\n`);
  console.log(
    `Web Analytics enabled. Custom product events: ${supported ? "enabled on the existing plan" : "disabled; Pro or Enterprise is required"}. Free Speed Insights is provided by its SDK. No plan or Plus upgrade was requested.`,
  );
}
