# HealthAlyst organisation hub

Shared registration, email confirmation, password/MFA sign-in, application status,
and organisation-management integration. Product apps navigate here for account
onboarding. This app runs on port 3005 for both `dev` and `start`.

| Route              | Purpose                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `/`                | Registration; `?product=healthschedule`, `labconnect`, or `pharmadesk` preselects products |
| `/sign-in`         | Password, authenticator/recovery code, and initial MFA enrolment                           |
| `/application`     | Signed-in organisation application and checklist                                           |
| `/verify-email`    | One-time email confirmation and optional MFA enrolment                                     |
| `/forgot-password` | Request a password reset link                                                              |
| `/reset-password`  | Set a password from a one-time email link                                                  |

The shared Platform transport keeps the short-lived access token in private
browser memory. The API owns the HttpOnly refresh cookie. On reload it refreshes
and reads `/v1/me`; sign-in routes then open `/application`. The application
provider owns identity state and clears cached data on identity/context changes.
MFA challenges stay in workflow state and are sent in the backend request body.

Copy `.env.example` to `.env.local`. Local requests use `/v1` through the Next.js
transport rewrite to Render. Use [authentication](../../docs/authentication.md)
for direct deployed origins, cookie constraints, and migration instructions.

```text
src/
  app/                         Thin routes, root layout, metadata, styles
  config/                      Routes and authentication showcase settings
  components/ui/               Thin branded wrappers
  features/
    authentication/            Sign-in, email/password recovery and MFA
    organization-registration/ Registration and public reference data
    organization-application/  Application status, documents and submission services
    organization-management/   Profile, branch, capability and department services
  infrastructure/auth/         Browser identity provider
  infrastructure/query/        Query provider and defaults
  shared/forms/                Validation and focus helpers
  shared/organization/         Contracts used by multiple workflows
```

See [code organisation](../../docs/code-organization.md) for dependency rules.
Service coverage does not imply every operation has a connected screen.
