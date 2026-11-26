---
status: accepted
date: 2026-11-26
decision-makers: "@gh-i19n"
---

# 002 Release records for Vercel deploys

## Context and problem statement

Vercel's Git integration deploys `main` to production on every push, and
GitHub held no record of those deployments. Without one, the team cannot say
what reached production when, roll back by name, or measure deployment
frequency and lead time. How should releases be recorded?

## Decision drivers

- Vercel remains the deployer; the record must not become a second
  deployment path.
- `dev` is merged into `main`; nothing should commit to `main` directly.
- The record should need no extra step from developers.

## Considered options

- release-please, generating versioned changelogs from Conventional Commits.
- Changesets.
- A GitHub Release per push to `main`, named by date, with generated notes.

## Decision outcome

Chosen option: a GitHub Release per push to `main`, named `vYYYY.MM.DD.N`,
because it records every production deploy automatically without changing
the branch flow. release-please opens its own release pull requests into
`main`, which would bypass `dev` and need merging back after every release.
Changesets suits published packages, and these applications are not
published.

### Consequences

- Good, because each production deploy has a permanent, linkable record with
  the pull requests it contained.
- Good, because the delivery metrics workflow can measure deployment
  frequency, lead time and change fail rate from the releases.
- Bad, because a release is recorded even if Vercel's deployment then fails;
  check the Vercel deployment when investigating an incident.
- Neutral, because the apps keep their `package.json` versions unchanged;
  the date-based tag is the release identity.

### Confirmation

The `Release record` workflow runs on every push to `main`; its absence from
the Releases page after a merge is a failure to investigate.
