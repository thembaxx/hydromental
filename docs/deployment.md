# GitHub Actions and Vercel setup

Repository: https://github.com/thembaxx/hydromental

## Continuous integration

CI runs on pull requests and pushes to main. It uses Node.js 24 and pnpm 12.9.1 as pinned in package.json, installs with a frozen lockfile, checks oxlint/oxfmt/TypeScript, validates learning rules and the scientific snapshot, builds production output, and runs mobile and desktop Playwright tests. Reports and failure traces are retained for 14 days. Superseded CI runs are cancelled. Third-party actions are pinned to immutable commit hashes; Dependabot maintains those pins and npm/pnpm dependencies weekly.

CI calls the reusable Security workflow, which performs CodeQL analysis for JavaScript/TypeScript and audits the full locked dependency graph, with additional weekly scheduled scans. The advisory audit rejects known high or critical runtime and development vulnerabilities; its install disables lifecycle scripts. Production deployment waits for the complete CI workflow, including security analysis. Dependency review rejects new high or critical vulnerabilities in pull requests. Workflows use the minimum token permissions required. PR jobs receive no Vercel credentials and do not use pull_request_target.

## Vercel project

1. Create/import a Next.js Vercel project linked to thembaxx/hydromental. Set the production branch to main and select Node.js 24.
2. Keep the committed vercel.json configuration: pnpm install --frozen-lockfile, pnpm build, and native main-branch auto-deployments disabled. Other Git branches can use Vercel's native preview integration.
3. Copy the project ID and team/account ID from Vercel project settings. Create a Vercel token for the account/team that owns the project.
4. In Vercel's production environment, set `NEXT_PUBLIC_SITE_URL` to the actual public HTTPS origin, especially when using a custom domain. Without this override, the Vercel production project domain is used. Confirm the canonical URLs and sitemap after deployment; see [discovery configuration](discovery-and-offline.md).
5. In GitHub Settings → Secrets and variables → Actions, add VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID. Do not commit credentials or paste them into source files.
6. Push a main commit or rerun its successful CI workflow. The Deploy to Vercel workflow checks that the CI run was a trusted main-branch push, checks that its exact tested SHA is still current main, builds for the Vercel runtime, and deploys prebuilt production output.

When credentials are absent, the deployment workflow records a clear skipped-deployment summary. It does not publish a website. The production environment and deployment concurrency isolate production releases. Pull request jobs do not deploy production or consume production secrets. Superseded main commits are not deployed.

## Repository settings

After the first successful CI run, configure a main branch ruleset requiring pull requests and the "Code checks, production build and browser tests", "Dependency vulnerability audit" and "CodeQL (JavaScript and TypeScript)" statuses. Block force pushes and deletion, require resolved review conversations, and require at least one reviewer where team size allows. Keep the default Actions token read-only and enable Dependabot vulnerability alerts. Restrict the production environment's deployment branches to main. These account-level policies and Vercel credentials require repository/account administration; the committed workflows do not invent or embed them.

Vercel production deployment is configured and verified at https://hydromental.vercel.app. Branch-protection/default-token settings have not been applied by the connected integration: GitHub administration endpoints returned permission errors even though source publication is available. Treat the repository-policy recommendations above as setup instructions, not as already enabled controls.

## Recovery

A failed CI run prevents production deployment. Rerun failed checks after fixing the cause. For an urgent rollback, use Vercel's dashboard to promote the last healthy deployment, then revert the code via a pull request so main matches production. Logs, test traces, and deployment summaries are available in GitHub Actions.

## Automated versions

After the full CI workflow succeeds for a trusted push to `main`, Semantic Release analyzes Conventional Commits and creates a version tag and GitHub release with generated notes. Use `fix: ...` for patches, `feat: ...` for minor versions, and `feat!: ...` or a `BREAKING CHANGE:` footer for major versions. Squash-merge PR titles using this convention. Documentation and maintenance commits do not create a release unless they include a breaking change.

The application stays private: the release does not publish to npm, require `NPM_TOKEN`, or write generated version commits back to `main`. The immutable `vX.Y.Z` tag is the release version; `package.json` is the development baseline. The release job has `contents: write`; other jobs remain read-only. Release comments on issues and PRs are disabled.

Production is staged using `--skip-domain`. Checks verify the application, library, manifest and schema-2 science data through authenticated `vercel curl` with the existing `VERCEL_TOKEN`. No separate bypass secret or disabled protection is needed. Redirects, login pages and incorrect content block promotion. The checker refuses to start CLI login when credentials are missing. A failed check leaves the current production deployment in place.

The Vercel CLI is pinned to 64.0.2 in the audited pnpm lockfile, with reviewed security overrides and the existing tested braces patch. CI no longer downloads an unaudited `pnpm dlx` graph. Tests cover fetch/Agent/FormData compatibility and CLI execution; the production pipeline checks the actual build/deploy/protection flow.

Deployment enables base Web Analytics and detects the existing team's custom-event eligibility without upgrading its plan. Visitor consent remains mandatory. Free Speed Insights is provided by its SDK; Speed Insights Plus is not enabled. See [measurement](measurement.md).

## Account controls

An administrator can inspect and apply the proposed configuration:

```sh
pnpm repository:configure
pnpm repository:configure --apply --reviewer thembaxx
```

The connected integration returned HTTP 403 for all three attempted changes on October 15, 2026: main ruleset, production environment and default Actions-token permissions. They remain unapplied. The script requires PRs, exact CI check names and resolved conversations, and blocks force pushes/deletion. Its approval count is zero for this solo-maintainer repository; add an independent reviewer requirement when the team supports one. It refuses to overwrite an existing named ruleset.

Production is restricted to main and gets the named reviewer while preserving existing reviewers/wait timers. Self-review is allowed for a solo maintainer. Default workflow tokens become read-only. The script reports individual failures and partial success; source publication permissions do not establish administration access.

Vercel credentials remain necessary for deployment, while GitHub release creation only needs the workflow's built-in `GITHUB_TOKEN`. New workflows take effect after the branch is merged. Local checks do not publish releases or deploy production.
