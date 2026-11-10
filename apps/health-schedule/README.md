# HealthSchedule

Patient scheduling and clinical operations for hospitals and clinics, as one
HealthAlyst product. It runs at `http://localhost:3006` with both `pnpm dev`
and `pnpm start`, and is deployed at `https://healthschedule.healthalystafrica.com`.
It is the installable, offline-capable product app; see
[offline architecture](../../docs/offline-architecture.md).

HealthSchedule has no registration or sign-in screens of its own. Every
HealthAlyst product uses the shared organisation app (`apps/organization`)
for those, so an organisation registers once and can use several products.
HealthSchedule links there through `NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL`,
with `?product=healthschedule` so registration pre-selects HealthSchedule.
For local development, set that variable to `http://localhost:3005`.
Copy `.env.example` to `.env.local` for the shared Platform transport configuration.
See [authentication](../../docs/authentication.md) for the backend cookie contract
and the HealthSchedule API client in `src/infrastructure/api`.

## Entry and sign-in hand-over

The home route restores the HealthAlyst sign-in made in the organisation app
(refresh, then `/v1/me`) and chooses the first screen:

| Session                                             | Screen                                              |
| --------------------------------------------------- | --------------------------------------------------- |
| Nobody signed in                                    | Sign-in and registration links                      |
| Application in draft, changes requested or review   | Application status, linking to the organisation app |
| Approved, but HealthSchedule not among its products | "Not enabled" notice                                |
| Suspended, rejected or deactivated                  | "Not available" notice                              |
| Approved with HealthSchedule                        | The signed-in workspace                             |

These rules only choose the screen. The Platform API must enforce approval and
product access on every HealthSchedule request.

The hand-over relies on the refresh cookie reaching this app. The Platform API
sets it host-only, with `path=/v1/auth` and `SameSite=Strict`:

- Locally, every app runs on `localhost`. Browsers share cookies across ports,
  so the hand-over works when every app proxies to the same API. A proxy aimed
  at a different API answers 401 and clears the shared cookie, signing the
  organisation app out too.
- Deployed, the cookie lives on the hub's host. This app sets
  `NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL=https://account.healthalystafrica.com`,
  so its refresh goes to the hub's `/v1`, and as a subdomain of the same site it
  receives the shared session.

## Structure

```text
src/
  app/                         Route entry points, root layout, styles
  components/ui/               App-wide branded wrappers
  config/                      Hub address, routes, brand and web app settings
  features/
    organization-access/
      components/              Signed-out entry composition
      services/                Links into the organisation hub
    product-access/
      components/              Entry routing, status notices, workspace home
      config/                  Product code and organisation status groups
      hooks/                   Sign-out and organisation switching
      schemas/, services/      The product check against the HealthSchedule API
      utilities/               Session-to-screen access rules and navigation
    branch-selection/          The branch the person is working at
    schedule-setup/            Calendars, weekly hours, time off and appointment types
  infrastructure/
    api/                       HealthSchedule API client
    auth/                      HealthAlyst session provider
    pwa/                       Service worker registration and app status notices
    query/                     Query client and provider
  shared/workspace/            Signed-in session, permissions and branch for workspace pages
```

Keep product workflows in their own `features/<workflow>` folder, and use
`packages` for stable, product-neutral capabilities shared across applications.
See [code organisation](../../docs/code-organization.md) for the shared rules.
