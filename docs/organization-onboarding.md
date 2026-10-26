# Organisation onboarding

The organisation hub uses `/onboarding` after sign-in and email confirmation.
Older `/application` links redirect to it. The backend resource remains
`/v1/onboarding/application`.

The first screen uses the organisation frame in the
[Figma reference](https://www.figma.com/design/kHA7dAre3U7zB3AwlywmHI/Healthalyst-Africa?node-id=31-3450)
as layout inspiration: a pinned full-width account header, a progress sidebar and a
focused organisation-details form. It uses the shared UI theme and components.
The browser canvas was available; structured inspection through the Figma
connector was denied by its file-access check.

## Implemented onboarding flow

- Restore the signed-in account, then load `GET /v1/onboarding/application`.
- Prefill organisation identity, contact and address fields from the response.
- Save edited fields through `PATCH /v1/onboarding/application`, using the ETag
  associated with the draft in `If-Match`.
- Show field validation, pending state, save confirmation and recoverable errors.
- On a version conflict, explicitly reload the newer profile and retain the
  user's edited fields for review. Never retry a write automatically.
- Respect `canEdit`: submitted and other locked applications display read-only
  details. Completion indicators come from the backend checklist.
- Use the subtle gold surface (`#F5DDBA`) at 30% opacity for the current step,
  with solid gold progress markers. Inactive steps have muted text and filled
  number markers. The details form has no duplicate checklist
  or document-requirements accordion below it.
- Failed sign-out keeps the session and displays the error.
- Reviewer feedback remains in the application status alert when changes are
  requested or the application is locked.
- Continue to account verification only after the organisation profile is saved
  and complete. Email and authenticator completion are read from the application
  checklist; administrators can request and verify a phone code in this step.
- Continue to supporting documents when account verification is complete. Show
  the document requirements returned by the API, upload supported PDF/JPEG/PNG
  files through the presigned storage URL, and allow documents to be removed
  before submission.
- Review the server checklist and submit the application using its current ETag.
  Submission errors remain recoverable; locked applications show their status.

The reusable page layout, progress presentation and controlled field rendering
live in `@healthalyst/ui`. The organisation app owns form definitions, schemas,
draft state, API calls, account context and route decisions.

## Out of scope

Branches, departments, staff and other product setup remain separate workflows.

The Figma operating schedule has no fields in the current onboarding request
contract. The screen therefore collects only supported organisation fields.
