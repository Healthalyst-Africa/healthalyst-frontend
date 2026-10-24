import { AUTHENTICATION_ENDPOINTS } from "../../authentication/config/authentication-requests";

const ALLOWED_PLATFORM_PATHS = [
  "/v1/auth/",
  AUTHENTICATION_ENDPOINTS.profile,
  "/v1/reference/",
  "/v1/onboarding/",
  "/v1/organization",
  "/v1/admin/organizations",
  "/v1/admin/dashboard",
];

const PUBLIC_AUTHENTICATION_PATHS: readonly string[] = [
  AUTHENTICATION_ENDPOINTS.signIn,
  AUTHENTICATION_ENDPOINTS.verifySignIn,
  AUTHENTICATION_ENDPOINTS.authenticatorSetup,
  AUTHENTICATION_ENDPOINTS.authenticatorConfirmation,
  AUTHENTICATION_ENDPOINTS.verifyEmail,
  AUTHENTICATION_ENDPOINTS.resendEmail,
  AUTHENTICATION_ENDPOINTS.forgotPassword,
  AUTHENTICATION_ENDPOINTS.resetPassword,
];

export function isAllowedPlatformPath(platformPath: string): boolean {
  if (!platformPath.startsWith("/v1/")) return false;
  if (
    platformPath.includes("\\") ||
    platformPath.includes("%") ||
    platformPath.includes("//")
  ) {
    return false;
  }
  const pathSegments = platformPath.split("/").filter(Boolean);
  if (
    pathSegments.some(
      (pathSegment) => pathSegment === "." || pathSegment === ".."
    )
  ) {
    return false;
  }
  return ALLOWED_PLATFORM_PATHS.some((allowedPath) =>
    allowedPath.endsWith("/")
      ? platformPath.startsWith(allowedPath)
      : platformPath === allowedPath ||
        platformPath.startsWith(`${allowedPath}/`)
  );
}

export function isPublicPlatformPath(platformPath: string): boolean {
  return (
    PUBLIC_AUTHENTICATION_PATHS.includes(platformPath) ||
    platformPath.startsWith("/v1/reference/") ||
    platformPath === "/v1/onboarding/registrations"
  );
}

export function shouldSendExistingSession(platformPath: string): boolean {
  return !PUBLIC_AUTHENTICATION_PATHS.includes(platformPath);
}

export function isAuthenticationEstablishingPath(
  platformPath: string
): boolean {
  return (
    platformPath === AUTHENTICATION_ENDPOINTS.verifySignIn ||
    platformPath === AUTHENTICATION_ENDPOINTS.authenticatorConfirmation
  );
}

export function isAuthenticationChallengeStartingPath(
  platformPath: string
): boolean {
  return (
    platformPath === AUTHENTICATION_ENDPOINTS.signIn ||
    platformPath === AUTHENTICATION_ENDPOINTS.verifyEmail
  );
}

export function getAuthenticationChallengeRequestField(
  platformPath: string
): "mfaToken" | "enrolmentToken" | null {
  if (platformPath === AUTHENTICATION_ENDPOINTS.verifySignIn) return "mfaToken";
  if (
    platformPath === AUTHENTICATION_ENDPOINTS.authenticatorSetup ||
    platformPath === AUTHENTICATION_ENDPOINTS.authenticatorConfirmation
  ) {
    return "enrolmentToken";
  }
  return null;
}

export function isSessionTerminationPath(platformPath: string): boolean {
  return (
    platformPath === AUTHENTICATION_ENDPOINTS.signOut ||
    platformPath === AUTHENTICATION_ENDPOINTS.signOutAll
  );
}
