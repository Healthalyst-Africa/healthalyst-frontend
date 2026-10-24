# Healthalyst API: frontend guide

How to build a frontend against the Healthalyst APIs: environments, sign-in, tokens, errors and
the main flows. For every endpoint's exact fields, use the **API reference** (section 1). This
guide explains how the endpoints fit together.

Three APIs, one sign-in:

| API                  | What it does                                                  |
| -------------------- | ------------------------------------------------------------- |
| `platform-api`       | Accounts, sign-in, organisations, onboarding, staff, partners |
| `healthschedule-api` | HealthSchedule (scheduling) product                           |
| `labconnect-api`     | LabConnect (laboratory) product                               |

Users always sign in through `platform-api`. The same access token then works on each product
API the organisation has enabled.

---

## 1. Environments and tools

| Where the frontend runs              | APIs it uses                                                                                                                                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Your laptop (`localhost`)            | The dev APIs, through your dev server's proxy (below)                                                                                                                                                      |
| Deployed dev frontend (any host)     | The dev APIs: for now Render addresses (`https://healthalyst-platform-api-dev.onrender.com`, …), later `https://platform-api.dev.healthalystafrica.com` and so on. The backend team sends the current ones |
| Deployed staging frontend (any host) | `https://platform-api.staging.healthalystafrica.com`, and the same pattern for the products                                                                                                                |

The frontend can be hosted anywhere (Netlify, Vercel, Cloudflare Pages, your own server). For
people to stay signed in, its address must be on `healthalystafrica.com` (e.g.
`dev.healthalystafrica.com`): add it as a custom domain in your host, which is free on all of
them, and send the DNS record your host asks for to the backend team. The reason is in
section 3 ("What the browser holds"). Until then, and on a host's default address
(`*.netlify.app`, `*.vercel.app`), keep people signed in by proxying `/v1` to the platform API
through your host, like the local setup below (on Netlify, a `_redirects` line
`/v1/*  <platform API>/v1/:splat  200`). Every tester's sign-in then comes through the host's
servers and shares the sign-in rate limits, which is fine for a few testers.

**API reference (interactive)**, on the platform API (dev and staging; not in production):

- `/docs`: Scalar.
- `/docs/swagger`: Swagger UI (SmartBear's viewer).

Both show all three APIs (switch at the top) and ask for a username and password; the backend
team sends them. Every endpoint shows what it does, its request and response schemas with
worked examples, the token and permission it needs, and **every error code it can return** for
each status. To call the API from the page, sign in through the API, copy the `accessToken` and
paste it under **Authorize** (Swagger UI) or **Authentication** (Scalar). The overview at the
top of each API summarises sign-in, errors, versions and pagination.

**OpenAPI files** (for code generation, Postman or Insomnia): `/docs/platform.openapi.json`,
`/docs/healthschedule.openapi.json`, `/docs/labconnect.openapi.json` on platform-api, and in the
backend repository under `docs/api/`.

**Typed client.** Generate TypeScript types from the OpenAPI files, so a backend change that
breaks the frontend fails to compile:

```sh
# The reference is behind the docs sign-in; ask the backend team for it.
curl -u "$DOCS_USER:$DOCS_PASSWORD" -o platform.openapi.json \
  https://healthalyst-platform-api-dev.onrender.com/docs/platform.openapi.json
npx openapi-typescript platform.openapi.json -o src/api/platform.d.ts
```

(Or use the copy in the backend repository, `docs/api/platform.openapi.json`, which needs no
sign-in.)

Then use them with `openapi-fetch`, or as plain types in your own fetch wrapper.

**Mock server** (no backend needed): in the backend repository, `pnpm mock:platform` serves
example responses for every platform endpoint at `http://localhost:4010`.

### Working locally against the dev APIs

Run your frontend on your laptop and let your dev server **proxy** the platform API. The browser
then only talks to `localhost`, so the refresh cookie is set for `localhost` and sign-in keeps
working. Calling `https://platform-api.dev…` directly from `localhost` signs you out after 10
minutes, because the cookie is never sent across sites.

The dev APIs accept these local origins: `http://localhost:3000`, `:3005`, `:3006`, `:3007`, `:4200`, `:5173` and `:8080`
(the usual defaults of Next.js/Create React App, Angular, Vite and Vue CLI). Using another port?
Ask the backend team to add it.
Open the app as `http://localhost:…`, not `http://127.0.0.1:…`: browsers treat them as
different origins, and only `localhost` is allowed.

The addresses in the examples below are the current Render ones. Once the
`*.dev.healthalystafrica.com` domains are set up, the backend team will send the new ones;
only the proxy targets change.

Only `/v1` of platform-api needs the proxy (the cookie lives there). The product APIs use the
bearer token only, so you can call them directly or proxy them too.

**Vite** (React, Vue, Svelte):

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/v1": {
        target: "https://healthalyst-platform-api-dev.onrender.com",
        changeOrigin: true,
      },
      "/hs": {
        target: "https://healthalyst-healthschedule-api-dev.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hs/, ""),
      },
      "/lc": {
        target: "https://healthalyst-labconnect-api-dev.onrender.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lc/, ""),
      },
    },
  },
});
```

**Next.js**:

```js
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination:
          "https://healthalyst-platform-api-dev.onrender.com/v1/:path*",
      },
      {
        source: "/hs/:path*",
        destination:
          "https://healthalyst-healthschedule-api-dev.onrender.com/:path*",
      },
      {
        source: "/lc/:path*",
        destination:
          "https://healthalyst-labconnect-api-dev.onrender.com/:path*",
      },
    ];
  },
};
```

**Angular** (`ng serve --proxy-config proxy.conf.json`):

```json
{
  "/v1": {
    "target": "https://healthalyst-platform-api-dev.onrender.com",
    "secure": true,
    "changeOrigin": true
  },
  "/hs": {
    "target": "https://healthalyst-healthschedule-api-dev.onrender.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/hs": "" }
  },
  "/lc": {
    "target": "https://healthalyst-labconnect-api-dev.onrender.com",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/lc": "" }
  }
}
```

**Create React App**: `"proxy": "https://healthalyst-platform-api-dev.onrender.com"` in
`package.json` (it proxies every unknown path; call the product APIs directly).

Then use relative URLs in the app (`/v1/auth/login`, `/hs/v1/organization`), and read the API
base URL from an environment variable so the deployed build can use the full URLs. Use Chrome
or Firefox locally: they accept `Secure` cookies on `http://localhost`; Safari does not.

**Uploading documents locally** works too: upload links point straight at the document
storage (use `uploadUrl` exactly as returned; don't proxy it), which accepts the same local
origins.

### Test accounts and messages

- **Email** (dev, staging): only addresses on the environment's allowlist receive emails. Ask
  the backend team to add yours.
- **SMS**: no SMS provider yet. Phone verification codes are written to the platform-api log;
  ask a backend developer for the code.
- **Bot check**: registration needs a Cloudflare Turnstile token (section 6.1). Ask for the
  environment's site key. It works on the hostnames the widget is registered for; if
  `localhost` is not among them, register test organisations on the deployed frontend (or ask
  the backend team for one), then sign in and work locally as usual.

---

## 2. Conventions

- **JSON** in and out (`Content-Type: application/json`), except the document upload itself.
- **Versioned paths**: everything for frontends is under `/v1/`.
- **IDs** are UUIDs. **Dates** are ISO 8601 in UTC (`2026-10-17T09:30:00.000Z`); calendar dates
  are `YYYY-MM-DD`.
- **Phone numbers** are international (E.164): `+2348031234567`.
- **Lists** return `{ data: [...] }`. Paginated lists also return
  `page: { nextCursor, hasMore }`. Pass `?cursor=<nextCursor>&limit=<n>` for the next page.
- **Edits that can collide** use versions (section 5).
- **`/internal/...` endpoints** are for Google Cloud, not for frontends.

---

## 3. Sign-in, tokens and sessions

### What the browser holds

| Credential        | Where it lives                                         | Lifetime                     |
| ----------------- | ------------------------------------------------------ | ---------------------------- |
| **Access token**  | In memory only (a JS variable), never `localStorage`   | 10 minutes (staff tokens: 5) |
| **Refresh token** | An `HttpOnly` cookie set by the API; JS cannot read it | 8 hours idle, 7 days at most |

Send the access token as `Authorization: Bearer <accessToken>`. When it expires, or after a page
reload, get a new one from the refresh endpoint. The cookie only goes to `/v1/auth/*` on
platform-api.

### Signing in

```text
POST /v1/auth/login { identifier, password }          identifier: email or +234... phone
  ├─ { status: "MFA_REQUIRED", mfaToken, methods }  → ask for the 6-digit code
  │     POST /v1/auth/mfa/verify { mfaToken, method: "totp", code }
  │       → session (access token + user + memberships), refresh cookie set
  └─ { status: "MFA_ENROLMENT_REQUIRED", enrolmentToken } → set up an authenticator app first
        POST /v1/auth/mfa/totp/setup   { enrolmentToken }
          → { factorId, secret, otpauthUrl }        show otpauthUrl as a QR code (and the secret)
        POST /v1/auth/mfa/totp/confirm { enrolmentToken, factorId, code }
          → session + recoveryCodes                 show the recovery codes ONCE; ask the user to save them
```

MFA is required for everyone. Recovery codes replace the app code when the phone is lost:
`method: "recovery_code"` with one of them. Each works once.

The **session** response (`SessionResponse`) has:

- `accessToken`, `expiresIn` (seconds), `activeContext` (`realm`, `organizationId`, `branchId`)
- `user` (name, email, `mfa.totp`)
- `memberships`: each organisation the user belongs to, with its `status`, the user's `roles`
  and the organisation's `products`
- `platformRoles`: non-empty only for Healthalyst staff

`GET /v1/me` returns the same picture plus the active context's `permissions`. Use it after a
reload (once refresh has given you a token) to rebuild the UI.

### Refreshing

```ts
POST /v1/auth/refresh
  credentials: 'include'
  headers: { 'X-Requested-With': 'healthalyst' }   // required: blocks cross-site forgery
→ { accessToken, tokenType: 'Bearer', expiresIn, activeContext }
```

- Each refresh **replaces** the cookie (rotation). Requests from a second tab within a few
  seconds are tolerated, but run **one refresh at a time** per tab (see the client below).
- `401 AUTH_REFRESH_INVALID`: the session is over (signed out elsewhere, expired, or a stolen
  cookie was detected and every session ended). Go to the sign-in page.
- `403 CSRF_CHECK_FAILED`: the `X-Requested-With` header is missing or the page's origin is not
  allowed.

### A fetch wrapper that does this

```ts
let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

async function refresh(): Promise<string | null> {
  refreshing ??= fetch("/v1/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: { "X-Requested-With": "healthalyst" },
  })
    .then(async (res) => (res.ok ? (await res.json()).accessToken : null))
    .finally(() => (refreshing = null));
  accessToken = await refreshing;
  return accessToken;
}

export async function api(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const send = (token: string | null) =>
    fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  let res = await send(accessToken ?? (await refresh()));
  if (res.status === 401) {
    const { error } = await res.clone().json();
    // Expired, or permissions changed since the token was issued: a fresh token fixes both.
    if (error?.code === "AUTH_TOKEN_EXPIRED" && (await refresh()))
      res = await send(accessToken);
  }
  return res;
}
```

On a `401` that refresh cannot fix (`AUTH_SESSION_REVOKED`, `AUTH_TOKEN_INVALID`,
`AUTH_REFRESH_INVALID`), clear state and show sign-in.

### Signing out and sessions

- `POST /v1/auth/logout`: end this session (clears the cookie).
- `POST /v1/auth/logout-all`: end every session (needs step-up).
- `GET /v1/auth/sessions` and `DELETE /v1/auth/sessions/{id}`: a "where you're signed in" page.

### Step-up (re-confirm MFA for sensitive actions)

Some actions need MFA within the last 15 minutes: changing the password, regenerating recovery
codes, signing out everywhere, resetting someone's MFA, and the staff actions marked "Step-up"
in the API reference. Otherwise they answer `403 AUTH_STEP_UP_REQUIRED`:

1. Ask for the authenticator code.
2. `POST /v1/auth/step-up { method: "totp", code }` → a new access token. Replace the stored one.
3. Retry the action.

### Several organisations, branches and the staff realm

A token acts for **one organisation** (and optionally one branch) at a time:
`activeContext.organizationId`. If the user belongs to several (`memberships`), let them choose,
then `POST /v1/auth/context { organizationId, branchId? }` → a token for that organisation.
Healthalyst staff enter the admin area with `POST /v1/auth/context { realm: "PLATFORM" }`.

### What the access token says

The token is a JWT; decode its payload (no verification needed in the browser) to drive the UI:

| Claim | Meaning                                                                                |
| ----- | -------------------------------------------------------------------------------------- |
| `org` | Active organisation id                                                                 |
| `ost` | That organisation's status (`DRAFT`, `ACTIVE`, `SUSPENDED`, ...)                       |
| `rol` | The user's roles there (`owner`, `admin`, ...)                                         |
| `prm` | Permissions, e.g. `staff:invite`, `branch:manage`. Show or hide actions with these     |
| `brs` | Branches the user may act in (`["*"]` = all)                                           |
| `aud` | Where the token is valid: `platform` plus each enabled product (`healthschedule`, ...) |
| `plt` | Healthalyst staff roles (staff realm only)                                             |
| `exp` | Expiry (seconds since 1970)                                                            |

The API checks every permission itself; hiding a button is only for a cleaner UI. When an admin
changes someone's roles, that person's next request answers `401 AUTH_TOKEN_EXPIRED`; the fetch
wrapper refreshes and the new token carries the new permissions.

### Forgotten password, email and phone

- `POST /v1/auth/password/forgot { email }` (always `202`; never reveals whether the account
  exists). The email links to **`/reset-password?token=...`** on the frontend, which calls
  `POST /v1/auth/password/reset { token, password }`. Resetting ends every session.
- `POST /v1/auth/password/change { currentPassword, newPassword }` (step-up) ends other sessions.
- Passwords: 10 to 128 characters (12 for admins), and passwords found in known data breaches
  are refused (`422`, with `issue: "breached"` in `details`).
- Phone: `POST /v1/auth/phone/send-code { phone }` then `POST /v1/auth/phone/verify { code }`.

---

## 4. Errors

Every error, from every API, has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request contains invalid fields.",
    "requestId": "req-5f2c...",
    "details": [
      {
        "path": "admin.email",
        "issue": "invalid_format",
        "message": "Invalid email address"
      }
    ]
  }
}
```

- **Show `message`** to the user (it is written for them); **branch on `code`**, never on the
  message text.
- **`details`** on `422 VALIDATION_FAILED` lists each bad field (`path` uses dots:
  `organization.phone`). Put each message next to its field.
- **`requestId`**: show it in error screens ("Reference: req-5f2c...") so the backend team can
  find the request in the logs.

### Codes to handle

| Status | Code                                                                                         | What the UI should do                                                  |
| ------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 401    | `AUTH_TOKEN_MISSING`, `AUTH_TOKEN_EXPIRED`                                                   | Refresh, retry once                                                    |
| 401    | `AUTH_SESSION_REVOKED`, `AUTH_TOKEN_INVALID`, `AUTH_REFRESH_INVALID`, `AUTH_SESSION_EXPIRED` | Signed out: go to sign-in                                              |
| 401    | `AUTH_INVALID_CREDENTIALS`                                                                   | "Email, phone or password is incorrect" (deliberately vague)           |
| 401    | `AUTH_MFA_INVALID`                                                                           | Wrong or reused code; let them try again                               |
| 403    | `AUTH_ACCOUNT_LOCKED`                                                                        | Too many failures: locked for 15 minutes; offer "Forgot password"      |
| 403    | `AUTH_ACCOUNT_DISABLED`, `EMAIL_NOT_VERIFIED`                                                | Explain; for the email, offer "Resend verification"                    |
| 403    | `AUTH_STEP_UP_REQUIRED`                                                                      | Ask for the MFA code, step up, retry (section 3)                       |
| 403    | `PERMISSION_DENIED`                                                                          | "You don't have access to this"                                        |
| 403    | `ORG_NOT_APPROVED`, `ORG_SUSPENDED`, `ORG_DEACTIVATED`                                       | Organisation not active: show its status page (section 6)              |
| 403    | `ORG_CONTEXT_REQUIRED`                                                                       | Pick an organisation first (`POST /v1/auth/context`)                   |
| 403    | `PRODUCT_NOT_ENABLED`                                                                        | Product not available to this organisation (section 7)                 |
| 403    | `CAPTCHA_REQUIRED`, `CAPTCHA_FAILED`                                                         | Reset the Turnstile widget and try again                               |
| 403    | `CSRF_CHECK_FAILED`                                                                          | Bug: refresh sent without `X-Requested-With` or from an unknown origin |
| 400    | `BAD_REQUEST`                                                                                | Bug: an `{id}` in the path is not a UUID                               |
| 404    | `<THING>_NOT_FOUND` (`STAFF_NOT_FOUND`, `BRANCH_NOT_FOUND`, …)                               | Gone or never existed; also for other organisations' records           |
| 409    | `INVALID_STATUS_TRANSITION`                                                                  | The record changed state: reload it                                    |
| 409    | various (`LAST_OWNER`, `BRANCH_EXISTS`, `ROLE_IN_USE`, ...)                                  | Show `message`                                                         |
| 410    | `TOKEN_EXPIRED`, `INVITATION_EXPIRED`                                                        | Link or code no longer valid: offer to send a new one                  |
| 412    | `VERSION_CONFLICT`                                                                           | Someone else saved first: reload, re-apply, save again (section 5)     |
| 422    | `VALIDATION_FAILED`                                                                          | Field errors from `details`                                            |
| 428    | `PRECONDITION_REQUIRED`                                                                      | Bug: `If-Match` missing                                                |
| 429    | `RATE_LIMITED`                                                                               | Wait `Retry-After` seconds, then let them retry                        |
| 503    | `SERVICE_UNAVAILABLE`                                                                        | Temporary: retry shortly                                               |

The API reference lists, for each endpoint, every code it can return under each status; this
table covers the ones the whole app should handle the same way. Rate limits are per IP; sign-in
and MFA have tighter limits (5 attempts per minute and per 5 minutes respectively). The dev
environment allows ten times these limits, so repeated testing is rarely blocked; staging and
production use the real ones, so still handle `429` properly.

---

## 5. Saving edits safely (versions)

Records that several people can edit carry a **version**. Reads return it in the `ETag` header
(`"4"`) and, for applications, in the body (`version`). Send it back on the write:

```ts
const res = await api("/v1/organization", { method: "GET" });
const etag = res.headers.get("ETag"); // "4"
await api("/v1/organization", {
  method: "PATCH",
  headers: { "If-Match": etag! },
  body: JSON.stringify({ tradingName: "New name" }),
});
```

- `412 VERSION_CONFLICT`: someone saved in between. Reload, show what changed, let the user
  re-apply.
- `428 PRECONDITION_REQUIRED`: `If-Match` was not sent.
- Each successful write returns the new `ETag`: keep it for the next save.

Endpoints that need it say "Send If-Match" in the API reference.

---

## 6. Organisation onboarding

### Statuses

```text
DRAFT ──submit──▶ PENDING_VERIFICATION ──claimed──▶ UNDER_REVIEW ──▶ ACTIVE ◀──▶ SUSPENDED
  ▲                                                    │    │           │            │
  └──── CHANGES_REQUESTED ◀── request changes ─────────┘    └▶ REJECTED └▶ DEACTIVATED ◀┘
```

| Status                 | Show the applicant                                | Can edit? |
| ---------------------- | ------------------------------------------------- | --------- |
| `DRAFT`                | The application form and checklist                | Yes       |
| `PENDING_VERIFICATION` | "Submitted, waiting for review"                   | No        |
| `UNDER_REVIEW`         | "Being reviewed"                                  | No        |
| `CHANGES_REQUESTED`    | The reviewer's itemised messages; form open again | Yes       |
| `ACTIVE`               | The app                                           | (profile) |
| `SUSPENDED`            | "Suspended": members are signed out               | No        |
| `REJECTED`             | The reason; final                                 | No        |
| `DEACTIVATED`          | Final                                             | No        |

Use `canEdit` and `canSubmit` from the application rather than re-deriving these rules.

### 6.1 Register

1. Load `GET /v1/reference/organization-types` (types and their required documents),
   `GET /v1/reference/states` and `GET /v1/reference/policies` (current terms versions).
2. Render the Cloudflare Turnstile widget; it gives a token on success.
3. `POST /v1/onboarding/registrations`:
   ```json
   {
     "organization": {
       "legalName": "...",
       "type": "CLINIC",
       "email": "...",
       "phone": "+234...",
       "addressLine": "...",
       "city": "...",
       "stateCode": "LA",
       "products": ["HEALTHSCHEDULE"]
     },
     "admin": {
       "firstName": "...",
       "lastName": "...",
       "email": "...",
       "password": "..."
     },
     "policies": {
       "terms": "2026-10",
       "privacyNotice": "2026-10",
       "dpa": "2026-10"
     },
     "captchaToken": "<turnstile token>"
   }
   ```
   The answer is always `202` with "check your email", even if the email already has an
   account (so nobody can probe which emails are registered). `policies` must equal the current
   versions from step 1.
4. The email links to **`/verify-email?token=...`**. That page calls
   `POST /v1/auth/verify-email { token }` → `{ verified: true, enrolmentToken }`. Continue with
   MFA enrolment (section 3) using that `enrolmentToken`; it ends signed in.
   `POST /v1/auth/verify-email/resend { email }` sends a new link.

The new token is for the organisation in `DRAFT`: onboarding endpoints accept it, the rest of
the app does not (`403 ORG_NOT_APPROVED`) until approval.

### 6.2 Complete and submit the application

`GET /v1/onboarding/application` returns everything the page needs: `status`, `version`,
`canEdit`, `canSubmit`, the `profile`, a `checklist` (`profileComplete`, `emailVerified`,
`phoneVerified`, `mfaEnrolled`, `documentsComplete`), `requiredDocuments`, uploaded
`documents` and reviewer `messages`.

- **Save progress:** `PATCH /v1/onboarding/application` with only the changed fields and
  `If-Match` (section 5).
- **Verify the phone:** section 3.
- **Upload documents:** below.
- **Submit:** `POST /v1/onboarding/application/submit` when `canSubmit` is true. If something
  is missing it answers `422` naming it.

### 6.3 Upload a document

Files go straight to storage, not through the API. PDF, JPEG or PNG, up to 10 MB.

```ts
// 1. Ask for an upload URL, bound to this file's type and size (valid 5 minutes)
const { documentId, uploadUrl, headers } = await (
  await api("/v1/onboarding/documents/upload-url", {
    method: "POST",
    body: JSON.stringify({
      type: "CAC_CERTIFICATE",
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }),
  })
).json();

// 2. PUT the file to storage: NO Authorization header, exactly the headers returned
await fetch(uploadUrl, { method: "PUT", headers, body: file });

// 3. Confirm: the API checks the file and scans it for malware
const doc = await (
  await api("/v1/onboarding/documents", {
    method: "POST",
    body: JSON.stringify({ documentId }),
  })
).json();
// doc.status: "CLEAN" → done
```

- If the confirm answers `422` with `DOCUMENT_INFECTED` or `DOCUMENT_TYPE_NOT_ALLOWED` (the
  file's content is not what its type says), ask for another file.
- `503`: the scanner is busy; retry the confirm shortly.
- Replace a file before submitting with `DELETE /v1/onboarding/documents/{id}`, then upload
  again.

### 6.4 After submission

The applicant waits; Healthalyst staff review in the admin area (`/v1/admin/...`). Emails tell
the applicant when changes are requested (fix and resubmit: `CHANGES_REQUESTED` → submit
again) and when the organisation is approved.

**After approval, refresh the token** (`POST /v1/auth/refresh`) or sign in again: the old token
still says `ost: "PENDING_VERIFICATION"` and has no product audiences. The new one has
`ost: "ACTIVE"`, the owner's permissions and the products in `aud`.

---

## 7. Opening a product (HealthSchedule, LabConnect)

Product APIs accept the same access token when the organisation has that product. Before
showing a product, ask it:

```ts
const res = await fetch(
  "https://healthalyst-healthschedule-api-dev.onrender.com/v1/organization",
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);
// 200 { id, name, type, stateCode, products } → open HealthSchedule
// 403 PRODUCT_NOT_ENABLED → this organisation does not have it (or approval is still syncing)
// 401 → token not issued for this product: refresh, and if it persists, it's not enabled
```

- The product learns about approvals and changes from platform events, usually within a minute.
  Right after approval, a short "Setting things up..." retry on `PRODUCT_NOT_ENABLED` is
  reasonable.
- Product APIs have no cookies or refresh: always refresh through platform-api.
- Healthalyst staff tokens never work on product APIs.

---

## 8. Running an organisation (ACTIVE organisations)

All of these need an `ACTIVE` organisation and the permission shown in the API reference.

**Profile and structure**

- `GET`/`PATCH /v1/organization`: profile and directory listing (with `If-Match`).
- `GET`/`POST /v1/organization/branches`, `PATCH /v1/organization/branches/{id}`: branches.
  The head-office branch is created on approval; the last branch cannot be removed.
- `PUT /v1/organization/branches/{id}/capabilities`: services a branch offers (this is what the
  partner directory searches).
- `POST /v1/organization/branches/{id}/departments`, `PATCH /v1/organization/departments/{id}`.

**Roles and permissions**

- `GET /v1/permissions`: the permission catalogue, for a role editor.
- `GET /v1/roles`: preset roles (read-only) and custom roles, with member counts.
- `POST`/`PATCH`/`DELETE /v1/roles/{id}`: custom roles. Users can only grant permissions they
  hold themselves (`403 ROLE_ESCALATION_DENIED`); a role still held by someone cannot be deleted
  (`409 ROLE_IN_USE`).

**Staff**

- `GET /v1/staff` (paginated), `GET`/`PATCH`/`DELETE /v1/staff/{membershipId}`, plus
  `suspend`, `reactivate` and `reset-mfa` (step-up).
- Nobody can change their own roles (`SELF_CHANGE_DENIED`), only owners manage owners
  (`OWNER_ROLE_RESTRICTED`), and the last owner cannot be removed (`LAST_OWNER`).
- Invitations: `POST /v1/staff/invitations` (or `/bulk`, up to 200 rows with a per-row report),
  `GET /v1/staff/invitations`, `.../{id}/resend`, `DELETE .../{id}`. Links last 72 hours.

**Accepting an invitation** (the invitee's side). The email links to
**`/invitations/accept?token=...`**:

1. `GET /v1/invitations/{token}` → organisation, inviter, roles, and `accountExists`.
2. `accountExists: false` → ask for a password, then
   `POST /v1/invitations/{token}/accept { password }` → `next: "SIGN_IN"`: send them to sign in
   (they set up MFA there).
3. `accountExists: true` → have them sign in first, then call accept **with their bearer token**
   and no body → `next: "SWITCH_CONTEXT"`: `POST /v1/auth/context { organizationId }`.

**Partners** (organisations that work together, e.g. a clinic and a laboratory)

- `GET /v1/partners/directory?category=&stateCode=&q=`: listed organisations that accept
  referrals.
- `POST /v1/partners`: request a partnership for one service; the other side accepts
  (`POST /v1/partners/{id}/accept` with the data-sharing agreement version) or declines.
- `GET /v1/partners`: outgoing and incoming. Either side can `suspend` or `terminate`; the
  requester can set `preferred` and `priority` (`PATCH`).
- `POST /v1/partners/invitations`: invite a partner that is not on Healthalyst yet. (The email
  links to `/register?partnerInvitation=...`; linking that registration to the invitation is
  not built yet, so treat it as a normal registration for now.)

---

## 9. Healthalyst staff (admin area)

Staff sign in like everyone else (with MFA), then switch to the staff realm
(`POST /v1/auth/context { realm: "PLATFORM" }`). Staff tokens last 5 minutes and refresh
normally. They work for `/v1/admin/...` and the user's own account endpoints (`/v1/me`,
sessions), never for organisation endpoints or product APIs.

The review queue is `GET /v1/admin/organizations?status=PENDING_VERIFICATION`. Reviewing an
application: `claim` (moves it to `UNDER_REVIEW`; only the claimer can decide), view documents
through 60-second links (`.../documents/{docId}/url`), then `approve` (checklist, step-up,
`If-Match`), `request-changes` (itemised) or `reject`. Each action's role requirements are in the
API reference.

The team page (super admins only; the token's platform roles include `SUPER_ADMIN`):
`GET /v1/admin/staff` lists staff; `POST /v1/admin/staff` adds someone with one or more of
`PLATFORM_ADMIN`, `COMPLIANCE_REVIEWER`, `SUPPORT_AGENT`, `READ_ONLY_AUDITOR` (a new person
gets an email to choose a password); `PUT /v1/admin/staff/{userId}/roles` replaces those roles.
`POST /v1/admin/staff/{userId}/remove-super-admin` takes a reason and is a deliberate,
confirm-twice action. All changes need step-up. There is no way to make someone a super admin
from the UI; hide your own row's edit actions (`SELF_CHANGE_DENIED`).

---

## 10. Before you ship a screen

- [ ] Access token in memory only; refresh on load and on `AUTH_TOKEN_EXPIRED`
- [ ] `X-Requested-With: healthalyst` and `credentials: 'include'` on refresh;
      `credentials: 'include'` on logout (so the cookie is cleared)
- [ ] Error messages from `error.message`, logic from `error.code`, `requestId` visible
- [ ] Field errors from `details` on `422`
- [ ] `If-Match` on versioned edits; `412` handled
- [ ] `429` waits for `Retry-After`
- [ ] Actions hidden when the token's `prm` lacks the permission
- [ ] Organisation status (`ost`) drives what the user sees

Questions, or an endpoint that behaves differently from this guide or the API reference: tell
the backend team (include the `requestId`).
