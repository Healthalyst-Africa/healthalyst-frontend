# HealthAlyst Super Admin

The independently deployed internal staff app runs at `http://localhost:3007`
with both `pnpm dev` and `pnpm start`. Set `HEALTHALYST_APP_ORIGIN` to that
same address in the local environment. It owns
Platform staff sign-in, the staff workspace and organisation application review.
It does not own organisation employee sign-in or product workflows.

```text
src/
  app/                         Thin Next.js routes and BFF route entry
  config/                      Application routes
  components/                  Thin branded adapters
  features/
    staff-auth/                Sign-in rendering, workflow, schemas and types
    staff-workspace/           Workspace shell, overview, navigation and metrics
    organization-oversight/    Directory, detail and review operations
  infrastructure/
    auth/                      Staff session provider and context types
    platform/                  Server-only BFF app configuration
    query/                     Query provider and defaults
```

Feature `services` modules own requests and query keys; `schemas`, `types` and
`config` own contracts and policies. Hooks coordinate requests and workflow
state; components render the interface using `@healthalyst/ui` compositions.

Browser Platform requests use the same-origin `/api/platform` BFF. The server
upstream is configured through `HEALTHALYST_PLATFORM_API_URL`; tokens stay in
server session storage. Use the app's `.env.example` for required variable names.
See [code organisation](../../docs/code-organization.md) for the shared rules.
