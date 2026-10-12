# Shared packages

Packages provide product-neutral capabilities reused by the client applications:
shared lint and TypeScript configurations, shadcn interface primitives, and
Vitest setup. All shadcn primitives belong in `packages/ui`, including those
currently used by only one application. Keep brand assets, product behavior,
and branded compositions in the owning application.
