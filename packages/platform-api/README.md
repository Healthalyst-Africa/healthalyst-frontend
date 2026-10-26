# Platform API integration

Shared NestJS Platform authentication contracts and browser transport. Each app
owns its workflows, providers, query cache, and API address.

| Public import                                      | Responsibility                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `@healthalyst/platform-api/authentication-service` | Typed auth operations and identity types                                |
| `@healthalyst/platform-api/http-client`            | Platform Axios instance, product client factory, local session clearing |
| `@healthalyst/platform-api/api-error`              | Validated backend and transport errors                                  |
| `@healthalyst/platform-api/config`                 | Public-request policy and session events                                |
| `@healthalyst/platform-api/next-config`            | Fixed `/v1` transport rewrite for cookie-compatible environments        |

```text
src/
  authentication/
    config/                   Endpoint paths and request defaults
    schemas/                  Actual backend wire responses and identity snapshots
    services/                 Auth operations, response validation, credential replacement
    types/                    Public auth contracts
    tests/                    Backend contract and profile restoration checks
  browser/
    config/                   API origin validation
    interceptors/             Bearer headers, bounded authentication retry, context isolation
    session/                  Private memory credential store and single-flight refresh
    errors/                   API and configuration failures
    schemas/                  Backend error envelopes
    types/                    Internal request and credential types
    tests/                    Transport, concurrency, failure, product-boundary tests
    create-platform-client.ts Isolated transport factory
    http-client.ts            Browser-only app singleton
  config/                     Shared public transport policy
next-config.mjs               Transport-only Next.js rewrite configuration
```

Access tokens live in a private transport closure, never localStorage,
sessionStorage, cookies written by JavaScript, query results, or React identity
state. The API sets its HttpOnly refresh cookie. MFA/enrolment challenges stay
in the active workflow and are sent in the backend's required request fields.

Authenticated calls obtain a credential through Platform refresh when needed.
Concurrent callers share one refresh; an explicit `AUTH_TOKEN_EXPIRED` may replay
a request once after refresh. Other write failures are never automatically
repeated. Context-changing refresh cannot replay an operation for another
organisation. Product clients use bearer tokens without cookies, and always
refresh through Platform API.

Use `createProductHttpClient(productApiOrigin)` once in the owning product app's
API layer when adding product API calls. It shares that app's Platform token
lifecycle without importing another application. Product audience failures do
not clear a valid Platform session.

See [authentication](../../docs/authentication.md) for environment setup, cookie
constraints, session recovery, and migration behavior, and
[code organisation](../../docs/code-organization.md) for ownership rules.
