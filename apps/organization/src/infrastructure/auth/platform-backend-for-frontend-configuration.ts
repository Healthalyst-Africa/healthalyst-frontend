import "server-only";

export const PLATFORM_BACKEND_FOR_FRONTEND_CONFIGURATION = {
  application: "organization",
  localOrigin: "http://localhost:3005",
  sessionCookieName: "__Host-healthalyst-organization-session",
  challengeCookieName: "__Secure-healthalyst-organization-auth-challenge",
} as const;
