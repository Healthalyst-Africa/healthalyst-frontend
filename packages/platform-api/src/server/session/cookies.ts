import {
  AUTHENTICATION_CHALLENGE_COOKIE_MAX_AGE_SECONDS,
  AUTHENTICATION_CHALLENGE_COOKIE_PATH,
  SESSION_COOKIE_MAX_AGE_SECONDS,
} from "../config/session-policy";

export function readCookieValue(
  cookieHeader: string | null,
  cookieName: string
): string | null {
  if (!cookieHeader) return null;
  for (const cookiePart of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookiePart.trim().split("=");
    if (name === cookieName) {
      const encodedValue = valueParts.join("=");
      if (!encodedValue) return null;
      try {
        return decodeURIComponent(encodedValue);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function appendAuthenticationChallengeCookie(
  responseHeaders: Headers,
  cookieName: string,
  challengeToken: string | null,
  expiresIn = AUTHENTICATION_CHALLENGE_COOKIE_MAX_AGE_SECONDS
): void {
  const maxAge = challengeToken
    ? Math.max(
        1,
        Math.min(AUTHENTICATION_CHALLENGE_COOKIE_MAX_AGE_SECONDS, expiresIn)
      )
    : 0;
  responseHeaders.append(
    "Set-Cookie",
    `${cookieName}=${challengeToken ? encodeURIComponent(challengeToken) : ""}; Path=${AUTHENTICATION_CHALLENGE_COOKIE_PATH}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
  );
}

export function appendSessionCookie(
  responseHeaders: Headers,
  cookieName: string,
  sessionIdentifier: string | null,
  expiresAt?: number
): void {
  const maxAge = sessionIdentifier
    ? Math.max(
        1,
        Math.min(
          SESSION_COOKIE_MAX_AGE_SECONDS,
          Math.floor(
            ((expiresAt ?? Date.now() + SESSION_COOKIE_MAX_AGE_SECONDS * 1000) -
              Date.now()) /
              1000
          )
        )
      )
    : 0;
  responseHeaders.append(
    "Set-Cookie",
    `${cookieName}=${sessionIdentifier ?? ""}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`
  );
}
