# Incident reviews

Blameless reviews of production incidents, failed releases, CI health alerts
and repeated review findings. Read these before diagnosing a failure: the
same cause often returns.

- Name each review `<yyyy-mm-dd>-<short-name>.md`, dated when the incident
  started. Write it with `/healthalyst-sdlc:review-incident`.
- Open a GitHub issue labelled `incident` for every production incident. The
  delivery metrics use these issues to measure change fail rate and recovery
  time.
- Every review ends with what will catch the problem next time: a test, an
  eval in `evals/tasks/`, a line in `CLAUDE.md`, a rule in `REVIEW.md` or a
  lint rule.
- A personal data breach must be reported to the Nigeria Data Protection
  Commission within 72 hours of discovery. Follow the
  [incident response guide](https://github.com/Healthalyst-Africa/.github/blob/main/engineering/incident-response.md)
  immediately; do not wait for the review.
- Never put patient records, personal details, credentials or tokens in a
  review. Describe the data involved by type, not by content.

| Date | Review | Caught next time by |
| ---- | ------ | ------------------- |
