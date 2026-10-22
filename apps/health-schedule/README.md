# HealthSchedule

Patient scheduling and clinical operations for hospitals and clinics, as one
HealthAlyst product. It runs on port 5174 in development.

HealthSchedule has no registration or sign-in screens of its own. Every
HealthAlyst product uses the shared organisation app (`apps/organization`)
for those, so an organisation registers once and can use several products.
HealthSchedule links there through `NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL`,
with `?product=healthschedule` so registration pre-selects HealthSchedule.

## Structure

```text
src/
  app/                         Route entry points, root layout, styles
  components/ui/               App-wide branded wrappers
  infrastructure/
    organization-app/          Links into the organisation app
```

Keep product workflows in their own `features/<workflow>` folder, and use
`packages` for stable, product-neutral capabilities shared across applications.
