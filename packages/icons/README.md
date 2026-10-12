# `@healthalyst/icons`

Shared React icons for HealthAlyst frontend applications and the shared UI
package. The package currently uses Tabler Icons and exposes a small semantic
API so product code does not depend on the vendor's icon names.

```tsx
import { ArrowRightIcon, CheckIcon } from "@healthalyst/icons";

<CheckIcon aria-hidden="true" />
<ArrowRightIcon aria-hidden="true" />
```

Add an icon by exporting it from `src/index.ts` with a descriptive semantic
name. Keep vendor imports inside this package. Use `aria-hidden="true"` for
decorative icons; provide an accessible name when an icon communicates an
action without visible text.
