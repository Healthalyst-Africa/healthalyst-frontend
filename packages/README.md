# Shared packages

Packages provide product-neutral capabilities reused by the client applications:
the Platform API transport (`platform-api`), public environment configuration
(`config`), shadcn primitives and compositions (`ui`), semantic icons (`icons`),
the service worker and install support (`pwa`), shared lint and TypeScript
configurations, and Vitest setup. All shadcn primitives belong in `packages/ui`, including those
currently used by only one application. Keep brand assets, product behavior,
and branded compositions in the owning application.
