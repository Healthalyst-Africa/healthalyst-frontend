import "server-only";

export const PLATFORM_ROUTE_CONFIGURATION = {
  application: "super-admin",
  localOrigin: "http://localhost:8080",
  sessionCookieName: "__Host-healthalyst-super-admin-session",
  challengeCookieName: "__Secure-healthalyst-super-admin-auth-challenge",
} as const;
