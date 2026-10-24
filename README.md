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

The NestJS Platform API is the shared backend for
identity, authentication, organisation context and platform review across
HealthAlyst apps. The organisation hub and Super Admin call their same-origin
`/api/platform` backend-for-frontend. It calls NestJS using the server-only
`HEALTHALYST_PLATFORM_API_URL` and holds tokens in encrypted server session storage. HealthSchedule
links to the hub and has not added API calls yet. Product spokes can also call
their documented product API for product-specific workflows. The backend's
origin policy must allow the configured organisation and Super Admin origins
for session refresh. Each app's `HEALTHALYST_APP_ORIGIN` must match its own
address, and HealthSchedule's `NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL`
must point to the organisation hub.

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
