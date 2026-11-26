# Architecture decision records

An architecture decision record (ADR) captures one significant decision: the
problem, the options considered, what was chosen and what follows from it.
Write one when a decision is hard to reverse, affects more than one package,
adds a dependency or vendor, or touches personal or health data.

- File names are `NNN-short-title.md`, numbered in order, matching the
  backend repository's `docs/adrs/`.
- New records use the [MADR 4.0](https://adr.github.io/madr/) sections in
  [`template.md`](template.md). Write them with `/healthalyst-sdlc:write-adr`.
- A record is accepted when its pull request merges. Never rewrite an
  accepted record; supersede it with a new one and link both ways.

| Record                                                                                  | Status   |
| --------------------------------------------------------------------------------------- | -------- |
| [001 Adopt the AI-native delivery lifecycle](001-adopt-ai-native-delivery-lifecycle.md) | Accepted |
| [002 Release records for Vercel deploys](002-release-records-for-vercel-deploys.md)     | Accepted |
