# HealthAlyst Super Admin

The internal staff app runs on port 3007 for `dev` and `start`. It owns staff
sign-in, the staff workspace, organisation review and lifecycle (suspend,
reinstate, deactivate, owner recovery), HealthAlyst staff management and the
audit log. Deployed at `https://admin.healthalystafrica.com`.

```text
src/
  app/                         Thin routes, root layout and styles
  config/                      Application routes, brand and web app settings
  features/
    staff-auth/                Password/MFA workflow, step-up and Platform realm activation
    staff-workspace/           Workspace shell, overview, navigation and metrics
    organization-oversight/    Directory, review, lifecycle, members and owner recovery
    staff-management/          HealthAlyst staff and their platform roles
    audit-log/                 Audit search, event details and integrity check
  infrastructure/
    auth/                      Browser staff identity provider
    pwa/                       Service worker registration and app status notices
    query/                     Query provider and defaults
```

Shared auth services follow the current NestJS contract. The browser transport
keeps access tokens in memory; the API owns its HttpOnly refresh cookie. A staff
account must have platform roles and a `PLATFORM` context before protected staff
screens open. An organisation account rejected by the staff gate is not globally
signed out as a side effect.

Copy `.env.example` to `.env.local`. Local `/v1` calls use the fixed Next.js
transport proxy to Render; deployed, the Platform API address is the hub
(`https://account.healthalystafrica.com`). See
[authentication](../../docs/authentication.md) for deployment origins, cookie behavior, and simultaneous local account testing,
and [code organisation](../../docs/code-organization.md) for shared ownership.
