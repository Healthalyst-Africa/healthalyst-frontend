# Change records

Every feature and every significant fix gets a folder here, named after its
GitHub issue: `docs/changes/<issue-number>-<short-name>/`, for example
`docs/changes/142-triage-and-vitals/`. The folder holds what each stage of the
[delivery lifecycle](https://github.com/Healthalyst-Africa/.github/blob/main/engineering/software-development-lifecycle.md)
produced, so anyone can see why the code is the way it is.

| File        | Stage  | Written with                     | Accepted by                     |
| ----------- | ------ | -------------------------------- | ------------------------------- |
| `intent.md` | Plan   | `/healthalyst-sdlc:write-intent` | The product owner               |
| `spec.md`   | Design | `/healthalyst-sdlc:write-spec`   | The lead developer              |
| `plan.md`   | Build  | `/healthalyst-sdlc:write-plan`   | The developer who will build it |

Each file starts with a status line: `Draft`, `Accepted`, `Superseded` or
`Closed`. Acceptance is a merged pull request or a commit that changes the
status, so git history records who accepted what and when.

## When to skip

A small fix (a typo, a one-file bug fix, a dependency update) needs no
folder. Write the reasoning in the pull request instead. If a fix turns out
to need design, stop and write an `intent.md`.

## Keeping records true

- If the work departs from `plan.md`, update it in the same commit as the code.
- Never put patient records, personal details or credentials in a record.
- Keep the folders after the work ships. Mark replaced records `Superseded`
  and link their replacement.
