# Platform API integration

This package shares the NestJS Platform contract across frontend apps. Apps own
their workflows and supply server route configuration; the package owns browser
transport, authentication requests and the BFF session implementation.

## Public imports

| Import                                             | Responsibility                                                |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `@healthalyst/platform-api/authentication-service` | Auth operations and domain types                              |
| `@healthalyst/platform-api/http-client`            | Same-origin Axios transport                                   |
| `@healthalyst/platform-api/api-error`              | Normalised transport errors                                   |
| `@healthalyst/platform-api/config`                 | Safe browser transport settings and session signals           |
| `@healthalyst/platform-api/server`                 | Server route handler only; never import in a client component |

```text
src/
  authentication/           Auth services, schemas, types, endpoint config
  browser/                  Axios, response error schema and error translation
  config/                   Public transport defaults
  server/
    authentication/         Temporary MFA/enrolment challenge handling
    config/                 Runtime settings, request/route/session policies
    http/                   Request validation and upstream response processing
    schemas/                Stored session validation
    session/                Cookies, encryption, refresh and session lifecycle
    stores/                 Redis and development memory adapters
    types/                  Server contracts
    request-handler.ts      Request orchestration
  server.ts                 Public server entry
```

Browser requests go to `/api/platform` on the app's origin. Access and refresh
tokens remain in encrypted server session storage. The browser receives an opaque
HttpOnly session cookie. The server entry reads the documented server-only
environment variables from the app process; see the owning app's `.env.example`.
Do not import server internals from browser code or persist bearer tokens in a
browser cache.

Tests exercise the public request handler and profile restoration contract.
Internal files can be reorganised without changing consumer import paths.
See [code organisation](../../docs/code-organization.md) for dependency rules.
