# GitHub Actions and Vercel setup

Repository: https://github.com/thembaxx/hydromental

## Continuous integration

CI runs on pull requests and pushes to main. It uses Node.js 24 and pnpm 12.9.1 as pinned in package.json, installs with a frozen lockfile, checks oxlint/oxfmt/TypeScript, validates learning rules and the scientific snapshot, builds production output, and runs mobile and desktop Playwright tests. Reports and failure traces are retained for 14 days. Superseded CI runs are cancelled. Third-party actions are pinned to immutable commit hashes; Dependabot maintains those pins and npm/pnpm dependencies weekly.

CI calls the reusable Security workflow, which performs CodeQL analysis for JavaScript/TypeScript, with an additional weekly scheduled scan. Production deployment waits for the complete CI workflow, including security analysis. Dependency review rejects new high or critical vulnerabilities in pull requests. Workflows use the minimum token permissions required. PR jobs receive no Vercel credentials and do not use pull_request_target.

## Vercel project

1. Create/import a Next.js Vercel project linked to thembaxx/hydromental. Set the production branch to main and select Node.js 24.
2. Keep the committed vercel.json configuration: pnpm install --frozen-lockfile, pnpm build, and native main-branch auto-deployments disabled. Other Git branches can use Vercel's native preview integration.
3. Copy the project ID and team/account ID from Vercel project settings. Create a Vercel token for the account/team that owns the project.
4. In Vercel's production environment, set `NEXT_PUBLIC_SITE_URL` to the actual public HTTPS origin, especially when using a custom domain. Without this override, the Vercel production project domain is used. Confirm the canonical URLs and sitemap after deployment; see [discovery configuration](discovery-and-offline.md).
5. In GitHub Settings → Secrets and variables → Actions, add VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID. Do not commit credentials or paste them into source files.
6. Push a main commit or rerun its successful CI workflow. The Deploy to Vercel workflow checks that the CI run was a trusted main-branch push, checks that its exact tested SHA is still current main, builds for the Vercel runtime, and deploys prebuilt production output.

When credentials are absent, the deployment workflow records a clear skipped-deployment summary. It does not publish a website. The production environment and deployment concurrency isolate production releases. Pull request jobs do not deploy production or consume production secrets. Superseded main commits are not deployed.

## Repository settings

After the first successful CI run, configure a main branch ruleset requiring pull requests and the "Code checks, production build and browser tests" status. Block force pushes and deletion, require resolved review conversations, and require at least one reviewer where team size allows. Keep the default Actions token read-only and enable Dependabot vulnerability alerts. Restrict the production environment's deployment branches to main. These account-level policies and Vercel credentials require repository/account administration; the committed workflows do not invent or embed them.

The connected integration has not provisioned the Vercel secrets or applied branch-protection/default-token settings. GitHub administration endpoints returned permission errors even though source publication is available. Treat the settings above as setup instructions, not as already enabled controls.

## Recovery

A failed CI run prevents production deployment. Rerun failed checks after fixing the cause. For an urgent rollback, use Vercel's dashboard to promote the last healthy deployment, then revert the code via a pull request so main matches production. Logs, test traces, and deployment summaries are available in GitHub Actions.
