/** Public transport settings shared by browser clients and their own BFF. */
export const PLATFORM_HTTP_CONFIGURATION = {
  basePath: "/api/platform",
  timeoutMilliseconds: 30_000,
  requestedWith: "healthalyst",
} as const;

export const PLATFORM_SESSION_SIGNALS = {
  expiredEvent: "healthalyst-platform-session-expired",
  expiredHeader: "X-Platform-Session-Expired",
} as const;
