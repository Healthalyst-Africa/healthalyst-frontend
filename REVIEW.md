# Review rules

Claude reviews every pull request with these rules. Its findings inform the
person who approves; they never approve or block a pull request on their own.

## Passes

Review the diff once for each pass and tag every finding with its pass.

1. **[bug]** Correctness: wrong behaviour; missing loading, empty, error,
   unauthorised or recovery states; broken keyboard or focus behaviour;
   effects or subscriptions that are not cleaned up; stale or racing queries
   and mutations; a write that is retried automatically.
2. **[security]** Security and privacy: tokens or credentials in URLs, logs,
   query keys or browser storage; secrets in `NEXT_PUBLIC_*` values; personal,
   patient or organisation data reaching the service worker cache, analytics
   or logs; unvalidated external input; access decided only in the browser;
   untrusted input inside a workflow `run:` script.
3. **[policy]** Compliance with `AGENTS.md`, `CLAUDE.md` and the change's
   `docs/changes/` records: shared component ownership, `ActionButton`,
   `@healthalyst/icons`, `StatusLabel` tags, illustrations and notices,
   names without abbreviations, Axios and TanStack Query boundaries, WCAG 2.2
   AA, and behaviour the specification did not ask for.

## Severity

- **Important:** breaks behaviour, leaks data, blocks a task for keyboard or
  screen reader users, or breaks a rule in `AGENTS.md`. Give the failure
  scenario.
- **Nit:** anything else worth saying. Report at most five and summarise the
  rest as a count.

Say plainly when there are no Important findings.

## Skip

- `pnpm-lock.yaml`, `next-env.d.ts`, `*.tsbuildinfo` and other generated files.
- Formatting, lint and type errors, which CI enforces.
- Images under `docs/screenshots/`, except to confirm each new or changed
  screen has one.
