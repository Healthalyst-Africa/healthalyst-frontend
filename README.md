# Healthalyst Frontend

This repository contains Healthalyst client applications. Other local repositories in the parent development workspace, such as mobile, desktop, or server projects, remain independent.

## Repository layout

```text
apps/
  health-schedule/           HealthSchedule organisation onboarding client
  super-admin/               HealthAlyst staff dashboard and review client
packages/
  eslint-config/              Shared ESLint flat configurations
  test-utilities/             Shared Vitest setup
  typescript-config/          Shared TypeScript presets
  ui/                         Brand-neutral shadcn components and styles
```

Add each independently deployable client application under `apps/`. Keep generic shared capabilities in `packages/`. All shadcn primitives belong in `packages/ui`, including those used by a single application. Keep app branding, routes, and product-specific behavior inside the owning app.

## Commands

HealthSchedule runs locally on port `5173`, and Super Admin runs on `3007`. Both use the Accounts API on port `8081`; the HealthSchedule backend sandbox uses port `8082`. These ports are separate from the local Eventorch clients (`3003` to `3005`) and server (`8080`).

The organisation onboarding flow includes email confirmation, signed-in
application status and reviewer-requested evidence uploads. HealthAlyst staff
review applications, evidence, and decisions in Super Admin.
Evidence files are sent to the Accounts API for scanning and private storage. The
frontend never receives a storage URL or object-storage credentials.

```sh
pnpm install
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
