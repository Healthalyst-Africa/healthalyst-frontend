# HealthAlyst organisation app

The shared home for every HealthAlyst organisation, whichever product it
starts from: registration, email confirmation, sign-in with an authenticator
code, and (later) the organisation profile, members and enabled products.
Product apps such as HealthSchedule do not build their own onboarding screens;
they link here.

The browser calls this app's same-origin backend-for-frontend at `/api/platform`; the backend-for-frontend calls
the HealthAlyst NestJS Platform API using the server-only
`HEALTHALYST_PLATFORM_API_URL`. The app runs on port 5173 in development.

## Entry points for product apps

| Route              | Purpose                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `/`                | Registration. `?product=healthschedule` (or `labconnect`, `pharmadesk`) pre-selects products |
| `/sign-in`         | Sign-in: password, then an authenticator or recovery code                                    |
| `/application`     | Signed-in organisation application status and checklist                                      |
| `/verify-email`    | The page the Platform API's confirmation email links to (`?token=`)                          |
| `/forgot-password` | Request a password reset link                                                                |
| `/reset-password`  | Set a new password from the one-time email link                                              |

`/sign-in` only handles the password and authenticator or recovery-code steps.
After successful sign-in, the organisation hub routes to `/application`, where
the user can review their organisation status and checklist. The backend-for-frontend keeps the
Platform access and refresh tokens in encrypted server-side Redis storage. The
browser receives an opaque, host-only `HttpOnly; Secure; SameSite=Strict`
session cookie; JavaScript cannot read either token. During MFA or
authenticator enrolment, the backend-for-frontend sets a separate short-lived
HttpOnly challenge cookie scoped to `/api/platform/v1/auth`; the UI receives
only the challenge state, not the credential. On reload, the app calls
`GET /v1/me` through the
backend-for-frontend, which refreshes the API session when needed.

Set `HEALTHALYST_PLATFORM_API_URL`, `HEALTHALYST_APP_ORIGIN`,
`HEALTHALYST_PLATFORM_SESSION_REDIS_URL`, and `HEALTHALYST_PLATFORM_SESSION_SECRET` in the app's
local environment. The secret must contain at least 32 bytes. Local Redis is
available from the backend development Compose setup. The process-memory store
is only a development fallback when no Redis URL is set; sessions in that
fallback end when the Next.js server restarts. Production requires a reachable
private Redis service and a stable, app-specific secret shared by every
instance of this app. Use TLS for a remotely hosted Redis service.

The backend-for-frontend sends the app origin and `X-Requested-With: healthalyst` to the Platform
API when refreshing. The backend's existing origin/CSRF policy must allow the
deployed app origin; browser-to-Render CORS is no longer part of this request.

## Structure

```text
src/
  app/                         Thin routes, root layout, styles and BFF entry
  config/                      Routes and authentication showcase settings
  components/ui/               Thin app-wide branded wrappers
  features/
    authentication/            Sign-in, email/password recovery and MFA
    organization-registration/ Registration form and reference data
    organization-application/  Application status, documents and submission
    organization-management/   Profile, branch and capability integration
  infrastructure/auth/         Session provider and server BFF configuration
  infrastructure/query/        Query provider and defaults
  shared/forms/                Shared validation and focus helpers
  shared/organization/         Reference types, schemas and values used by features
```

Each feature separates components, workflow hooks, services, schemas, types,
configuration and utilities where needed. Authentication requests and transport
come directly from `@healthalyst/platform-api`. See
[code organisation](../../docs/code-organization.md) for dependency rules.
