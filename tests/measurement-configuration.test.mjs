import assert from "node:assert/strict";
import test from "node:test";
import { configureMeasurement } from "../scripts/configure-measurement.mjs";

test("existing plan eligibility controls custom events; only base analytics is enabled", async () => {
  for (const plan of ["hobby", "pro", "enterprise"]) {
    const calls = [];
    const supported = await configureMeasurement({
      token: "test-identity",
      teamId: "team_fixture",
      projectId: "prj_fixture",
      request: async (url, options) => {
        calls.push(url.pathname);
        assert.equal(url.origin, "https://api.vercel.com");
        assert.equal(options.redirect, "error");
        assert.equal(options.headers.Authorization, "Bearer test-identity");
        if (options.method === "GET") return Response.json({ team: { billing: { plan } } });
        assert.equal(url.searchParams.get("projectId"), "prj_fixture");
        assert.equal(url.searchParams.get("teamId"), "team_fixture");
        assert.equal(options.body, '{"value":true}');
        return Response.json({ value: true });
      },
    });
    assert.equal(supported, plan !== "hobby");
    assert.deepEqual(calls, ["/v2/teams/team_fixture", "/web/insights/toggle"]);
  }
});
test("invalid scope or rejected identity cannot silently enable measurement", async () => {
  await assert.rejects(
    configureMeasurement({
      token: "test",
      teamId: "../other",
      projectId: "prj_fixture",
      request: () => {
        throw new Error("Must not fetch");
      },
    }),
    /credentials and project IDs/,
  );
  await assert.rejects(
    configureMeasurement({
      token: "test",
      teamId: "team_fixture",
      projectId: "prj_fixture",
      request: async () => new Response(null, { status: 403 }),
    }),
    /HTTP 403/,
  );
});
