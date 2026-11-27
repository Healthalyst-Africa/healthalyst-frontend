# Keep branches up to date before they merge plan

Status: Accepted · Issue: [#66](https://github.com/Healthalyst-Africa/healthalyst-frontend/issues/66) · Date: 2026-11-26

## Context

A pull request's checks run against `dev` as it was when they ran. If `dev` moves on before the pull request merges, the branch can still merge, so code that was never checked against the newer `dev` can break it.

The lead developer tried to stop this locally by changing `.husky/pre-push` from `pnpm build` to `git pull origin main && pnpm build`. That edit is uncommitted, and it has three problems:

- the pulled commits are never pushed, because Git decides what to send before the hook runs;
- it pulls `main`, not `dev`;
- a conflict stops the push halfway.

The lead developer decided in #66:

- **Goal:** stop stale merges.
- **Scope:** `dev` only. `main` only ever takes `dev`. Requiring `main` to be up to date would mean merging `main` back into `dev` through an extra pull request before every release.

The outcome:

- A pull request into `dev` can only merge once its branch includes the latest `dev`, and its checks have passed on that.
- Pushing only builds and pushes the branch.

## Files that change

| File                                                     | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/settings/ruleset-dev.json`                      | Set `strict_required_status_checks_policy` to `true` ("Require branches to be up to date before merging")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `scripts/github/repository-settings.test.mjs` (new)      | `node:test` checks for the settings. `dev` requires up-to-date branches and `main` does not, recording the #66 decision. Both still require `verify` and `Dependency review`. After review, it also checks that both rulesets stay `active`, that bypasses go only through pull requests, and that the deletion, force-push, pull request, status check and code scanning rules are all present. `.husky/pre-push` runs no command that changes branches (`git pull`, `merge`, `rebase`, `reset`, `checkout`, `switch`, `stash`), including with options such as `git -C . pull`; commented lines are ignored, and the guard has its own examples. It follows the pattern in `scripts/ci-health/detect-drift.test.mjs`, and the existing `test-scripts` command picks it up |
| `.husky/pre-push`                                        | No committed change: it stays `pnpm build`. The local, uncommitted `git pull origin main &&` edit is discarded, as agreed in #66                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `CONTRIBUTING.md`                                        | Step 5 (**Deploy**) gains one sentence: if `dev` moves on first, update the branch with the pull request's **Update branch** button, or by merging `origin/dev`, so its checks run again. The description of `pnpm test-scripts` adds the branch rules and pre-push hook                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `docs/changes/66-keep-branches-up-to-date/plan.md` (new) | This plan, with status `Accepted`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

`ruleset-main.json`, `apply-repository-settings.sh` and the workflows do not change.

The plan was updated after the verifier and security reviewer read the change. They found that the settings script's preview cannot show this change, and that `--apply` rewrites every setting, so steps 7 and 9 now compare the live rulesets directly and apply only the `dev` ruleset. The test also gained the enforcement and bypass checks above.

CodeQL then flagged the hook guard's first version, a single regular expression, as inefficient (`js/redos`, high): crafted input made it backtrack exponentially, taking more than 17 seconds at 22 repeated options. The guard now reads each hook line word by word, which takes linear time, and that crafted input is one of its test examples.

## Order of work

1. **Branch.** Cut `ci/require-up-to-date-branches` from the latest `origin/dev`. The uncommitted deletions under `docs/screenshots/` belong to #67: they stay unstaged and are never committed here.
   - Proof: `git status` shows only those deletions and the local `.husky/pre-push` edit.
2. **Failing test first.** Add `scripts/github/repository-settings.test.mjs`.
   - Proof: `node --test scripts/github/repository-settings.test.mjs` fails on two assertions. The `dev` ruleset doesn't require up-to-date branches, and `.husky/pre-push` runs `git pull`.
3. **Rule.** Set `strict_required_status_checks_policy: true` in `ruleset-dev.json`.
   - Proof: the ruleset assertion passes.
4. **Hook.** Restore `.husky/pre-push` to the committed `pnpm build`.
   - Proof: the hook assertion passes, and `git diff .husky/pre-push` is empty.
5. **Documentation.** Add the **Update branch** sentence to `CONTRIBUTING.md` step 5.
   - Proof: `pnpm check-format` passes.
6. **Record.** Save this plan as `docs/changes/66-keep-branches-up-to-date/plan.md` with status `Accepted`.
7. **Verify** with `/healthalyst-sdlc:verify-change`, which also runs the verifier agent:
   - `pnpm test-scripts`, then `pnpm test-all`;
   - compare the live rulesets with the files using read-only `gh api` calls. Only "Protect dev"'s `strict_required_status_checks_policy` should differ.
8. **Pull request.**
   - Commit `ci: require branches to be up to date before merging into dev`, with `Closes #66`. Stage the named files only.
   - Push the branch and open a pull request into `dev` with the template, marked "No screen changes".
   - The lead developer reviews and merges it.
9. **Apply after the merge, and only with your go-ahead.**
   - Save the live "Protect main" ruleset (`rulesets/28169844`) for comparison.
   - Apply only the `dev` ruleset: `gh api --method PUT repos/Healthalyst-Africa/healthalyst-frontend/rulesets/28169846 --input .github/settings/ruleset-dev.json`. The settings script's `--apply` is not used, because it rewrites every setting.
   - Proof: `rulesets/28169846` shows `strict_required_status_checks_policy: true`, and "Protect main" is identical to the saved copy.

## Risks

- **Every pull request into `dev` needs updating once `dev` moves.** That's one click and another run of the checks, about two minutes. For one to three developers this is acceptable, and it is the point of the change.
- **Dependabot pull requests fall behind after each merge.** Update them with **Update branch** or `@dependabot rebase`. Updates are grouped weekly, so there are few of them.
- **The riskiest step is step 9,** a live repository setting. It's guarded by comparing the live rulesets with the files first, by sending only the `dev` ruleset, and by confirming afterwards that `dev` changed and "Protect main" did not.
- **Discarding the local hook edit removes the lead developer's own change.** That was agreed in #66 and is recorded here.
- **The hook test could block a legitimate future hook.** It only forbids commands that change branches. Adding lint or tests to the hook still passes.

## Rejected alternatives

- **`git pull origin main` in the hook.** The pulled commits aren't pushed, it pulls the wrong branch, and conflicts stop pushes.
- **Pulling or rebasing on `dev` in the hook.** The pulled commits still aren't part of the push, and the hook silently rewrites local branches.
- **GitHub merge queue.** It's made for busy repositories. Every continuous integration workflow would need a `merge_group` trigger, which is too much for one to three developers.
- **Requiring `main` to be up to date as well.** The lead developer rejected it in #66, because every release would need a `main` → `dev` pull request first.

## Proof

- `node --test scripts/github/repository-settings.test.mjs` fails before steps 3 and 4, and passes after.
- `pnpm test-all` passes, and its result lines are pasted into the pull request.
- Before applying, the live rulesets differ from the files only in "Protect dev"'s strict policy. After applying only that ruleset, `dev` shows the strict policy and "Protect main" is unchanged.
- There are no screen changes, so no screenshots.
