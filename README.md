# Healthalyst Frontend

This repository contains Healthalyst client applications. Other local repositories in the parent development workspace, such as mobile, desktop, or server projects, remain independent.

## Repository layout

```text
apps/
  organization/              Shared organisation hub for onboarding and application status
  health-schedule/           HealthSchedule product app (spoke)
  super-admin/               HealthAlyst staff dashboard and review client
packages/
  eslint-config/              Shared ESLint flat configurations
  icons/                      Semantic icon exports
  platform-api/               Shared NestJS Platform API transport and authentication
  test-utilities/             Shared Vitest setup
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
creating frontend sessions. Deployed direct requests need a same-site API origin
and the backend's exact CORS/origin allowlist. See
[authentication](docs/authentication.md) for configuration, failure behavior,
product API transport, and the one-time sign-in needed after migration.
HealthSchedule currently links to the hub; scheduling/product screens are
separate work.
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

Pull requests and pushes to `main` run formatting, lint, type checks, the app test suite, and production builds through GitHub Actions.
