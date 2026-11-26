# Healthalyst Frontend

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Healthalyst-Africa/healthalyst-frontend/badge)](https://scorecard.dev/viewer/?uri=github.com/Healthalyst-Africa/healthalyst-frontend)

This repository contains Healthalyst client applications. Other local repositories in the parent development workspace, such as mobile, desktop, or server projects, remain independent.

## Repository layout

```text
apps/
  organization/              Organisation hub: sign-in, onboarding, settings, team, partners, products
  health-schedule/           HealthSchedule product app (spoke)
  super-admin/               HealthAlyst staff dashboard: review, staff, audit log
packages/
  config/                     Shared public environment names and validation
  eslint-config/              Shared ESLint flat configurations
  icons/                      Semantic icon exports
  platform-api/               Shared NestJS Platform API transport and authentication
  pwa/                        Service worker, caching rules, manifest and install hooks
  typescript-config/          Shared TypeScript presets
  ui/                         Brand-neutral shadcn components and styles
```

Add each independently deployable client application under `apps/`. The organization app is the shared hub that product apps link to for account onboarding and application status. Keep generic shared capabilities in `packages/`. All shadcn primitives belong in `packages/ui`, including those used by a single application. Keep app branding, routes, and product-specific behavior inside the owning app.

## Commands

The frontend apps use these ports for both `dev` and `start`:

| Application      | Local address         |
| ---------------- | --------------------- |
| Organisation hub | http://localhost:3005 |
| HealthSchedule   | http://localhost:3006 |
| Super Admin      | http://localhost:3007 |

Run `pnpm dev` from this directory to start all three apps, or use the filtered
commands below to start them separately. Restart existing development processes
after changing their port configuration.

The NestJS Platform API is the shared authority for identity, authentication,
organisation context and platform review. The shared browser transport follows
its current contract: memory-only bearer access tokens and the API's HttpOnly
refresh cookie. On reload it refreshes and loads `/v1/me`.

For local development against Render, each app can proxy `/v1` through a fixed
Next.js rewrite. This forwards the API's own responses and cookies without
creating frontend sessions. The deployed apps are the hub at
`https://account.healthalystafrica.com`, HealthSchedule at
`https://healthschedule.healthalystafrica.com` and Super Admin at
`https://admin.healthalystafrica.com`. The hub proxies `/v1`, and the other apps
set their Platform API address to the hub, so all three share one session. See
[authentication](docs/authentication.md) for configuration, failure behavior and
product API transport. HealthSchedule has branch selection and schedule setup;
the packages chosen for its screens are in
[HealthSchedule package recommendations](docs/health-schedule-package-recommendations.md),
and the install and offline plan is in
[offline architecture](docs/offline-architecture.md).
Read [code organisation](docs/code-organization.md) for feature folders,
configuration ownership, shared package internals and enforced import direction.

The organisation onboarding flow includes email confirmation, signed-in
application status and reviewer-requested evidence uploads. HealthAlyst staff
review applications, uploaded documents, and decisions in Super Admin. File
uploads and document viewing use short-lived URLs returned by the Platform API;
the frontend never receives storage credentials.

```sh
pnpm install
pnpm --filter @healthalyst/organization dev
pnpm --filter @healthalyst/health-schedule dev
pnpm --filter @healthalyst/super-admin dev
pnpm build
pnpm lint
pnpm check-types
pnpm test
pnpm check-format
pnpm test-all
```

Create another app under `apps/` with a unique package name and its own `package.json`. Extend the shared ESLint and TypeScript presets, add the shared UI package as a dependency when needed, and define the app's tasks. Turborepo runs matching tasks across the workspace.

Pull requests and pushes to `main` and `dev` run formatting, lint, type checks, the app and script test suites, and production builds through GitHub Actions.

## How we work

Changes follow HealthAlyst's AI-native delivery lifecycle, described in the
[engineering handbook](https://github.com/Healthalyst-Africa/.github/tree/main/engineering)
and [ADR 001](docs/adrs/001-adopt-ai-native-delivery-lifecycle.md): an issue,
then `intent.md`, `spec.md` and `plan.md` in [`docs/changes/`](docs/changes/),
a verified pull request into `dev`, and a release record when `dev` reaches
`main`. [CONTRIBUTING.md](CONTRIBUTING.md) explains the setup and the checks.

| Workflow                         | What it does                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------- |
| Client CI                        | Every gate in `pnpm test-all`                                                     |
| CodeQL, Dependency review        | Static analysis, and vulnerable or incompatible dependencies on each pull request |
| OpenSSF Scorecard                | Weekly supply-chain and repository security score                                 |
| Claude review, Claude            | Review against [`REVIEW.md`](REVIEW.md), and `@claude` requests                   |
| Agent evals                      | Checks that Claude still follows this repository's rules ([`evals/`](evals/))     |
| CI health                        | Daily control-band check on the CI failure rate                                   |
| Release record, Delivery metrics | A release per production deploy, and monthly DORA measures                        |

Repository settings, rulesets and security features are kept as code in
`.github/settings/` and applied by an administrator with
`scripts/github/apply-repository-settings.sh`.

Pull requests show their screens with images committed under
`docs/screenshots/<topic>/`. The GitHub Slack app posts pull requests as text
only, so the `Pull request screenshots` workflow posts those images to Slack
when a pull request opens or is ready for review, and posts any added or
changed images on later pushes. It needs the repository secret
`SLACK_PULL_REQUEST_SCREENSHOTS_WEBHOOK_URL`, a Slack incoming webhook for the
receiving channel; without it the workflow skips.
