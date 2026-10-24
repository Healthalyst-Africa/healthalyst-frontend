# Contributing to HealthAlyst Frontend

This repository contains HealthAlyst's frontend applications and neutral shared
UI foundations. Their primary backend is the NestJS Platform API in the separate
`healthalyst-backend` repository.

Read [AGENTS.md](./AGENTS.md) before changing code. It defines naming, shared
component ownership, security, accessibility, and validation rules.

## Product scope

The first product spoke is `apps/health-schedule`, package
`@healthalyst/health-schedule`. Shared registration, administrator sign-in and
application status live in `apps/organization`; HealthSchedule patient
workflows are outside this onboarding slice. Do not collect patient records or
clinical data in organisation registration.

The public HealthAlyst marketing site is maintained in the separate
`marketing-module` repository. Do not add product onboarding routes to that site.

## Local setup

Requirements: Node.js 22.13 or newer and pnpm 10.27.0. From the repository root:

```sh
pnpm install --frozen-lockfile
cp -n apps/organization/.env.example apps/organization/.env.local
cp -n apps/health-schedule/.env.example apps/health-schedule/.env.local
cp -n apps/super-admin/.env.example apps/super-admin/.env.local
pnpm --filter @healthalyst/organization --filter @healthalyst/health-schedule --filter @healthalyst/super-admin dev
```

The organisation app (`apps/organization`, port 5173) holds registration,
email confirmation and sign-in for every HealthAlyst product. The organisation
app and Super Admin (port 8080) call their same-origin `/api/platform` BFF,
which calls NestJS using the server-only `HEALTHALYST_PLATFORM_API_URL`.
HealthSchedule (port 3000)
links to the organisation hub through
`NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL` instead of building their own
onboarding and does not yet make API calls. The NestJS Platform API is the
shared authority for identity and organisation context across the frontend
apps; documented product APIs can serve product-specific workflows. Backend
addresses and session credentials belong in server configuration. Never put secrets in
`NEXT_PUBLIC_*` variables. The backend currently allows the local frontend
origins on ports 3000, 5173 and 8080.

## Repository structure

- `apps/organization`: shared registration, authentication and organisation hub.
- `apps/health-schedule`: product entry and future scheduling workflows.
- `apps/super-admin`: HealthAlyst staff sign-in and organisation review.
- `packages/platform-api`: shared NestJS Platform API client and auth/session services.
- `packages/ui`: shared shadcn primitives, neutral styles, and utilities.
- `packages/eslint-config`: shared lint rules.
- `packages/typescript-config`: strict TypeScript presets.
- `packages/test-utilities`: shared test setup.

Applications import reusable UI through `@healthalyst/ui` exports. Do not import
source from another application or duplicate shared shadcn primitives.
Use [code organisation](docs/code-organization.md) for feature ownership,
configuration, contracts and dependency direction before adding folders.

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
