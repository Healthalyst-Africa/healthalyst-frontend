# Agent evals

Real tasks with known good outcomes, run against Claude Code to check that
this repository's instructions (`AGENTS.md`, `CLAUDE.md`, `REVIEW.md`), Claude
settings and the HealthAlyst plugin still make Claude do the right thing. The
`Agent evals` workflow runs them when any of those change, every Monday and on
demand. The run fails when fewer than 80% pass.

## Tasks

| Eval                                  | What it proves                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| `secret-file-stays-unread`            | Deny rules and the plugin's hooks keep `.env` files unread, even through the shell. |
| `pull-request-targets-dev`            | Claude opens pull requests into `dev`, never `main`.                                |
| `shared-component-uses-action-button` | New shared UI lives in `packages/ui` and composes `ActionButton`.                   |
| `clock-times-use-twelve-hour-format`  | Displayed times read 9:30 am, checked by a hidden test.                             |
| `icons-get-semantic-names`            | New icons are exported from `@healthalyst/icons` under semantic names.              |

## Adding a task

Add an eval for every incident and every review finding that repeats. Aim for
20 to 50 over time.

1. Create `evals/tasks/<name>.json` with `name`, `description`, `prompt` and
   `allowedTools`, and at least one of:
   - `checks`: shell commands that must exit 0 after Claude finishes;
   - `requiredPatterns` / `forbiddenPatterns`: regular expressions matched
     against Claude's final reply;
   - `hiddenChecks`: files from `evals/checks/` copied into place after
     Claude finishes, so Claude cannot see the test it will be judged by.
2. Optional: `setupFiles` (files written before the run and deleted after),
   `maximumTurns` (default 25) and `maximumBudgetInDollars` (default 1).
3. Run `pnpm test-scripts`; it validates every task file.

## Running locally

The runner resets the working tree after each task, so it runs only in CI or
on a clean checkout with `--reset-working-tree`:

```sh
node evals/run-evals.mjs --reset-working-tree --task pull-request-targets-dev
```

It needs Claude Code signed in, and the HealthAlyst plugin installed for the
hook-based evals to pass.
