import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { addAuthenticationChallengeToRequestBody } from "./authentication/challenge";
import {
  isAllowedPlatformPath,
  isPublicPlatformPath,
} from "./config/route-policy";
import { sanitizeSensitiveResponseValue } from "./http/response-values";
import {
  appendAuthenticationChallengeCookie,
  appendSessionCookie,
  readCookieValue,
} from "./session/cookies";
import { decryptSession, encryptSession } from "./session/encryption";
import type { PlatformBackendSession } from "./types/platform-session";

describe("Platform proxy security contracts", () => {
  it.each([
    "/v1/auth/../me",
    "/v1/auth/%2e%2e/me",
    "/v1/auth\\login",
    "/v1/auth//login",
    "/v1/organization-admin",
    "/v1/private/diagnostics",
    "https://another.example.test/v1/me",
  ])("does not allow an untrusted target path: %s", (platformPath) => {
    expect(isAllowedPlatformPath(platformPath)).toBe(false);
  });

  it("preserves public onboarding paths and protects organisation reads", () => {
    expect(isAllowedPlatformPath("/v1/organization/documents")).toBe(true);
    expect(isPublicPlatformPath("/v1/onboarding/registrations")).toBe(true);
    expect(isPublicPlatformPath("/v1/reference/organization-types")).toBe(true);
    expect(isPublicPlatformPath("/v1/organization")).toBe(false);
  });

  it("removes every upstream credential recursively without removing business data", () => {
    expect(
      sanitizeSensitiveResponseValue({
        accessToken: "access-token-fixture",
        refresh_token: "refresh-token-fixture",
        nested: [
          { "mfa-token": "challenge-token-fixture", name: "Organisation" },
        ],
        organizationId: "organisation-identifier",
      })
    ).toEqual({
      nested: [{ name: "Organisation" }],
      organizationId: "organisation-identifier",
    });
  });

  it("takes the authentication challenge from the server cookie instead of browser input", () => {
    const requestBody = addAuthenticationChallengeToRequestBody(
      Buffer.from(
        JSON.stringify({ code: "123456", mfaToken: "browser-value" })
      ),
      "mfaToken",
      "server-challenge-fixture"
    );
    expect(JSON.parse(requestBody.toString())).toEqual({
      code: "123456",
      mfaToken: "server-challenge-fixture",
    });
    expect(() =>
      addAuthenticationChallengeToRequestBody(
        Buffer.from("[]"),
        "mfaToken",
        "server-challenge-fixture"
      )
    ).toThrow();
  });

  it("scopes challenge cookies to authentication and session cookies to the host root", () => {
    const sessionHeaders = new Headers();
    appendSessionCookie(
      sessionHeaders,
      "__Host-session",
      "opaque-identifier",
      Date.now() + 60_000
    );
    expect(sessionHeaders.get("set-cookie")).toContain(
      "Path=/; HttpOnly; Secure; SameSite=Strict"
    );
    const challengeHeaders = new Headers();
    appendAuthenticationChallengeCookie(
      challengeHeaders,
      "__Secure-challenge",
      "challenge-token-fixture",
      60_000
    );
    expect(challengeHeaders.get("set-cookie")).toContain(
      "Path=/api/platform/v1/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=600"
    );
    appendSessionCookie(sessionHeaders, "__Host-session", null);
    expect(sessionHeaders.get("set-cookie")).toContain(
      "__Host-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
    );
    expect(
      readCookieValue(
        "other=value; __Host-session=opaque-identifier",
        "__Host-session"
      )
    ).toBe("opaque-identifier");
    expect(
      readCookieValue("__Host-session=%invalid", "__Host-session")
    ).toBeNull();
  });

  it("binds encrypted sessions to their application and opaque cookie identity", () => {
    const encryptionKey = randomBytes(32);
    const session: PlatformBackendSession = {
      accessToken: "access-token-fixture",
      accessTokenExpiresAt: Date.now() + 60_000,
      refreshToken: "refresh-token-fixture",
      refreshTokenExpiresAt: Date.now() + 600_000,
    };
    const encryptedSession = encryptSession(
      session,
      encryptionKey,
      "session-identifier",
      "organization"
    );
    expect(encryptedSession).not.toContain(session.accessToken);
    expect(
      decryptSession(
        encryptedSession,
        encryptionKey,
        "session-identifier",
        "organization"
      )
    ).toEqual(session);
    expect(
      decryptSession(
        encryptedSession,
        encryptionKey,
        "other-session",
        "organization"
      )
    ).toBeNull();
    expect(
      decryptSession(
        encryptedSession,
        encryptionKey,
        "session-identifier",
        "super-admin"
      )
    ).toBeNull();
    expect(
      decryptSession(
        encryptedSession,
        randomBytes(32),
        "session-identifier",
        "organization"
      )
    ).toBeNull();
    const expiredSession = encryptSession(
      { ...session, refreshTokenExpiresAt: Date.now() - 1 },
      encryptionKey,
      "session-identifier",
      "organization"
    );
    expect(
      decryptSession(
        expiredSession,
        encryptionKey,
        "session-identifier",
        "organization"
      )
    ).toBeNull();
  });
});
