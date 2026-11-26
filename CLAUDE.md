@AGENTS.md

# Working in this repository

The rules above are the engineering standard. This page is what a new joiner,
human or Claude, needs on day one. Keep it under a page and review changes to it
like code. The organisation's lifecycle is in the
[engineering handbook](https://github.com/Healthalyst-Africa/.github/tree/main/engineering).

## How work flows

1. A change starts as a GitHub issue from the **Change request** form.
2. `/healthalyst-sdlc:write-intent`, `/healthalyst-sdlc:write-spec` and, in
   plan mode, `/healthalyst-sdlc:write-plan` write
   `docs/changes/<issue-number>-<slug>/{intent,spec,plan}.md`. Each needs a
   person's acceptance before the next. Small fixes skip to the plan.
3. Nothing is built without an accepted `plan.md`. If the work departs from
   it, update `plan.md` in the same commit.
4. `/healthalyst-sdlc:verify-change` proves the work, then a pull request goes
   into `dev`. `main` only takes `dev` and is what Vercel deploys.

Architecture decisions go in `docs/adrs/`. Read `docs/incidents/` before
diagnosing a failure.

## Commands

| Purpose                 | Command                                          | Healthy result                    |
| ----------------------- | ------------------------------------------------ | --------------------------------- |
| Types for one workspace | `pnpm --filter @healthalyst/<name> check-types`  | Exit code 0, no errors            |
| Tests for one workspace | `pnpm --filter @healthalyst/<name> test`         | `Test Files  N passed`            |
| Lint, including policy  | `pnpm lint`                                      | `Tasks: N successful, N total`    |
| Repository scripts      | `pnpm test-scripts`                              | `fail 0`                          |
| Every gate              | `pnpm test-all`                                  | Exit code 0 after the build       |
| Dev servers             | `.claude/launch.json`: ports 3005, 3006 and 3007 | Page loads with no console errors |

## Verifying your work

Run the narrowest checks for what changed, then `pnpm test-all`, and paste the
result lines before reporting done. For interface changes, open each changed
screen at desktop and mobile widths, check the console and network panel, and
save a screenshot of each new or changed screen under
`docs/screenshots/<change-name>/`. For a bug, write the failing test first and
fix the code, never the test. Never report a check you did not run.

## Things Claude gets wrong

- Pull requests target `dev`, never `main`.
- Every pull request shows a screenshot of each new or changed screen.
- Times read 9:30 am, never 24-hour.
- Required fields carry an asterisk; labels never say "(optional)".
- Applications never import `@healthalyst/ui/primitives/*`; lint enforces it.
- Buttons are `ActionButton`; icons come from `@healthalyst/icons`; tags are
  `StatusLabel` with a `StatusPresentation` defined in the feature's config.
- `StateNotice` is for a whole page, step or panel; `NoticeBanner` is inline.
- No abbreviations in names except `cn`, `ctx` and `FAQ`.
