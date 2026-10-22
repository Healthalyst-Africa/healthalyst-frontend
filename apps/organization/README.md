# HealthAlyst organisation app

The shared home for every HealthAlyst organisation, whichever product it
starts from: registration, email confirmation, sign-in with an authenticator
code, and (later) the organisation profile, members and enabled products.
Product apps such as HealthSchedule do not build their own onboarding screens;
they link here.

It calls the HealthAlyst Platform API at
`NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL` and runs on port 5173 in
development.

## Entry points for product apps

| Route           | Purpose                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| `/`             | Registration. `?product=healthschedule` (or `labconnect`, `pharmadesk`) pre-selects products |
| `/sign-in`      | Sign-in: password, then an authenticator or recovery code                                    |
| `/verify-email` | The page the Platform API's confirmation email links to (`?token=`)                          |

Returning the signed-in user to the product they came from (`returnTo`)
waits for the session decision: which domains the apps and the API share, so
the API's refresh cookie reaches every app.

## Structure

```text
src/
  app/                         Route entry points, root layout, styles
  components/ui/               App-wide branded wrappers
  features/
    organization-onboarding/
      api/                     Platform API client, errors and services
      components/              Registration, confirmation and sign-in screens
      hooks/                   TanStack Query hooks
      model/                   Options and Zod schemas
      index.ts                 Screens exposed to routes
  infrastructure/query/        App-wide TanStack Query client and provider
  shared/forms/                Form helpers used by more than one workflow
```
