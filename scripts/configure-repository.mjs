/** Apply the release controls with an administrator's existing gh identity. */
import { execFileSync } from "node:child_process";
const repository = "thembaxx/hydromental";
const apply = process.argv.includes("--apply");
const advancedSecurity = process.argv.includes("--advanced-security");
const reviewer = process.argv[process.argv.indexOf("--reviewer") + 1];
function api(path, method = "GET", body) {
  const result = execFileSync(
    "gh",
    ["api", `repos/${repository}/${path}`, "--method", method, ...(body ? ["--input", "-"] : [])],
    {
      input: body ? JSON.stringify(body) : undefined,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  return result ? JSON.parse(result) : null;
}
const rule = {
  name: "Verified main releases",
  target: "branch",
  enforcement: "active",
  bypass_actors: [],
  conditions: { ref_name: { include: ["refs/heads/main"], exclude: [] } },
  rules: [
    { type: "deletion" },
    { type: "non_fast_forward" },
    {
      type: "pull_request",
      parameters: {
        dismiss_stale_reviews_on_push: true,
        require_code_owner_review: false,
        require_last_push_approval: false,
        required_approving_review_count: 0,
        required_review_thread_resolution: true,
      },
    },
    {
      type: "required_status_checks",
      parameters: {
        strict_required_status_checks_policy: true,
        required_status_checks: [
          "Code checks, production build and browser tests",
          "Security analysis / Dependency vulnerability audit",
          ...(advancedSecurity ? ["Security analysis / CodeQL (JavaScript and TypeScript)"] : []),
        ].map((context) => ({ context })),
      },
    },
  ],
};
if (!apply) {
  console.log(
    JSON.stringify(
      {
        repository,
        rule,
        production: {
          branch: "main",
          reviewer: "Pass --reviewer LOGIN with --apply; keep existing reviewers and wait timers",
        },
        actions: { default_workflow_permissions: "read", can_approve_pull_request_reviews: false },
      },
      null,
      2,
    ),
  );
  console.log(
    "Dry run only. Run with --apply --reviewer LOGIN using an administrator's gh identity.",
  );
} else {
  if (!process.argv.includes("--reviewer") || !/^[A-Za-z0-9-]+$/.test(reviewer))
    throw new Error("Supply --reviewer LOGIN for a production reviewer");
  const user = JSON.parse(execFileSync("gh", ["api", `users/${reviewer}`], { encoding: "utf8" }));
  const failures = [];
  for (const [name, action] of [
    [
      "main ruleset",
      () => {
        const existing = api("rulesets").find((item) => item.name === rule.name);
        if (existing)
          throw new Error(
            "A named ruleset already exists. Review it in GitHub; this script will not overwrite existing rules.",
          );
        api("rulesets", "POST", rule);
      },
    ],
    [
      "production environment",
      () => {
        const current = api("environments/production");
        const reviewers =
          current.protection_rules
            ?.find((item) => item.type === "required_reviewers")
            ?.reviewers?.map((item) => ({ type: item.type, id: item.reviewer.id })) ?? [];
        if (!reviewers.some((item) => item.id === user.id))
          reviewers.push({ type: "User", id: user.id });
        api("environments/production", "PUT", {
          reviewers,
          prevent_self_review: false,
          wait_timer:
            current.protection_rules?.find((item) => item.type === "wait_timer")?.wait_timer ?? 0,
          deployment_branch_policy: { protected_branches: false, custom_branch_policies: true },
        });
        const policies = api("environments/production/deployment-branch-policies").branch_policies;
        if (!policies.some((item) => item.name === "main" && item.type === "branch"))
          api("environments/production/deployment-branch-policies", "POST", {
            name: "main",
            type: "branch",
          });
        for (const policy of policies.filter(
          (item) => item.name !== "main" || item.type !== "branch",
        ))
          api(`environments/production/deployment-branch-policies/${policy.id}`, "DELETE");
      },
    ],
    [
      "default workflow token",
      () =>
        api("actions/permissions/workflow", "PUT", {
          default_workflow_permissions: "read",
          can_approve_pull_request_reviews: false,
        }),
    ],
  ]) {
    try {
      action();
      console.log(`Applied ${name}`);
    } catch (error) {
      failures.push(name);
      console.error(`${name}: ${error.stderr?.toString().trim() || error.message}`);
    }
  }
  if (failures.length) {
    console.error(`Administrator action remains necessary: ${failures.join(", ")}.`);
    process.exitCode = 1;
  }
}
