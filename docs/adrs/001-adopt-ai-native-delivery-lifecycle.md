---
status: accepted
date: 2026-11-26
decision-makers: "@gh-i19n"
---

# 001 Adopt the AI-native delivery lifecycle

## Context and problem statement

Claude now writes much of this repository's code, but the way work is
planned, reviewed and released had not changed. Pull requests were merged by
their authors without review, `main` and `dev` had no protection, actions
were pinned by tag, and nothing recorded why a change was made or how it was
verified. How should a team of one to three developers deliver safely when an
agent produces most of the code?

## Decision drivers

- Patient and organisation data are involved, so security and the Nigeria
  Data Protection Act 2023 apply to how software is built, not only to what
  it does.
- Human review of every line does not scale; controls must be enforced by
  tooling, not habit.
- The process must be light enough for one developer and grow with the team.
- The backend and marketing site should be able to adopt the same process.

## Considered options

- Keep the current informal process.
- A repository-only setup with local instructions and scripts.
- An organisation layer (handbook, shared Claude plugin, reusable workflows)
  that each repository adopts, following Anthropic's AI-native SDLC playbook,
  NIST SSDF and OpenSSF Scorecard.

## Decision outcome

Chosen option: the organisation layer, because it gives every repository the
same lifecycle, guardrails and review without copying files, and maps each
control to a recognised standard.

Every stage ends by committing an artifact the next stage reads: an issue and
`intent.md`, `spec.md`, `plan.md`, a verified pull request into `dev`, a
release record when `dev` reaches `main`, and incident reviews that feed new
intents. People accept each artifact; Claude produces most of them.

### Consequences

- Good, because policies are enforced by lint rules, hooks, rulesets, CodeQL,
  dependency review and secret scanning instead of memory.
- Good, because changes are traceable from issue to release.
- Bad, because each developer must install the shared Claude plugin once, and
  Claude review, evals and diagnosis need an Anthropic API key and budget.
- Bad, because a solo developer must use the recorded administrator bypass to
  merge into `main`, which lowers the OpenSSF Scorecard review score until a
  second reviewer joins.

### Confirmation

- `pnpm lint` enforces the shared component and icon import rules.
- The `Agent evals` workflow checks that Claude still follows the rules
  whenever instructions or settings change.
- The `OpenSSF Scorecard` workflow reports the repository's standing weekly.

## More information

- [Engineering handbook](https://github.com/Healthalyst-Africa/.github/tree/main/engineering)
- [HealthAlyst Claude plugin](https://github.com/Healthalyst-Africa/claude-plugins)
- [Anthropic: The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook)
- [NIST SP 800-218 Secure Software Development Framework](https://csrc.nist.gov/projects/ssdf)
- [OpenSSF Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md)
