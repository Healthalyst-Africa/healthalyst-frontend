# Shared interface components

`@healthalyst/ui` owns all shadcn primitives in the healthalyst-frontend monorepo, including
components currently consumed by only one application. Keep tokens and primitive
behavior product-neutral. Product branding and content belong in the owning application. Reusable visual
structure belongs here, composed from these primitives and supplied with
application content and semantic theme values.

## Public imports

Applications import only the dedicated compositions in
`@healthalyst/ui/components/<name>`:

| Need                                       | Component                                        |
| ------------------------------------------ | ------------------------------------------------ |
| Buttons                                    | `action-button`                                  |
| Surfaces for a task, with heading/footer   | `content-panel`                                  |
| Loading and failure page states            | `status-panel`, `loading-placeholder`            |
| Empty lists, queues and no-result states   | `empty-state`                                    |
| Outcome dialogs (success, error, warning)  | `feedback-dialog`                                |
| Notices and status labels                  | `notice-banner`, `status-badge`, `status-label`  |
| File uploads with drag and drop            | `file-upload-field`                              |
| Review pages before submitting a workflow  | `review-summary`                                 |
| Form-level errors and confirmations        | `form-message`                                   |
| Labelled controls with validation messages | `text-field`, `text-area-field`, `select-field`, |
|                                            | `checkbox-field`, `one-time-code-field`          |
| Custom or embedded controls                | `labelled-control-group`                         |
| Metadata-driven forms                      | `dynamic-form-fields`                            |
| Optional help                              | `expandable-section`                             |
| Page and workspace layouts                 | `split-panel-layout`, `onboarding-layout`,       |
|                                            | `dashboard-shell`, `account-menu`,               |
|                                            | `notification-panel`                             |
| Other compositions                         | `data-table`, `filter-bar`, `metric-summary`,    |
|                                            | `onboarding-progress`,                           |
|                                            | `qr-code`, `rotating-photograph-panel`,          |
|                                            | `search-field`, `section-heading`,               |
|                                            | `workflow-heading`                               |

The shadcn primitives in `@healthalyst/ui/primitives/<name>` are building
blocks for those compositions only. Applications must not import them; when an
application needs something new, add or extend a composition here.

- `@healthalyst/ui/lib/utilities` exports the approved `cn` helper.
- `@healthalyst/ui/styles.css` provides neutral theme variables.

`ActionButton` is the only consumer of the underlying button primitive. Apps and
other compositions must use it for loading, disabled and icon behaviour.

## Internal organisation

- `primitives/`: shadcn registry primitives, adapted only for naming,
  Tailwind 3 and shared icons. `dropzone` comes from the Kibo UI registry
  (`@kibo-ui/dropzone`) and uses react-dropzone for drag and drop.
- `components/`: dedicated HealthAlyst compositions built from the primitives.
- `components/forms/` and `components/data-table/`: private renderers used by
  their compositions.
- `types/`: reusable form metadata and photograph contracts.
- `forms/`: form-definition operations, exported independently of rendering.
- `hooks/`: browser behaviour such as reduced-motion preference.
- `config/`: neutral sidebar and photograph rotation defaults.
- `lib/`: the existing class-name utility required by shadcn configuration.

Import form contracts through `@healthalyst/ui/types/form-definition` and
operations through `@healthalyst/ui/forms/form-definition`. Keep component-local
properties beside the component; do not export every internal file.

The input, textarea, and accordion sources were installed from the official
`new-york` shadcn registry for Tailwind 3. Native select was installed from the
official `new-york-v4` registry and adapted to Tailwind 3: local utility import,
`shadow-sm`, descriptive names, and a full-width wrapper. Its native selection
semantics remain intact. The visual `controlSize` property leaves the native numeric
`size` attribute available. Dependencies are declared in this package.

## Adding components

From the monorepo root, inspect the existing installation and planned changes:

```sh
pnpm dlx shadcn@latest info --cwd apps/health-schedule --json
pnpm dlx shadcn@latest add <component-name> --cwd apps/health-schedule --dry-run
pnpm dlx shadcn@latest add <component-name> --cwd apps/health-schedule
```

Application aliases direct primitives into `src/primitives` and the class
utility into this package.
Both `components.json` files must retain aligned styles and destinations. Review
new dependencies, generated configuration changes, and compatibility with the
installed Tailwind version. Never overwrite customized source blindly. Generated
local names must follow the root `AGENTS.md` naming requirements.

The shared button's `unstyled` variant and size allow branded compositions to
supply presentation while retaining its underlying behavior. The accordion
trigger's `showIndicator` option lets a composition supply its own indicator.
Native select retains browser-native options and forwards standard selection
attributes, including the element reference.

The card, radio group, field, label, separator and alert sources were installed
from the official shadcn registry. The field's responsive and selected-state
utilities were adapted for Tailwind 3. Only the radio group, label and separator
needed additional Radix dependencies.

Applications must load the shared stylesheet, transpile this package through
Next.js, and include its source in Tailwind scanning. Import through package
exports rather than relative paths into another workspace.

## Stylesheet

`src/styles.css` defines the neutral light and dark token sets shared by every
primitive. An application overrides the semantic roles it needs in its own global
stylesheet, loaded after this one, and supplies any brand aliases its Tailwind
configuration consumes.

## Illustrations

`@healthalyst/ui/illustrations/<name>` exports decorative illustrations as
React components. Every illustration used by an application lives here, never
in an application's `public` folder.

- Source: [GitLab SVGs](https://gitlab.com/gitlab-org/gitlab-svgs) (the
  `@gitlab/svgs` package), under the MIT licence. Keep its copyright and
  permission notice, which lives in `illustrations/illustration-colours.ts`.
  Keep to this one geometric style so illustrations look consistent.
- Record each illustration's original GitLab name in a comment in its file.
- Convert artwork to a `.tsx` component with no scripts, external references or
  embedded raster images. Replace GitLab's colour variables with
  `ILLUSTRATION_COLOURS` from `illustrations/illustration-colours.ts`, so illustrations follow
  each application's palette and stay product-neutral.
- Illustrations are decorative: consumers hide them from assistive technology
  and put the meaning in nearby text.
