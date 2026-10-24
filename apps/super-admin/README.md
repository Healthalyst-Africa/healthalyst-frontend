# HealthAlyst Super Admin

The internal staff app runs on port 3007 for `dev` and `start`. It owns staff
sign-in, the staff workspace, and organisation application review.

```text
src/
  app/                         Thin routes, root layout and styles
  config/                      Application routes
  components/                  Thin branded adapters
  features/
    staff-auth/                Password/MFA workflow and Platform realm activation
    staff-workspace/           Workspace shell, overview, navigation and metrics
    organization-oversight/    Directory, detail and review operations
  infrastructure/
    auth/                      Browser staff identity provider
    query/                     Query provider and defaults
```

Shared auth services follow the current NestJS contract. The browser transport
keeps access tokens in memory; the API owns its HttpOnly refresh cookie. A staff
account must have platform roles and a `PLATFORM` context before protected staff
screens open. An organisation account rejected by the staff gate is not globally
signed out as a side effect.

Copy `.env.example` to `.env.local`. Local `/v1` calls use the fixed Next.js
transport proxy to Render. See [authentication](../../docs/authentication.md)
for deployment origins, cookie behavior, and simultaneous local account testing,
and [code organisation](../../docs/code-organization.md) for shared ownership.
