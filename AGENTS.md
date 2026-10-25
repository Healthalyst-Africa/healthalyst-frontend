# HealthAlyst frontend engineering rules

## Authority and scope

These instructions apply to the entire `healthalyst-frontend` monorepo, including
applications, shared packages, configuration, and documentation. Read any nearer
`AGENTS.md` before editing a directory. The user's current instructions take
precedence. More specific instructions may add requirements but must preserve the
non-negotiable naming and shared component rules below.

This repository owns HealthAlyst Africa's organisation hub, product spokes and
internal Super Admin client. The first product spoke is HealthSchedule. The parent
`healthAlyst` directory is a workspace containing independent repositories. Keep
application code and tooling inside this monorepo. Do not copy unrelated product
code, repository policies, or branding into it.

## Non-negotiable naming rules

- Use complete, descriptive words for project-authored variables, parameters,
  functions, components, types, properties, filenames, comments, and visible text.
  Do not introduce shorthand or single-letter names, including in callbacks,
  loops, generic type parameters, or temporary variables.
- The user explicitly permits `cn`, `ctx`, and `FAQ`. Their normal casing and
  grammatical forms, such as `faq`, `FAQS`, and `faqs`, are also permitted. This is
  the complete list of discretionary abbreviation exceptions. Do not infer new
  exceptions because an abbreviation is familiar.
- Use `intersectionObserver`, `element`, `description`, `properties`,
  `elementReference`, `navigationLinks`, and `statistics` instead of `obs`, `el`,
  `desc`, `props`, `ref`, `navLinks`, and `stats`. Use meaningful names such as
  `keyboardEvent`, `lineIndex`, and `ElementType` instead of `e`, `i`, and `T`.
- Correct existing project-authored abbreviations immediately when discovered.
  Update definitions, imports, exports, consumers, documentation, and references
  together. Preserve behavior and unrelated work. Report any external dependency
  that prevents a compatible correction.
- Third-party package names, published symbols, proper product names, framework
  filenames, protocol values, schema keys, generated lockfiles, and framework
  attributes are compatibility contracts. Keep their required spelling. Examples
  include `package.json`, `tsconfig.json`, `AGENTS.md`, `next.config.mjs`,
  `components.json`, `@healthalyst/ui`, React's `ref` attribute, HTML's
  `id` and `src` attributes, Tailwind utility names, and environment variable names
  read by tools. This does not permit abbreviated local variables: alias imported
  symbols when needed, such as `cva as createClassVariants`.
- Use camelCase for values and functions, PascalCase for components and types,
  UPPER_SNAKE_CASE for static constants, and kebab-case for ordinary source files.
  Keep framework-required route filenames unchanged.

## Non-negotiable shared shadcn rules

- Use shadcn components as the standard foundation for interactive interface
  primitives. All installed primitives belong in `packages/ui/src/primitives`,
  even when only one application currently uses them. Dedicated HealthAlyst
  compositions built from them belong in `packages/ui/src/components`.
- **Applications must never import or render shadcn primitives directly.**
  Primitives such as `Table`, `Card`, `Badge`, `Input`, `Alert`, and `Dialog`
  are implementation details of `packages/ui`. Compose them inside dedicated,
  reusable shared components with a clear purpose, consistent presentation,
  accessible semantics, and the required loading, empty, error, and interaction
  states. Applications consume those components through `@healthalyst/ui`
  exports and supply their content, data, business rules, and callbacks.
  Renaming or re-exporting a primitive, or adding a wrapper that merely forwards
  its properties, does not satisfy this rule. Review application imports and
  component boundaries before completing every interface change.
- Every new or reworked reusable visual component, including page compositions,
  navigation, form layouts and presentation controls, belongs in `packages/ui`
  and is consumed through `@healthalyst/ui` exports. Compose the shared shadcn
  primitives; keep route entry points, content and application behaviour in the
  owning app. Do not introduce a separate application-local component foundation.
- The package is exported as `@healthalyst/ui`. Import components through its
  published exports, for example `@healthalyst/ui/components/action-button`.
  Never reach into another workspace's source using relative paths or duplicate
  primitives inside an application.
- Product code must use the shared `ActionButton` from
  `@healthalyst/ui/components/action-button` for buttons. Do not import or render
  the shadcn `Button` primitive directly in applications or other shared
  components. The `ActionButton` component in `packages/ui` is the only allowed
  consumer of the underlying `button` primitive; it provides shared loading,
  disabled, and icon behavior. Use links for navigation rather than wrapping a
  button in an anchor.
- Application-specific branded wrappers may live in
  `apps/health-schedule/src/components/ui`, but must consume the dedicated shared
  components rather than shadcn primitives. Keep HealthAlyst colours, typography, copy, layout, and business
  behavior in the application. Shared components and tokens remain product-neutral.
- Branded wrappers are thin adapters supplying content and theme values to shared
  components. Reusable visual structure belongs in the shared package.
- Both the application and shared package must retain a valid `components.json`.
  Align their style, icon library, base colour, and component aliases. Keep the
  shared stylesheet and component destinations correctly resolved. Do not switch
  presets, component foundations, or Tailwind major versions as a side effect.
- Inspect the existing component and official documentation before adding one.
  If a required primitive is absent, install it from the official shadcn registry
  into the shared package and declare its runtime dependencies there. Add only
  what the requested change needs.
- From the monorepo root, inspect configuration and planned additions with:

  ```sh
  pnpm dlx shadcn@latest info --cwd apps/health-schedule --json
  pnpm dlx shadcn@latest add <component-name> --cwd apps/health-schedule --dry-run
  pnpm dlx shadcn@latest add <component-name> --cwd apps/health-schedule
  ```

- Review generated code before accepting it. Adapt generated local names to the
  naming rule, preserve existing changes, and never blindly overwrite components.
  Confirm the generated source is compatible with installed React and Tailwind.
- Reuse shared variants and `cn`; use branded wrappers for presentation changes.
  Preserve primitive semantics, focus behavior, keyboard interaction, disabled
  states, and accessible names. Do not rebuild dialogs, menus, accordions, or form
  controls as custom clickable containers when a shared primitive exists.
- Keep package exports, shared styles, Next.js transpilation, and Tailwind source
  scanning aligned when adding or moving components.
- Product and shared UI code must import icons through the `@healthalyst/icons`
  workspace package. Do not import an icon library directly in applications or
  `packages/ui`. Add icons to the shared package API with semantic names when
  needed. The package owns the chosen third-party icon dependency, keeping
  applications independent of that vendor's package API. When adding shadcn
  components, route generated vendor imports through the shared icon package.

## Icons and illustrations

### Choosing between an icon and an illustration

| Need                                                                                       | Use                               |
| ------------------------------------------------------------------------------------------ | --------------------------------- |
| Inside text, buttons, navigation, menus, form fields, table cells, metric tiles (16–24 px) | `@healthalyst/icons`              |
| A focal image for a state or section: empty, success, error, onboarding (48 px and larger) | `@healthalyst/ui/illustrations/*` |

- Never use an illustration as an interface icon. Illustrations have fixed
  multi-colour fills, a background disc and detail drawn for about 144 px; at
  icon size they blur and cannot follow `currentColor`, hover, active, focus or
  disabled states.
- Never scale an icon up to stand in for an illustration.

### Icon semantics

- Each icon must describe the meaning of the thing it labels, not merely look
  related. For example, use a clock or hourglass for "Pending review", a
  pencil or flagged message for "Changes requested" and a checked circle for
  "Approved".
- Do not reuse one icon for different concepts on the same screen or in the
  same navigation. A metric, navigation item and status that mean different
  things need visibly different icons.
- A tick or check means complete or approved; never use it for waiting or
  in-progress states.
- Export icons from `@healthalyst/icons` under semantic names that describe
  their purpose, such as `PendingIcon` or `ApprovedIcon`, rather than the
  vendor's drawing name. Keep to the single icon family the package wraps;
  do not mix in a second icon set.
- Decorative icons beside visible text are `aria-hidden`. Icon-only controls
  need an accessible name.

### Illustration sourcing and storage

- Illustrations come from GitLab SVGs (`@gitlab/svgs`, MIT licence). Keep to
  that one geometric style; do not mix in other illustration libraries.
- The full raw download, when present, is a local catalogue in the hidden
  `.illustration-library/` folder at the repository root. It is excluded
  through `.git/info/exclude`, is never committed and is never imported by
  application or package code.
- Take only what a change needs. Convert each chosen illustration into a React
  component in `packages/ui/src/illustrations/`, using the theme colours in
  `illustration-colours.ts`, `aria-hidden="true"` and `focusable="false"`.
  Record the original GitLab name in a comment and keep the MIT notice in
  `illustration-colours.ts`.
- Never commit raw SVG downloads, and never copy GitLab's logo or mascot, or
  any third-party brand logo; those are trademarks outside the MIT licence.
- Applications import illustrations only through
  `@healthalyst/ui/illustrations/<name>` and put the meaning in nearby text.

## Repository structure and tooling

| Location                                | Responsibility                                                              |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `apps/<application>/src/app`            | Thin Next.js routes, layouts, metadata and server handlers                  |
| `apps/<application>/src/features`       | Owned workflows with components, hooks, services, schemas, types and config |
| `apps/<application>/src/config`         | App-wide routes and configuration                                           |
| `apps/<application>/src/infrastructure` | Application-wide providers and runtime setup                                |
| `apps/<application>/src/shared`         | App-local helpers used by multiple workflows                                |
| `apps/<application>/src/components`     | Thin branded wrappers                                                       |
| `apps/<application>/public`             | Files served directly by public paths                                       |
| `packages/platform-api`                 | Shared browser transport, authentication contracts and refresh lifecycle    |
| `packages/icons`                        | Semantic icon exports                                                       |
| `packages/ui`                           | Shared shadcn primitives, neutral tokens, reusable interface utilities      |
| `packages/eslint-config`                | Shared lint configuration                                                   |
| `packages/typescript-config`            | Shared strict compiler configuration                                        |
| `packages/test-utilities`               | Shared testing setup                                                        |

- Read manifests rather than assuming versions. The current stack uses Next.js
  App Router, React, TypeScript, Tailwind 3, pnpm workspaces, and Turborepo.
- Use the pnpm version pinned in the root manifest and a supported Node.js
  version. Keep `pnpm-lock.yaml` as the sole dependency lockfile. Declare workspace
  dependencies with `workspace:*` and package dependencies in their owning package.
- Preserve strict peer dependency checks, shared compiler and lint presets,
  standalone build tracing, and explicit package exports. Do not hide failures by
  disabling rules, skipping checks, adding broad type assertions, or setting
  `ignoreBuildErrors` to true.
- Use `~/` for application source imports and package exports for workspace
  imports. Applications must not depend on other applications.
- Keep route files thin. Place product behavior in the owning feature, runtime
  setup in `infrastructure`, and app-local helpers in `shared` only when more
  than one workflow uses them. Keep query hooks separate from HTTP clients and
  form definitions; do not use `lib` as a catch-all folder.
- Follow `docs/code-organization.md`. Keep configurable rules beside their owner;
  do not create a global constants dump. Contracts and configuration must not
  depend on components, workflow hooks or request services. Create dedicated
  folders only when they have a real responsibility and consumer.
- Keep changes focused. Do not upgrade dependencies, replace the state system,
  add new services, or introduce new build tools without a task requirement.

## Next.js and TypeScript

- Default to Server Components. Place `"use client"` only at the smallest boundary
  needing browser events, state, effects, context, or browser-only libraries.
  Avoid moving entire routes to the client for one interactive section.
- Keep secrets and privileged operations on the server. Server-to-client
  properties must be serializable. Validate every external input at the boundary.
- Keep strict types. Prefer explicit domain types and discriminated unions over
  `any`, unchecked casts, non-null assertions, or silent fallback data.
- Define form validation in Zod schemas owned by the application. Keep field
  limits, cross-field rules, and request shaping out of form components and
  shared visual packages. Show schema errors beside their fields and focus the
  first invalid control.
- Use Next.js routing, metadata, fonts, and image features appropriately. Keep
  route metadata, canonical addresses, and public configuration consistent with
  the deployed environment. Never publish localhost canonical addresses.
- Handle asynchronous loading, empty results, failures, and recovery when a
  feature introduces asynchronous work. Do not add decorative states with no
  real behavior behind them.
- Clean up effects and subscriptions. Keep hooks deterministic and accessible
  content usable before hydration. Respect reduced motion for reveals and scroll.

## API and HTTP workflow

- Use Axios for browser HTTP requests to backend applications. Do not introduce
  `fetch` unless the user explicitly requests it. Declare Axios and TanStack
  React Query in the owning application, not in product-neutral UI packages.
- Configure one Axios instance per backend boundary in the owning application's
  API layer. Read its public base address from a documented environment variable,
  set a finite timeout, and fail clearly when configuration is missing. Keep
  secrets out of `NEXT_PUBLIC_*` values and never put access tokens in URLs.
- Put endpoint paths, request and response shapes, response validation, bearer
  headers, and HTTP error translation in application API services. Components
  must not construct URLs, call Axios directly, or parse transport errors.
- Use a scoped TanStack Query provider for application data. Keep query keys in
  the API layer, use `useQuery` for reads and `useMutation` for writes, and
  invalidate or separate cached data when the signed-in identity changes. Do
  not put passwords or bearer tokens in query keys or persist the query cache.
- Handle conflict, validation, unauthorized, forbidden, timeout, and connection
  failures explicitly. Retry only safe reads when appropriate; never retry a
  registration or other write automatically. Keep API errors recoverable in the
  relevant form or page.
- Match credentials and token handling to each backend's actual contract. The
  NestJS Platform API returns bearer access tokens and sets an HttpOnly refresh
  cookie. The shared transport keeps access tokens in private browser memory,
  coordinates refresh and restores identity through `/v1/me`. Keep credentials out
  of browser persistence, query data and navigation URLs. A transport-only `/v1`
  rewrite may preserve the API cookie contract for local/Render use; do not add
  frontend session storage, custom auth cookies or OAuth flows without a matching contract.
- Review the backend contract before adding a call. Keep application-specific
  services and hooks inside their application; move code to a shared package only
  when multiple products genuinely share a stable, product-neutral contract.

## HealthSchedule onboarding requirements

- Follow the HealthAlyst marketing website's design system
  (https://www.healthalystafrica.com, `DESIGN.md` in the `marketing-module`
  repository):
  - **Palette, "green and gold":** primary green `#145A46`, ink `#112C23`,
    secondary text `#40584E`, cream ground `#FAF7EF`, green tint `#EAF2EC`,
    borders `#CDDCD2`, control outline `#748B80`, brand gold `#C8A062`, pale
    gold `#E4D0B1` for gold on green, subtle gold `#FFFCF5`, error `#B42318`.
    Gold reaches only 2.4:1 on white: use it for markers and decoration, never
    for text, focus or buttons on light surfaces. shadcn's `accent` token is
    the green hover tint here; the brand gold is the `gold` tokens.
  - **Surfaces:** pages are white (`bg-card`), like the marketing website.
    The cream `background` token is for occasional bands only, not the page.
  - **Typography:** Young Serif (`font-serif`) for page, section and panel
    headings, always `font-normal` because it has a single heavy weight; Inter
    (`font-sans`) for all other text.
  - **Shape:** full-pill buttons with semibold labels; fields with a soft
    border (the control outline at 35%) that darkens on hover, and a 2 px focus
    ring offset from the edge.
  - Use semantic shadcn tokens and the compact radius scale. Keep the product
    app's theme values in its CSS variables and Tailwind token map; do not
    scatter raw brand colors across components. Keep `packages/ui`
    product-neutral.
- Keep product names, capabilities, and application statuses consistent with
  approved requirements. Do not invent verification outcomes or compliance claims.
- Use clear, complete English and connect each action to a real route or operation.
- Registration forms require persistent labels, validation, accessible errors,
  submitting states, and confirmed success or recoverable failure. A simulated
  response is not a working registration.
- Collect only organisation and administrator details approved for onboarding. Do
  not request patient records or sensitive medical details.
- Keep pending organisations restricted to application status and recovery steps.
  Enforce organisation membership, approval status, and permissions on the server.
- Show loading, empty, error, unauthorized, and success states where applicable.
- Support keyboard navigation, visible focus, semantic landmarks, one primary
  heading per page, logical heading order, descriptive image alternatives, and
  accessible names for icon controls. Decorative icons must be hidden from
  assistive technology. Target Web Content Accessibility Guidelines 2.2 level AA.
- Design for narrow mobile screens through desktop. Check navigation collapse,
  long expanded text, touch targets, form controls, and horizontal overflow.
  Avoid hiding essential information to make a layout fit.
- Use `next/image` with useful alternative text, correct dimensions or constrained
  fill containers, and responsive sizes for product imagery.
- Keep static content rendered on the server where practical. Avoid unnecessary
  client dependencies, heavy animation libraries, oversized images, layout shifts,
  and eager loading of below-the-fold media. Preserve reduced-motion behavior.

## Security and privacy

- Never expose, copy, log, commit, or invent credentials. Only documented public
  values belong in `NEXT_PUBLIC_*`; all such values are visible to visitors.
- Keep local environment files untracked. Document required variable names and
  purpose in a safe template without real values. Declare build environment inputs
  in Turborepo when adding environment-dependent behavior.
- Validate and constrain enquiry submissions server-side when integrating them;
  handle abuse and duplicate submissions without leaking private details.
- Add analytics, cookies, trackers, and third-party scripts only with an approved
  purpose and appropriate privacy handling. Keep personal and medical information
  out of analytics events and diagnostic logs.

## Working process and completion evidence

1. Inspect repository status, applicable instructions, manifests, relevant source,
   and documentation. Preserve user-owned and unrelated edits.
2. Maintain a short plan for substantial work. Use applicable Next.js and shadcn
   skills and official documentation for version-sensitive changes.
3. Implement a coherent change, correcting discovered naming violations and
   keeping shared component ownership intact.
4. Review imports, exports, dependencies, content, accessibility, and the complete
   diff. Format changed files only; avoid broad unrelated reformatting.
5. Run the narrowest relevant checks, then the repository completion gates.
   Respect active user or platform restrictions on verification scope and report
   any omitted gates explicitly. The commands below are the available gates;
   never claim a check that was not run.
6. For requested browser verification, exercise affected desktop and mobile
   journeys and inspect console and network errors. Distinguish runtime evidence
   from successful compilation.
7. Report changes, actual evidence, failures, limitations, and remaining work.
   Never claim production readiness from a documentation update alone.

```sh
pnpm install --frozen-lockfile
pnpm check-format
pnpm lint
pnpm check-types
pnpm test
pnpm build
pnpm test-all
```

`pnpm test-all` includes tests. Vitest and Testing Library are configured; a
successful `--passWithNoTests` run does not establish test coverage. The configured
continuous integration workflow runs `pnpm test-all` on pull requests and pushes
to `main`. Do not bypass failing checks or invent approvals, protected-branch
rules, hooks, or ticket systems that this repository does not configure.

Do not commit, push, publish, deploy, send external messages, or mutate production
unless the user authorizes that action. Summarize shared package or configuration
changes explicitly so reviewers can assess all affected applications.

## Primary references

- [Next.js documentation](https://nextjs.org/docs)
- [shadcn monorepo configuration](https://ui.shadcn.com/docs/monorepo)
- [shadcn components configuration](https://ui.shadcn.com/docs/components-json)
- [Turborepo documentation](https://turborepo.com/docs)
- [Accessibility standard](https://www.w3.org/TR/WCAG22/)

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
