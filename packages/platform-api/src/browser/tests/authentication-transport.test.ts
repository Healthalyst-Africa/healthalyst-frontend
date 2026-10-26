import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi as mockUtilities } from "vitest";
import { PUBLIC_PLATFORM_REQUEST } from "../../config/browser-config";
import {
  createCredential,
  createTransportFixture,
  errorBody,
  respond,
} from "./transport-fixtures";

const REFRESH_ENDPOINT = "/v1/auth/refresh";

function countRefreshes(requests: InternalAxiosRequestConfig[]) {
  return requests.filter(
    (requestConfiguration) => requestConfiguration.url === REFRESH_ENDPOINT
  ).length;
}

describe("Platform bearer transport", () => {
  it.each([
    { format: "an opaque test token", accessToken: "test-access-credential" },
    {
      format: "a JWT carrying the restored account subject",
      accessToken: `test-header.${btoa(JSON.stringify({ sub: "00000000-0000-4000-8000-000000000001" }))}.test-signature`,
    },
  ])(
    "restores a missing credential once for simultaneous protected calls using $format",
    async ({ accessToken }) => {
      const onContextChanged = mockUtilities.fn();
      const transport = createTransportFixture(
        (requestConfiguration) =>
          requestConfiguration.url === REFRESH_ENDPOINT
            ? createCredential(accessToken)
            : { user: "example" },
        { onContextChanged }
      );
      await Promise.all([
        transport.httpClient.get("/v1/me"),
        transport.httpClient.get("/v1/organization"),
        transport.httpClient.get("/v1/auth/sessions"),
      ]);
      expect(countRefreshes(transport.requests)).toBe(1);
      const refreshRequest = transport.requests.find(
        (requestConfiguration) => requestConfiguration.url === REFRESH_ENDPOINT
      );
      expect(refreshRequest?.headers.get("X-Requested-With")).toBe(
        "healthalyst"
      );
      expect(refreshRequest?.headers.has("Authorization")).toBe(false);
      expect(refreshRequest?.headers.get("Content-Type")).toBe(null);
      expect(refreshRequest?.withCredentials).toBe(true);
      expect(
        transport.requests
          .filter(
            (requestConfiguration) =>
              requestConfiguration.url !== REFRESH_ENDPOINT
          )
          .every(
            (requestConfiguration) =>
              requestConfiguration.headers.get("Authorization") ===
              `Bearer ${accessToken}`
          )
      ).toBe(true);
      expect(onContextChanged).not.toHaveBeenCalled();
    }
  );

  it("keeps password and registration requests public without refreshing", async () => {
    const transport = createTransportFixture(() => ({ status: "ACCEPTED" }));
    await transport.httpClient.post(
      "/v1/auth/login",
      {},
      PUBLIC_PLATFORM_REQUEST
    );
    await transport.httpClient.post(
      "/v1/onboarding/registrations",
      {},
      PUBLIC_PLATFORM_REQUEST
    );
    expect(countRefreshes(transport.requests)).toBe(0);
    expect(
      transport.requests.every(
        (requestConfiguration) =>
          !requestConfiguration.headers.has("Authorization")
      )
    ).toBe(true);
  });

  it("shares one refresh when concurrent requests report an expired token", async () => {
    const transport = createTransportFixture((requestConfiguration) => {
      if (requestConfiguration.url === REFRESH_ENDPOINT)
        return createCredential("renewed-credential");
      if (
        requestConfiguration.headers.get("Authorization") ===
        "Bearer expired-credential"
      )
        return respond(
          requestConfiguration,
          errorBody("AUTH_TOKEN_EXPIRED"),
          401
        ).data;
      return { success: true };
    });
    transport.replaceAccessCredential(createCredential("expired-credential"));
    await Promise.all([
      transport.httpClient.get("/v1/me"),
      transport.httpClient.get("/v1/organization"),
    ]);
    expect(countRefreshes(transport.requests)).toBe(1);
    expect(
      transport.requests
        .slice(-2)
        .every(
          (requestConfiguration) =>
            requestConfiguration.headers.get("Authorization") ===
            "Bearer renewed-credential"
        )
    ).toBe(true);
  });

  it("refreshes before a request when the known credential has expired", async () => {
    const transport = createTransportFixture((requestConfiguration) =>
      requestConfiguration.url === REFRESH_ENDPOINT
        ? createCredential("renewed-credential")
        : {}
    );
    transport.replaceAccessCredential({ ...createCredential(), expiresIn: 1 });
    await transport.httpClient.get("/v1/me");
    expect(countRefreshes(transport.requests)).toBe(1);
  });

  it("does not loop when the retried request is still rejected", async () => {
    const onSessionExpired = mockUtilities.fn();
    const transport = createTransportFixture(
      (requestConfiguration) =>
        requestConfiguration.url === REFRESH_ENDPOINT
          ? createCredential()
          : respond(requestConfiguration, errorBody("AUTH_TOKEN_EXPIRED"), 401)
              .data,
      { onSessionExpired }
    );
    transport.replaceAccessCredential(createCredential());
    await expect(transport.httpClient.get("/v1/me")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(countRefreshes(transport.requests)).toBe(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it("clears identity when the refresh cookie is invalid and stops protected calls", async () => {
    const onSessionExpired = mockUtilities.fn();
    const transport = createTransportFixture(
      (requestConfiguration) =>
        respond(requestConfiguration, errorBody("AUTH_REFRESH_INVALID"), 401)
          .data,
      { onSessionExpired }
    );
    await expect(transport.httpClient.get("/v1/me")).rejects.toMatchObject({
      response: { status: 401 },
    });
    await expect(transport.httpClient.get("/v1/me")).rejects.toMatchObject({
      code: "AUTH_REFRESH_INVALID",
    });
    expect(countRefreshes(transport.requests)).toBe(1);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it.each([403, 429, 503])(
    "preserves a recoverable refresh failure with status %s",
    async (status) => {
      const onSessionExpired = mockUtilities.fn();
      let hasFailed = false;
      const transport = createTransportFixture(
        (requestConfiguration) => {
          if (!hasFailed) {
            hasFailed = true;
            return respond(
              requestConfiguration,
              errorBody("SERVICE_UNAVAILABLE"),
              status
            ).data;
          }
          return requestConfiguration.url === REFRESH_ENDPOINT
            ? createCredential()
            : {};
        },
        { onSessionExpired }
      );
      await expect(transport.httpClient.get("/v1/me")).rejects.toMatchObject({
        response: { status },
      });
      await expect(transport.httpClient.get("/v1/me")).resolves.toMatchObject({
        status: 200,
      });
      expect(onSessionExpired).not.toHaveBeenCalled();
    }
  );

  it("preserves a network failure so the person can retry restoration", async () => {
    const onSessionExpired = mockUtilities.fn();
    let hasFailed = false;
    const transport = createTransportFixture(
      (requestConfiguration) => {
        if (!hasFailed) {
          hasFailed = true;
          throw new AxiosError(
            "Network unavailable",
            "ERR_NETWORK",
            requestConfiguration
          );
        }
        return requestConfiguration.url === REFRESH_ENDPOINT
          ? createCredential()
          : {};
      },
      { onSessionExpired }
    );
    await expect(transport.httpClient.get("/v1/me")).rejects.toMatchObject({
      code: "ERR_NETWORK",
    });
    await expect(transport.httpClient.get("/v1/me")).resolves.toMatchObject({
      status: 200,
    });
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it.each([422, 429, 500])(
    "does not repeat a write after HTTP %s",
    async (status) => {
      const transport = createTransportFixture(
        (requestConfiguration) =>
          respond(requestConfiguration, errorBody("REQUEST_FAILED"), status)
            .data
      );
      transport.replaceAccessCredential(createCredential());
      await expect(
        transport.httpClient.post("/v1/organization/branches", {})
      ).rejects.toMatchObject({ response: { status } });
      expect(transport.requests).toHaveLength(1);
    }
  );

  it("does not turn an invalid MFA code into a global session failure", async () => {
    const onSessionExpired = mockUtilities.fn();
    const transport = createTransportFixture(
      (requestConfiguration) =>
        respond(requestConfiguration, errorBody("AUTH_MFA_INVALID"), 401).data,
      { onSessionExpired }
    );
    await expect(
      transport.httpClient.post(
        "/v1/auth/mfa/verify",
        {},
        PUBLIC_PLATFORM_REQUEST
      )
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(countRefreshes(transport.requests)).toBe(0);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("cannot resurrect a session when refresh finishes after logout", async () => {
    let completeRefresh:
      ((value: ReturnType<typeof createCredential>) => void) | undefined;
    const transport = createTransportFixture(
      () =>
        new Promise((resolve) => {
          completeRefresh = resolve;
        })
    );
    const request = transport.refreshAccessCredential();
    await mockUtilities.waitFor(() => expect(completeRefresh).toBeDefined());
    transport.clearSession();
    completeRefresh?.(createCredential());
    await expect(request).rejects.toMatchObject({
      code: "AUTH_REFRESH_INVALID",
    });
    await expect(transport.httpClient.get("/v1/me")).rejects.toMatchObject({
      code: "AUTH_REFRESH_INVALID",
    });
    expect(transport.requests).toHaveLength(1);
  });

  it("allows an explicit restore after a cookie was established in another app", async () => {
    const transport = createTransportFixture((requestConfiguration) =>
      requestConfiguration.url === REFRESH_ENDPOINT ? createCredential() : {}
    );
    transport.clearSession();
    await expect(transport.httpClient.get("/v1/me")).rejects.toMatchObject({
      code: "AUTH_REFRESH_INVALID",
    });
    transport.beginSessionRestoration();
    await expect(transport.httpClient.get("/v1/me")).resolves.toMatchObject({
      status: 200,
    });
    expect(countRefreshes(transport.requests)).toBe(1);
  });

  it("discards a stale refresh when a newer login has supplied a credential", async () => {
    let completeRefresh:
      ((value: ReturnType<typeof createCredential>) => void) | undefined;
    const transport = createTransportFixture((requestConfiguration) =>
      requestConfiguration.url === REFRESH_ENDPOINT
        ? new Promise((resolve) => {
            completeRefresh = resolve;
          })
        : {}
    );
    const refresh = transport.refreshAccessCredential();
    await mockUtilities.waitFor(() => expect(completeRefresh).toBeDefined());
    transport.replaceAccessCredential(createCredential("new-login-credential"));
    completeRefresh?.(createCredential("old-refresh-credential"));
    await refresh;
    await transport.httpClient.get("/v1/me");
    expect(transport.requests.at(-1)?.headers.get("Authorization")).toBe(
      "Bearer new-login-credential"
    );
  });

  it("does not repeat an expired write under a different organisation context", async () => {
    const onContextChanged = mockUtilities.fn();
    const transport = createTransportFixture(
      (requestConfiguration) =>
        requestConfiguration.url === REFRESH_ENDPOINT
          ? {
              ...createCredential(),
              activeContext: {
                ...createCredential().activeContext,
                organizationId: "00000000-0000-4000-8000-000000000009",
              },
            }
          : respond(requestConfiguration, errorBody("AUTH_TOKEN_EXPIRED"), 401)
              .data,
      { onContextChanged }
    );
    transport.replaceAccessCredential(createCredential());
    await expect(
      transport.httpClient.post("/v1/organization/branches", {})
    ).rejects.toMatchObject({ code: "AUTH_CONTEXT_CHANGED" });
    expect(
      transport.requests.filter(
        (requestConfiguration) => requestConfiguration.url !== REFRESH_ENDPOINT
      )
    ).toHaveLength(1);
    expect(onContextChanged).toHaveBeenCalledTimes(1);
  });

  it("does not replay an old write after another account signs in to the same organisation", async () => {
    const transport = createTransportFixture((requestConfiguration) => {
      transport.replaceAccessCredential(
        createCredential("new-user-credential"),
        "another-user"
      );
      return respond(requestConfiguration, errorBody("AUTH_TOKEN_EXPIRED"), 401)
        .data;
    });
    transport.replaceAccessCredential(
      createCredential("old-user-credential"),
      "original-user"
    );
    await expect(
      transport.httpClient.post("/v1/organization/branches", {})
    ).rejects.toMatchObject({ code: "AUTH_CONTEXT_CHANGED" });
    expect(transport.requests).toHaveLength(1);
  });

  it("blocks replay when a shared refresh cookie now belongs to another account in the same organisation", async () => {
    const originalUser = "00000000-0000-4000-8000-000000000001";
    const anotherUser = "00000000-0000-4000-8000-000000000009";
    const refreshedCredential = {
      ...createCredential(),
      accessToken: `test-header.${btoa(JSON.stringify({ sub: anotherUser }))}.test-signature`,
    };
    const onContextChanged = mockUtilities.fn();
    const transport = createTransportFixture(
      (requestConfiguration) =>
        requestConfiguration.url === REFRESH_ENDPOINT
          ? refreshedCredential
          : respond(requestConfiguration, errorBody("AUTH_TOKEN_EXPIRED"), 401)
              .data,
      { onContextChanged }
    );
    transport.replaceAccessCredential(createCredential(), originalUser);
    await expect(
      transport.httpClient.post("/v1/organization/branches", {})
    ).rejects.toMatchObject({ code: "AUTH_CONTEXT_CHANGED" });
    expect(
      transport.requests.filter(
        (requestConfiguration) => requestConfiguration.url !== REFRESH_ENDPOINT
      )
    ).toHaveLength(1);
    expect(onContextChanged).toHaveBeenCalledTimes(1);
  });

  it("rejects malformed refresh bodies without pretending the user is signed out", async () => {
    const onSessionExpired = mockUtilities.fn();
    const transport = createTransportFixture(
      () => ({ tokenType: "Bearer", expiresIn: 600 }),
      { onSessionExpired }
    );
    await expect(transport.httpClient.get("/v1/me")).rejects.toMatchObject({
      code: "INVALID_PLATFORM_RESPONSE",
      status: 200,
    });
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it("never attaches a credential to a caller-supplied absolute destination", async () => {
    const transport = createTransportFixture(() => ({}));
    transport.replaceAccessCredential(createCredential());
    await expect(
      transport.httpClient.get("https://untrusted.example.test/v1/me")
    ).rejects.toThrow("relative /v1/");
    expect(transport.requests).toHaveLength(0);
    await transport.httpClient.get("/v1/me", {
      baseURL: "https://untrusted.example.test",
      timeout: 0,
    });
    expect(transport.requests[0]?.baseURL).toBe(
      "https://platform.example.test"
    );
    expect(transport.requests[0]?.timeout).toBe(30_000);
  });

  it.each(["AUTH_TOKEN_EXPIRED", "AUTH_TOKEN_INVALID"])(
    "keeps product cookies separate and refreshes through Platform for %s",
    async (errorCode) => {
      const transport = createTransportFixture(() =>
        createCredential("product-renewed-credential")
      );
      transport.replaceAccessCredential(createCredential("expired-credential"));
      const productRequests: InternalAxiosRequestConfig[] = [];
      const product = transport.createProductHttpClient(
        "https://schedule.example.test",
        axios.create({
          adapter: async (requestConfiguration) => {
            productRequests.push(requestConfiguration);
            if (
              requestConfiguration.headers.get("Authorization") ===
              "Bearer expired-credential"
            )
              return respond(requestConfiguration, errorBody(errorCode), 401);
            return respond(requestConfiguration, { name: "Example clinic" });
          },
        })
      );
      await product.get("/v1/organization");
      expect(countRefreshes(transport.requests)).toBe(1);
      expect(productRequests).toHaveLength(2);
      expect(
        productRequests.every(
          (requestConfiguration) =>
            requestConfiguration.withCredentials === false &&
            requestConfiguration.baseURL === "https://schedule.example.test"
        )
      ).toBe(true);
      expect(productRequests.at(-1)?.headers.get("Authorization")).toBe(
        "Bearer product-renewed-credential"
      );
    }
  );

  it("does not destroy Platform authentication for a rejected product audience", async () => {
    const onSessionExpired = mockUtilities.fn();
    const transport = createTransportFixture(
      (requestConfiguration) =>
        requestConfiguration.url === REFRESH_ENDPOINT ? createCredential() : {},
      { onSessionExpired }
    );
    transport.replaceAccessCredential(createCredential());
    const product = transport.createProductHttpClient(
      "https://schedule.example.test",
      axios.create({
        adapter: async (requestConfiguration) =>
          respond(requestConfiguration, errorBody("AUTH_TOKEN_INVALID"), 401),
      })
    );
    await expect(product.get("/v1/organization")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(countRefreshes(transport.requests)).toBe(1);
    await expect(transport.httpClient.get("/v1/me")).resolves.toMatchObject({
      status: 200,
    });
  });
});
