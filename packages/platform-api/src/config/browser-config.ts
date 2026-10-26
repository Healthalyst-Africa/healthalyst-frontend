/** Shared transport policy. Each application supplies its API address. */
export const PLATFORM_HTTP_CONFIGURATION = {
  timeoutMilliseconds: 30_000,
  requestedWith: "healthalyst",
  expirationMarginMilliseconds: 5_000,
} as const;

export const PLATFORM_SESSION_SIGNALS = {
  expiredEvent: "healthalyst-platform-session-expired",
  contextChangedEvent: "healthalyst-platform-context-changed",
} as const;

export const PUBLIC_PLATFORM_REQUEST = {
  platformAuthentication: "public",
} as const;

export const TERMINAL_AUTHENTICATION_ERRORS: readonly string[] = [
  "AUTH_SESSION_REVOKED",
  "AUTH_TOKEN_INVALID",
  "AUTH_REFRESH_INVALID",
];
