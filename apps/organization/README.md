# HealthAlyst organisation hub

Shared registration, email confirmation, password/MFA sign-in, application status,
organisation settings, team, partners and the product launcher. Deployed at
`https://account.healthalystafrica.com`; its `/v1` proxy also carries the sign-in
session for HealthSchedule and Super Admin. Product apps navigate here for account
onboarding. This app runs on port 3005 for both `dev` and `start`.

| Route                           | Purpose                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `/`                             | Registration; `?product=healthschedule`, `labconnect`, or `pharmadesk` preselects products |
| `/sign-in`                      | Password, authenticator/recovery code, and initial MFA enrolment                           |
| `/onboarding`                   | Signed-in organisation details, saved progress and onboarding requirements                 |
| `/application`                  | Redirects older links to `/onboarding`                                                     |
| `/verify-email`                 | One-time email confirmation and optional MFA enrolment                                     |
| `/forgot-password`              | Request a password reset link                                                              |
| `/reset-password`               | Set a password from a one-time email link                                                  |
| `/products`                     | Product launcher for approved organisations                                                |
| `/settings`                     | Organisation profile, branches and ownership                                               |
| `/settings/branches/[branchId]` | A branch's services and departments                                                        |
| `/team`                         | Members and invitations                                                                    |
| `/team/roles`                   | Roles and permissions                                                                      |
| `/partners`                     | Partnerships, the partner directory and partner invitations                                |
| `/account/security`             | Password, recovery codes and signed-in sessions                                            |
| `/invitations/accept`           | Join an organisation from a team invitation link                                           |
| `/register`                     | Partner invitation links (`?partnerInvitation=`); without one, redirects to `/`            |

The shared Platform transport keeps the short-lived access token in private
browser memory. The API owns the HttpOnly refresh cookie. On reload it refreshes
and reads `/v1/me`. After sign-in, HealthAlyst staff go to Super Admin, members of
an approved organisation go to their product or `/products`, and organisations not
yet approved go to `/onboarding`. The application
provider owns identity state and clears cached data on identity/context changes.
MFA challenges stay in workflow state and are sent in the backend request body.

Copy `.env.example` to `.env.local`. Local requests use `/v1` through the Next.js
transport rewrite to Render. Use [authentication](../../docs/authentication.md)
for deployed addresses and cookie constraints.

```text
src/
  app/                         Thin routes, root layout, metadata, styles
  config/                      Routes and authentication showcase settings
  components/ui/               Thin branded wrappers
  features/
    authentication/            Sign-in, email/password recovery and MFA
    account-security/          Password, recovery codes, sessions and step-up
    organization-registration/ Registration and public reference data
    organization-application/  Application status, documents and submission services
    organization-management/   Profile, branch, capability and department services
    organization-settings/     Settings pages, branches and ownership transfer
    organization-workspace/    Signed-in shell, navigation and organisation switching
    team-management/           Members, invitations and roles
    invitation-acceptance/     The page a team invitation link opens
    partner-network/           Partnerships, directory and partner invitations
    product-launcher/          Products the organisation can open
  infrastructure/auth/         Browser identity provider
  infrastructure/pwa/          Service worker registration and app status notices
  infrastructure/query/        Query provider and defaults
  shared/forms/                Validation and focus helpers
  shared/organization/         Contracts used by multiple workflows
  shared/security/             One-time token reading
```

See [code organisation](../../docs/code-organization.md) for dependency rules.
See [organisation onboarding](../../docs/organization-onboarding.md) for the
implemented organisation-details step and remaining onboarding screens.
Service coverage does not imply every operation has a connected screen.
