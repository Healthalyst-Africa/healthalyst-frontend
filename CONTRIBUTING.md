# Contributing to HealthAlyst Frontend

This repository contains the HealthSchedule web application and neutral shared
UI foundations. The Java API lives in the separate `healthalyst-backend-java`
repository. Keep client and server source in their own repositories.

Read [AGENTS.md](./AGENTS.md) before changing code. It defines naming, shared
component ownership, security, accessibility, and validation rules.

## Product scope

The first application is `apps/health-schedule`, package
`@healthalyst/health-schedule`. It starts with organisation registration,
administrator sign-in, application review status, and later staff and module
setup. HealthSchedule patient workflows are outside this first onboarding slice.
Do not collect patient records or clinical data in organisation registration.

The public HealthAlyst marketing site is maintained in the separate
`marketing-module` repository. Do not add product onboarding routes to that site.

## Local setup

Requirements: Node.js 22.13 or newer and pnpm 10.27.0. From the repository root:

```sh
pnpm install --frozen-lockfile
cp -n apps/health-schedule/.env.example apps/health-schedule/.env.local
pnpm --filter @healthalyst/health-schedule dev
```

HealthSchedule reads `NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL` to contact the
HealthAlyst Platform API; any backend that implements its documented contract
can be used. The super-admin portal still reads `NEXT_PUBLIC_HEALTHALYST_API_URL`.
This value is public configuration, not a credential. Never put secrets in
`NEXT_PUBLIC_*` variables. The backend must separately allow the frontend origin.

## Repository structure

- `apps/health-schedule`: routes, onboarding flows, and product-specific theme.
- `packages/ui`: shared shadcn primitives, neutral styles, and utilities.
- `packages/eslint-config`: shared lint rules.
- `packages/typescript-config`: strict TypeScript presets.
- `packages/test-utilities`: shared test setup.

Applications import reusable UI through `@healthalyst/ui` exports. Do not import
source from another application or duplicate shared shadcn primitives.

## Product and interaction standards

- Treat pending, changes requested, approved, and rejected as distinct states.
- Show loading, success, validation, network failure, and recovery behavior.
- A frontend success state must follow a successful API response; do not simulate
  registration, authentication, approval, or staff invitations.
- Keep pending organisations restricted. The backend decides access and checks
  organisation membership and roles for every protected request.
- Keep application status details limited to the signed-in organisation
  administrator and authorised platform reviewers.
- Use persistent labels, accessible errors, keyboard operation, visible focus,
  and responsive layouts.
- Use only approved organisation and administrator fields. Do not invent KYB
  verification rules, regulatory claims, or review outcomes.

## Shared UI changes

Inspect the existing primitive and official shadcn documentation first. Keep all
shadcn primitives in `packages/ui`; compose them from the HealthSchedule app. Keep
its `components.json` aligned with `packages/ui/components.json`, including the
Tailwind configuration and stylesheet paths.

## Commands

```sh
pnpm check-format
pnpm lint
pnpm check-types
pnpm test
pnpm build
pnpm test-all
```

Run the checks relevant to a change and report exactly what ran. `pnpm test-all`
includes tests. Do not claim browser, API, or live service verification from a
successful build alone.

Do not commit, push, deploy, or publish without authorization. Keep local
environment files untracked and do not copy the backend into this repository.
