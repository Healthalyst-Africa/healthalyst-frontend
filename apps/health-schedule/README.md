# HealthSchedule

Patient scheduling and clinical operations for hospitals and clinics, as one
HealthAlyst product. It runs at `http://localhost:3006` with both `pnpm dev`
and `pnpm start`.

HealthSchedule has no registration or sign-in screens of its own. Every
HealthAlyst product uses the shared organisation app (`apps/organization`)
for those, so an organisation registers once and can use several products.
HealthSchedule links there through `NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL`,
with `?product=healthschedule` so registration pre-selects HealthSchedule.
For local development, set that variable to `http://localhost:3005`.

## Structure

```text
src/
  app/                         Route entry points, root layout, styles
  components/ui/               App-wide branded wrappers
  config/                      Organisation hub address and route configuration
  features/
    organization-access/
      components/              Product entry composition
      services/                Links into the organisation hub
```

Keep product workflows in their own `features/<workflow>` folder, and use
`packages` for stable, product-neutral capabilities shared across applications.
See [code organisation](../../docs/code-organization.md) for the shared rules.
