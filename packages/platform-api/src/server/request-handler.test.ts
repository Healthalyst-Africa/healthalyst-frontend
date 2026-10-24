import { AxiosHeaders, type AxiosResponse } from "axios";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi as mockUtilities,
} from "vitest";
import { handlePlatformBackendForFrontendRequest } from "../server";
import { API_REFRESH_COOKIE_NAME } from "./config/runtime-configuration";
import { REQUEST_BODY_LIMIT_BYTES } from "./config/request-policy";
import { platformApiClient } from "./http/upstream-client";
import { readCookieValue } from "./session/cookies";
import type { PlatformRouteConfiguration } from "./types/platform-session";

const APPLICATION_ORIGIN = "http://localhost:3005";
const ROUTE_CONFIGURATION: PlatformRouteConfiguration = {
  application: "organization",
  localOrigin: APPLICATION_ORIGIN,
  sessionCookieName: "__Host-organization-test-session",
  challengeCookieName: "__Secure-organization-test-challenge",
};

function createUpstreamResponse(
  body: unknown,
  status = 200,
  refreshCookie?: string
): AxiosResponse<Buffer> {
  return {
    data: Buffer.from(JSON.stringify(body)),
    status,
    statusText: "",
    headers: {
      "content-type": "application/json",
      ...(refreshCookie ? { "set-cookie": [refreshCookie] } : {}),
    },
    config: { headers: new AxiosHeaders() },
  };
}

function performRequest(
  platformPath: string,
  method = "GET",
  headers: Record<string, string> = {},
  body?: string
) {
  return handlePlatformBackendForFrontendRequest(
    new Request(`${APPLICATION_ORIGIN}/api/platform${platformPath}`, {
      method,
      headers,
      body,
    }),
    Promise.resolve({ path: platformPath.slice(1).split("/") }),
    ROUTE_CONFIGURATION
  );
}

function authenticatedBrowserHeaders(cookie?: string): Record<string, string> {
  return {
    origin: APPLICATION_ORIGIN,
    "x-requested-with": "healthalyst",
    "content-type": "application/json",
    ...(cookie ? { cookie } : {}),
  };
}

beforeEach(() => {
  mockUtilities.stubEnv("NODE_ENV", "development");
  mockUtilities.stubEnv("HEALTHALYST_APP_ORIGIN", APPLICATION_ORIGIN);
  mockUtilities.stubEnv(
    "HEALTHALYST_PLATFORM_API_URL",
    "https://platform.example.test"
  );
  mockUtilities.stubEnv(
    "HEALTHALYST_PLATFORM_SESSION_SECRET",
    "test-only-encryption-secret".repeat(2)
  );
  mockUtilities.stubEnv("HEALTHALYST_PLATFORM_SESSION_REDIS_URL", "");
});

afterEach(() => {
  mockUtilities.restoreAllMocks();
  mockUtilities.unstubAllEnvs();
});

describe("same-origin Platform request handler", () => {
  it("rejects cross-origin writes before sending anything upstream", async () => {
    const upstreamRequest = mockUtilities.spyOn(platformApiClient, "request");
    const response = await performRequest("/v1/auth/login", "POST", {
      origin: "https://untrusted.example.test",
      "x-requested-with": "healthalyst",
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: { code: "CSRF_CHECK_FAILED" },
    });
    expect(upstreamRequest).not.toHaveBeenCalled();
  });

  it("requires the requested-with header on same-origin writes", async () => {
    const response = await performRequest("/v1/auth/login", "POST", {
      origin: APPLICATION_ORIGIN,
    });
    expect(response.status).toBe(403);
  });

  it.each(["access_token", "refreshToken", "mfa-token"])(
    "rejects credentials in the query: %s",
    async (parameterName) => {
      const response = await handlePlatformBackendForFrontendRequest(
        new Request(
          `${APPLICATION_ORIGIN}/api/platform/v1/me?${parameterName}=token-fixture`
        ),
        Promise.resolve({ path: ["v1", "me"] }),
        ROUTE_CONFIGURATION
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({
        error: { code: "TOKEN_IN_QUERY_NOT_ALLOWED" },
      });
    }
  );

  it("hides the refresh endpoint from browser callers", async () => {
    const response = await performRequest(
      "/v1/auth/refresh",
      "POST",
      authenticatedBrowserHeaders()
    );
    expect(response.status).toBe(404);
  });

  it("clears an absent or stale session without contacting the upstream API", async () => {
    const upstreamRequest = mockUtilities.spyOn(platformApiClient, "request");
    const absentResponse = await performRequest("/v1/me");
    expect(absentResponse.status).toBe(401);
    expect(absentResponse.headers.get("X-Platform-Session-Expired")).toBe(
      "true"
    );
    expect(await absentResponse.json()).toMatchObject({
      error: { code: "AUTH_TOKEN_MISSING" },
    });
    const staleResponse = await performRequest("/v1/me", "GET", {
      cookie: `${ROUTE_CONFIGURATION.sessionCookieName}=missing-session-fixture`,
    });
    expect(staleResponse.status).toBe(401);
    expect(await staleResponse.json()).toMatchObject({
      error: { code: "AUTH_SESSION_EXPIRED" },
    });
    expect(staleResponse.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(upstreamRequest).not.toHaveBeenCalled();
  });

  it("requires configured persistent storage outside development", async () => {
    mockUtilities.stubEnv("NODE_ENV", "production");
    const response = await performRequest("/v1/me");
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "PLATFORM_SESSION_CONFIGURATION_MISSING" },
    });
  });

  it("limits request bodies before forwarding them", async () => {
    const response = await performRequest(
      "/v1/auth/login",
      "POST",
      {
        ...authenticatedBrowserHeaders(),
        "content-length": String(REQUEST_BODY_LIMIT_BYTES + 1),
      },
      "{}"
    );
    expect(response.status).toBe(413);
  });

  it("coordinates concurrent session restores through one upstream refresh", async () => {
    const upstreamRequest = mockUtilities.spyOn(platformApiClient, "request");
    upstreamRequest.mockResolvedValueOnce(
      createUpstreamResponse(
        { accessToken: "expiring-access-token-fixture", expiresIn: 1 },
        200,
        `${API_REFRESH_COOKIE_NAME}=refresh-token-fixture; Path=/; HttpOnly; Secure; Max-Age=600`
      )
    );
    const confirmationResponse = await performRequest(
      "/v1/auth/mfa/verify",
      "POST",
      authenticatedBrowserHeaders(
        `${ROUTE_CONFIGURATION.challengeCookieName}=challenge-token-fixture`
      ),
      JSON.stringify({ code: "123456" })
    );
    const sessionIdentifier = readCookieValue(
      confirmationResponse.headers.get("set-cookie"),
      ROUTE_CONFIGURATION.sessionCookieName
    );
    expect(sessionIdentifier).toBeTruthy();
    const upstreamRefresh = mockUtilities
      .spyOn(platformApiClient, "post")
      .mockResolvedValueOnce(
        createUpstreamResponse(
          { accessToken: "refreshed-access-token-fixture", expiresIn: 120 },
          200,
          `${API_REFRESH_COOKIE_NAME}=rotated-refresh-token-fixture; Path=/; HttpOnly; Secure; Max-Age=600`
        )
      );
    upstreamRequest.mockResolvedValue(
      createUpstreamResponse({ user: { firstName: "Example" } })
    );
    const headers = {
      cookie: `${ROUTE_CONFIGURATION.sessionCookieName}=${sessionIdentifier}`,
    };
    const responses = await Promise.all([
      performRequest("/v1/me", "GET", headers),
      performRequest("/v1/me", "GET", headers),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(upstreamRefresh).toHaveBeenCalledOnce();
    expect(upstreamRefresh).toHaveBeenCalledWith(
      "https://platform.example.test/v1/auth/refresh",
      undefined,
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: `${API_REFRESH_COOKIE_NAME}=refresh-token-fixture`,
          "X-Requested-With": "healthalyst",
        }),
      })
    );
    expect(upstreamRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer refreshed-access-token-fixture",
        }),
      })
    );
    expect(responses[0]?.headers.get("set-cookie")).not.toContain(
      "refreshed-access-token-fixture"
    );
  });

  it("holds challenge and access tokens on the server and restores the cookie session", async () => {
    const upstreamRequest = mockUtilities.spyOn(platformApiClient, "request");
    upstreamRequest.mockResolvedValueOnce(
      createUpstreamResponse({
        mfaToken: "challenge-token-fixture",
        expiresIn: 90,
      })
    );
    const loginResponse = await performRequest(
      "/v1/auth/login",
      "POST",
      authenticatedBrowserHeaders(),
      "{}"
    );
    expect(await loginResponse.json()).toEqual({ expiresIn: 90 });
    const challengeToken = readCookieValue(
      loginResponse.headers.get("set-cookie"),
      ROUTE_CONFIGURATION.challengeCookieName
    );
    expect(challengeToken).toBe("challenge-token-fixture");

    upstreamRequest.mockResolvedValueOnce(
      createUpstreamResponse(
        { accessToken: "access-token-fixture", expiresIn: 120 },
        200,
        `${API_REFRESH_COOKIE_NAME}=refresh-token-fixture; Path=/; HttpOnly; Secure; Max-Age=600`
      )
    );
    const confirmationResponse = await performRequest(
      "/v1/auth/mfa/verify",
      "POST",
      authenticatedBrowserHeaders(
        `${ROUTE_CONFIGURATION.challengeCookieName}=${challengeToken}`
      ),
      JSON.stringify({ code: "123456" })
    );
    expect(await confirmationResponse.json()).toEqual({ expiresIn: 120 });
    const sessionCookieHeader = confirmationResponse.headers.get("set-cookie");
    const sessionIdentifier = readCookieValue(
      sessionCookieHeader,
      ROUTE_CONFIGURATION.sessionCookieName
    );
    expect(sessionIdentifier).toBeTruthy();
    expect(sessionCookieHeader).not.toContain("access-token-fixture");
    expect(sessionCookieHeader).not.toContain("refresh-token-fixture");

    upstreamRequest.mockResolvedValueOnce(
      createUpstreamResponse({ user: { firstName: "Example" } })
    );
    const sessionCookie = `${ROUTE_CONFIGURATION.sessionCookieName}=${sessionIdentifier}`;
    const profileResponse = await performRequest("/v1/me", "GET", {
      cookie: sessionCookie,
    });
    expect(profileResponse.status).toBe(200);
    expect(await profileResponse.json()).toEqual({
      user: { firstName: "Example" },
    });
    expect(upstreamRequest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: "https://platform.example.test/v1/me",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token-fixture",
        }),
      })
    );

    upstreamRequest.mockRejectedValueOnce(new Error("Upstream unavailable"));
    const logoutResponse = await performRequest(
      "/v1/auth/logout",
      "POST",
      authenticatedBrowserHeaders(sessionCookie)
    );
    expect(logoutResponse.status).toBe(502);
    expect(logoutResponse.headers.get("set-cookie")).toContain("Max-Age=0");
    const signedOutResponse = await performRequest("/v1/me", "GET", {
      cookie: sessionCookie,
    });
    expect(signedOutResponse.status).toBe(401);
  });
});
