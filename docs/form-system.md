# Product form system

HealthSchedule uses code-owned form definitions for repeatable field layouts. The
first consumer is organisation registration.

- `packages/ui/src/lib/form-definition.ts` defines supported field metadata.
  It accepts data, never executable schema code.
- `packages/ui/src/components/dynamic-form-fields.tsx` renders those fields with
  shared shadcn controls, labels, descriptions, and inline errors.
- Each application owns its field definitions, copy, request mapping, API calls,
  submission state, and success or failure experience. See
  `apps/health-schedule/src/features/organization-onboarding/components/organization-registration-form-definition.ts`.

HealthSchedule keeps the matching Zod schema in
`apps/health-schedule/src/features/organization-onboarding/model/organization-registration-schema.ts`.
The app-local helper in `src/shared/forms/form-validation.ts` turns schema
errors into field messages and focuses the first invalid control.

To add a form, declare its sections and fields in the owning application, render
`DynamicFormFields` inside a real HTML form, and parse submitted `FormData` with
the owning Zod schema. Map validated values to the workflow's explicit API
request. Use server validation and authorization as the source of truth; client
validation provides immediate feedback only. Never log form values or passwords.

The current field set covers text, email, password, telephone, textarea, and
single select. Form definitions are bundled with the frontend. Organisation
authored forms, conditional fields, file uploads, saved drafts, and published
schema versions require separate product and backend contracts before use.
