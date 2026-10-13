# HealthSchedule client structure

```text
src/
  app/                         Next.js route entry points, root layout, styles
  components/ui/               App-wide branded wrappers
  features/
    organization-onboarding/
      api/                     Accounts HTTP client, endpoint service, query keys
      components/              Registration and application status screens
      hooks/                   TanStack Query hooks for the onboarding flow
      model/                   Organisation options and Zod form schemas
      index.ts                 Screens exposed to routes
  infrastructure/query/        App-wide TanStack Query client and provider
  shared/forms/                Form helpers used by more than one workflow
```

Routes import feature screens through `index.ts`. Feature components use their
own hooks and model; hooks call feature API services. API services own endpoint
paths, transport errors, and response validation. The root layout installs the
application query provider.

Keep new product workflows in their own `features/<workflow>` folder. Use
`shared` only for code reused by multiple workflows in this app, and `packages`
for stable, product-neutral capabilities shared across applications. Keep
framework configuration and public assets at the app root, as Next.js expects.
