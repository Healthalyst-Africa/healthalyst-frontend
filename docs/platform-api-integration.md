# Platform API integration: analysis and plan

Status: analysis for review, 22 October 2026. Nothing in the applications has
changed yet.

This document compares the backend team's **Platform API** (identity,
organisations and onboarding) with the screens in this repository and the
current Java Accounts API, and proposes how to integrate it with a switch
between the two backends.

Sources:

- Platform OpenAPI 3.1, "Healthalyst platform API" 1.0.0, served by the
  development API at `https://healthalyst-platform-api-dev.onrender.com`
  (Swagger at `/docs/swagger/`, behind HTTP Basic sign-in; specification at
  `/docs/platform.openapi.json`). 88 operations on 77 paths.
- HealthSchedule and LabConnect specifications (5 operations each:
  organisation context, operations and health). Not needed for onboarding.
- `healthalyst-backend-java` (`apps/accounts`, port 8081) and the current
  `apps/health-schedule` and `apps/super-admin` code in this repository.

The Java controllers will later be refactored to follow the Platform endpoint
structure. The plan below therefore treats the Platform contract as the
target, and the Java contract as a temporary adapter.

## 1. What the Platform API provides

| Area         | Operations | Purpose                                                                                                                                            |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth         | 21         | Password login, mandatory multi-factor authentication (TOTP or recovery code), refresh cookie, context switching, sessions, email, phone, password |
| Onboarding   | 7          | Registration, a draft application saved in steps, document upload, submission                                                                      |
| Reference    | 3          | Organisation types with required documents, Nigerian states, policy versions (public)                                                              |
| Admin        | 16         | Staff review queue and decisions, organisation lifecycle, Healthalyst staff management                                                             |
| Organization | 8          | Profile, branches, departments, capability profiles (after approval)                                                                               |
| Roles        | 5          | Permission catalogue and custom roles                                                                                                              |
| Staff        | 14         | Organisation members, invitations (single and bulk), invitation acceptance                                                                         |
| Partners     | 10         | Partnerships, partner directory, partner invitations                                                                                               |
| Health       | 3          | Liveness and readiness                                                                                                                             |
| Operations   | 1          | Internal outbox relay (not for the front end)                                                                                                      |

### Conventions that every screen must follow

- **Errors:** always `{ error: { code, message, requestId, details? } }`.
  Show `message`, decide on `code`, show `requestId` on error screens.
  `422 VALIDATION_FAILED` lists bad fields in `details` (`path`, `issue`,
  `message`), so field-level errors become possible.
- **Optimistic concurrency:** editable records return an `ETag` (`"4"`); send
  it as `If-Match`. `412 VERSION_CONFLICT` means reload and re-apply;
  `428 PRECONDITION_REQUIRED` means it was not sent.
- **Lists:** `{ data: [...] }`; paginated lists add
  `page: { nextCursor, hasMore }` with `?cursor=&limit=`.
- **Rate limits:** `429 RATE_LIMITED` with `Retry-After`; sign-in and MFA are
  stricter.
- **Formats:** UUIDs, ISO 8601 UTC times, E.164 phone numbers
  (`+2348031234567`).

### Session model

1. `POST /v1/auth/login` `{ identifier, password }` answers either
   `MFA_REQUIRED` (`mfaToken`, `methods`) or `MFA_ENROLMENT_REQUIRED`
   (`enrolmentToken`).
2. `POST /v1/auth/mfa/verify` `{ mfaToken, method, code }` returns the
   session: a 10-minute access token (5 minutes for Healthalyst staff), the
   user, memberships, platform roles and the active context. It also sets the
   HttpOnly refresh cookie `__Secure-hs_rt`.
3. Enrolment: `POST /v1/auth/mfa/totp/setup` (secret and `otpauthUrl` for a
   QR code), then `POST /v1/auth/mfa/totp/confirm` with the first code
   (returns recovery codes, shown once).
4. Keep the access token in memory. On `401 AUTH_TOKEN_EXPIRED`, or after a
   reload, call `POST /v1/auth/refresh` with credentials and
   `X-Requested-With: healthalyst`. Run one refresh at a time; the cookie
   rotates, and reusing an old one ends the session.
5. Sensitive actions answer `403 AUTH_STEP_UP_REQUIRED`; re-verify with
   `POST /v1/auth/step-up` and retry.
6. A token acts for one organisation; switch with `POST /v1/auth/context`
   `{ organizationId, branchId? }`. Healthalyst staff enter the platform
   realm with `{ realm: "PLATFORM" }`.
7. `GET /v1/me` returns profile, memberships, active context, roles,
   permissions and branches.

### Organisation lifecycle

`DRAFT` → `PENDING_VERIFICATION` (submitted) → `UNDER_REVIEW` (claimed by a
reviewer) → `CHANGES_REQUESTED` | `ACTIVE` | `REJECTED`. `ACTIVE` ↔
`SUSPENDED`; `DEACTIVATED` and `REJECTED` are terminal.

Documents: `UPLOADING` → `SCANNING` → `CLEAN` | `INFECTED`, then `ACCEPTED`
or `REJECTED` by review. Required documents depend on the organisation type
(`GET /v1/reference/organization-types`), for example a clinic needs a CAC
certificate, facility licence and medical director licence, and a pharmacy
needs a CAC certificate and a PCN premises licence.

## 2. Comparison with what we have

### Organisation onboarding (`apps/health-schedule`)

| Journey step             | Today (Java Accounts API)                                                                                                                                | Platform API                                                                                                                                                                                                                                                                                                                                                   | Impact on screens                                                                                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Register                 | `POST /api/v1/organization-registrations`, flat body, 11 organisation types, free-text product interest, one administrator name; returns `applicationId` | `POST /v1/onboarding/registrations` with `organization` (legal and trading name, 8 facility types, E.164 phone, address, city, state code, LGA, CAC number, 1–3 products), `admin` (first and last name, phone, password of 10+), `policies` (terms, privacy notice and DPA versions), optional `captchaToken`; always `202 PENDING_EMAIL_VERIFICATION`, no ID | Rework the form: address, state picker from reference data, products as a multi-select, policy consent with links, E.164 phone. Success screen no longer shows a reference number. |
| Verify email             | `POST /api/v1/auth/email-verification/confirm` (204)                                                                                                     | `POST /v1/auth/verify-email` returns `enrolmentToken` when MFA is not set up; `410` for an expired link                                                                                                                                                                                                                                                        | Verification leads straight into authenticator set-up.                                                                                                                             |
| Resend verification      | `POST /api/v1/auth/email-verification/resend` `{ emailAddress }`                                                                                         | `POST /v1/auth/verify-email/resend` `{ email }` (always 202)                                                                                                                                                                                                                                                                                                   | Field rename only.                                                                                                                                                                 |
| Sign in                  | `POST /api/v1/auth/session` → bearer token; 409 lists organisations; 403 if email unverified; token lost on reload                                       | Two steps (password, then MFA), refresh cookie, `/v1/auth/context` for several organisations                                                                                                                                                                                                                                                                   | New screens: MFA code, authenticator enrolment with QR code, recovery codes. The organisation picker uses context switching. Sessions survive a reload.                            |
| Forgot or reset password | Not available                                                                                                                                            | `POST /v1/auth/password/forgot`, `POST /v1/auth/password/reset`                                                                                                                                                                                                                                                                                                | New screens.                                                                                                                                                                       |
| Application status       | `GET /api/v1/organization-registrations/mine` (status and review note)                                                                                   | `GET /v1/onboarding/application`: status, version, `canEdit`, `canSubmit`, profile, checklist (profile, email, phone, MFA, documents), required documents, documents, reviewer messages                                                                                                                                                                        | The status page becomes an application workspace with a checklist.                                                                                                                 |
| Edit application         | Not available                                                                                                                                            | `PATCH /v1/onboarding/application` with `If-Match` (in `DRAFT` or `CHANGES_REQUESTED`)                                                                                                                                                                                                                                                                         | New profile step with save and conflict handling.                                                                                                                                  |
| Phone verification       | Not available                                                                                                                                            | `POST /v1/auth/phone/send-code`, `POST /v1/auth/phone/verify`                                                                                                                                                                                                                                                                                                  | New step (it is on the checklist).                                                                                                                                                 |
| Documents                | Reviewer-created evidence requests; multipart upload to the API (`file`)                                                                                 | Typed documents per organisation type: `POST /v1/onboarding/documents/upload-url` (presigned PUT, 5 minutes), PUT the file to storage, `POST /v1/onboarding/documents` to confirm and scan, `DELETE` before submission                                                                                                                                         | Replace the evidence-request list with a required-documents list and a three-step upload with scan status.                                                                         |
| Submit                   | Implicit (registration is the submission)                                                                                                                | `POST /v1/onboarding/application/submit`; `422` names the incomplete checklist items                                                                                                                                                                                                                                                                           | New explicit submit step.                                                                                                                                                          |
| Changes requested        | Review note plus evidence requests                                                                                                                       | Itemised `messages` (`field`, `message`) on the application                                                                                                                                                                                                                                                                                                    | Show each requested change next to its field.                                                                                                                                      |
| Sign out                 | Not available (token in memory only)                                                                                                                     | `POST /v1/auth/logout`, `logout-all`, session list                                                                                                                                                                                                                                                                                                             | Add sign-out; sessions page later.                                                                                                                                                 |

### Staff review (`apps/super-admin`)

| Area                | Today (Java)                                                                                    | Platform API                                                                                                                                                                                       | Impact on screens                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Sign in             | Separate staff accounts; cookie session and CSRF token (`/api/v1/staff/auth/*`), 8-hour session | The same login and MFA as everyone, then `POST /v1/auth/context` `{ realm: "PLATFORM" }`; 5-minute tokens with refresh; platform roles (`SUPER_ADMIN`, `PLATFORM_ADMIN`, `COMPLIANCE_REVIEWER`, …) | Staff sign-in gains MFA; the CSRF flow disappears for the Platform backend. |
| Queue and list      | Two unpaginated arrays (all, review queue)                                                      | `GET /v1/admin/organizations` with `status`, `type`, `stateCode`, `q`, cursor pagination; the queue is `?status=PENDING_VERIFICATION`                                                              | Server-side filters, search and "load more".                                |
| Detail              | Fields from the list item                                                                       | `GET /v1/admin/organizations/{id}`: profile, products, documents, members, full history, possible duplicates                                                                                       | Richer detail page: history timeline and duplicate warnings.                |
| Claiming            | None                                                                                            | `claim` (to `UNDER_REVIEW`) and `release`; only the claiming reviewer can decide                                                                                                                   | Claim and release actions; show who holds an application.                   |
| Decisions           | One `decision` endpoint with a status and note                                                  | `approve` (five confirmed checks, products, optional note, step-up MFA, `If-Match`), `reject` (reason code and message), `request-changes` (itemised fields)                                       | Separate approve, reject and request-changes forms; a step-up MFA prompt.   |
| Documents           | Download through the API as a blob                                                              | `GET …/documents/{docId}/url`: a 60-second, audited view URL                                                                                                                                       | Open documents from a short-lived link.                                     |
| Notes and lifecycle | None                                                                                            | Internal notes; `suspend`, `reinstate`, `deactivate` with reasons                                                                                                                                  | New actions on the detail page.                                             |
| Staff management    | None                                                                                            | `GET`/`POST /v1/admin/staff`, replace roles, remove a super admin                                                                                                                                  | New staff page (later phase).                                               |

### After approval (new areas, no screens yet)

Organisation profile (`/v1/organization`), branches and departments,
capability profiles, roles and permissions, staff members and invitations
(including the public `GET`/`POST /v1/invitations/{token}` acceptance page),
and partners. These belong to the product applications after onboarding and
can follow later.

## 3. Integration blockers to raise with the backend team

1. **CORS: cross-origin requests are not allowed.** A preflight from
   `http://localhost:3006` and `http://localhost:3007` (and even from the API's
   own origin) returns no `Access-Control-Allow-Origin` header, and
   `Access-Control-Allow-Methods` is only `GET,HEAD,POST`. Browsers will block
   every call, and `PATCH`, `PUT` and `DELETE` endpoints cannot be called from
   the browser until the team allows our origins, those methods and the
   `If-Match` and `X-Requested-With` headers, with credentials.
   **Decision (22 October 2026):** the apps call the server directly, with no
   proxy. CORS failures are left visible in the browser console and network
   panel, as in a normal development process, and reported to the backend
   team.
2. **Refresh cookie.** `__Secure-hs_rt` is set by the API's own domain, so to
   the apps it is a third-party cookie. It needs `SameSite=None; Secure`, an
   allowed origin with credentials, and browsers that do not block third-party
   cookies. Confirm the cookie's `Domain` and `SameSite` with the team.
3. **Development accounts.** We need test organisation and staff accounts with
   authenticator set-up, and a way to receive verification and reset emails in
   development.
4. **Captcha.** Platform registration requires a Cloudflare Turnstile
   `captchaToken`; the public site key is configured with
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the frontend environment.
5. **Policies.** Registration requires the current terms, privacy notice and
   data processing agreement versions (`2026-10`). We need the documents to
   link to.
6. **Organisation types.** The Platform list has 8 facility types; the Java
   list has 11, including investor funds, NGOs and technology partners.
   Confirm that non-facility organisations are out of scope for onboarding.

## 4. One contract, no backend switch

**Decision (22 October 2026):** the frontend implements the Platform API
contract only. There is no backend switch and no screen, hook or service
written for another backend.

- `NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL` is the one API address. Pointing
  it at a different server changes nothing else: the screens stay the same.
- The Java backend (`healthalyst-backend-java`) is a sandbox. To be used with
  this frontend it must be refactored to implement the same documented
  contract as the NestJS Platform API. Until then, pointing the frontend at it
  is expected to fail.
- The Java-only screens (the original registration form, email confirmation
  page, application status sign-in and evidence requests), their client,
  service, hooks and models, and `NEXT_PUBLIC_HEALTHALYST_BACKEND` were
  removed from HealthSchedule. Sign-in shows that it is not available until
  Platform sign-in is built. The super-admin app is unchanged and still uses
  `NEXT_PUBLIC_HEALTHALYST_API_URL`.

<details>
<summary>Superseded proposal: a backend switch</summary>

### Configuration

- `NEXT_PUBLIC_HEALTHALYST_BACKEND` = `platform` or `java` (default
  `platform` once ready).
- `NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL` and
  `NEXT_PUBLIC_HEALTHALYST_JAVA_API_URL`: the two backend addresses. The
  browser calls the selected one directly, so both are built into the bundle
  and are public. `NEXT_PUBLIC_HEALTHALYST_API_URL` stays as the Java address
  until the code moves to the new names.
- In development only, an override (for example a query parameter remembered
  in `sessionStorage`) lets a developer flip backends without rebuilding. It
  is ignored in production builds.
- Add the variables to `turbo.json` `globalEnv` and both `.env.example` files.

### Direct calls, no proxy

The browser calls the selected backend directly. The front end adapts to each
backend's contract; neither backend is changed for the front end for now. CORS
and cookie problems are not hidden: requests fail with the browser's own
errors, the API layer reports them as connection failures that name the
backend, and they are raised with the backend team.

### One contract, two adapters

- Define the screens against domain interfaces based on the Platform contract,
  for example `AuthenticationGateway`, `OnboardingGateway` and `ReviewGateway`,
  with domain types such as `Application`, `ApplicationStatus`,
  `RequiredDocument` and `Session`.
- **Platform adapter:** a thin mapping, since the domain follows its shapes.
- **Java adapter:** translates today's endpoints into the same domain types,
  for example `PENDING_REVIEW` to `PENDING_VERIFICATION`, `APPROVED` to
  `ACTIVE`, evidence requests to documents, and `{ message }` errors to the
  common error shape.
- Each adapter declares **capabilities** (MFA, draft editing, phone
  verification, typed documents, claiming, password reset). Screens show only
  what the active backend supports, so the Java backend keeps working while it
  lacks these features.
- When the Java controllers are refactored to the Platform structure, the Java
  adapter is deleted and the switch becomes only a choice of backend address.

### Shared HTTP concerns (in each app's API layer)

- One client per backend boundary, finite timeouts, no retries on writes.
- Error normaliser to `{ code, message, requestId, fieldErrors }`.
- Token store in memory with a single-flight refresh on
  `AUTH_TOKEN_EXPIRED` and on page load.
- `If-Match` and `ETag` handling for editable records, and a conflict message.
- `Retry-After` handling for `429`.
- Step-up: catch `AUTH_STEP_UP_REQUIRED`, show the MFA prompt, retry once.

</details>

## 5. Implementation plan (for approval)

1. **Foundation:** configuration, the backend switch, gateway interfaces, the
   error normaliser and the token store, in both apps.
   Move the current Java calls behind the Java adapter with no behaviour
   change, and fix the evidence upload there (it currently sends JSON instead
   of `multipart/form-data`).
2. **Platform sign-in (both apps):** password step, MFA code, authenticator
   enrolment with QR code and recovery codes, session restore on reload,
   sign-out, organisation context picker, forgot and reset password.
3. **Registration and email verification:** the reworked form with reference
   data, policy consent and E.164 phone, and verification leading into MFA
   enrolment.
4. **Application workspace:** checklist, profile editing with versioning,
   phone verification, required documents with presigned upload and scan
   status, submission, and itemised change requests.
5. **Staff review:** platform-realm sign-in, filtered and paginated queue,
   detail with history and duplicates, claim and release, approve with the
   checklist and step-up, reject with reason codes, request changes, internal
   notes, document view links, suspend, reinstate and deactivate.
6. **Later:** Healthalyst staff management, the organisation profile,
   branches and departments, roles, staff invitations, and partners.

Steps 1 to 5 each end with `pnpm test-all` and a browser check against the
development API. Until the backend team allows our origins, the browser check
for Platform calls is expected to show CORS errors; the check then confirms
that the request is correct and that the error is shown clearly.

## 6. Progress

### Organisation registration (22 October 2026)

- **Backend switch (since removed, see section 4):** `NEXT_PUBLIC_HEALTHALYST_BACKEND` (`java` by default,
  or `platform`) in `apps/health-schedule/src/infrastructure/backend/backend-selection.ts`,
  with `NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL` for the Platform API. Both
  are in `turbo.json` `globalEnv` and `apps/health-schedule/.env.example`.
  Java mode is unchanged.
- **Platform API layer** (`features/organization-onboarding/api/`):
  `platform-http-client.ts` (direct browser calls, 30-second timeout for the
  sleeping development server), `platform-api-error.ts` (error body, `422`
  field errors mapped to form fields, `429` with `Retry-After`, connection and
  CORS failures that name the API address) and
  `platform-onboarding-service.ts` (reads `GET /v1/reference/policies`, then
  `POST /v1/onboarding/registrations`; `POST /v1/auth/verify-email/resend`).
- **Form:** `platform-organization-registration-form.tsx` with its
  definition and Zod schema. Organisation types, products and state codes come
  from the contract's enums, so the form needs no request to show them. Local
  Nigerian phone numbers are converted to E.164. The success screen never
  confirms that an account exists, matching the API.
- **Shared UI:** the shadcn checkbox in `packages/ui`, and `checkbox` and
  `checkbox-group` field kinds in the form system. Repeated form names now
  parse as arrays.

Evidence: `pnpm test-all` passed. In the browser (production build with the
Platform backend selected), empty submission shows every field error and
focuses the first. A complete submission is blocked by CORS on
`GET /v1/reference/policies`, as expected; the console shows the CORS error
and the form shows the connection message. From a terminal, the same request
body with an invalid phone number and password returned
`422 VALIDATION_FAILED` with paths `organization.phone` and `admin.password`,
which the form maps to its fields. A successful registration has not been run
from the browser, because CORS blocks it.
