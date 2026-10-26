import axios, { type AxiosInstance } from "axios";
import type {} from "../types/request-configuration";
import {
  PLATFORM_HTTP_CONFIGURATION,
  TERMINAL_AUTHENTICATION_ERRORS,
} from "../../config/browser-config";
import { platformErrorBodySchema } from "../schemas/error-response";
import type { AccessCredential } from "../types/access-credential";
import type { AccessCredentialStore } from "../session/create-access-credential-store";
import { createSessionExpiredError } from "../session/create-session-refresh";
import { getCredentialContextScope } from "../session/create-access-credential-store";
import { PlatformApiError } from "../errors/platform-api-error";

export function installBearerAuthentication(properties: {
  httpClient: AxiosInstance;
  address: string;
  credentialStore: AccessCredentialStore;
  refresh: () => Promise<AccessCredential>;
  platformBoundary: boolean;
}) {
  const { httpClient, credentialStore } = properties;
  httpClient.interceptors.request.use(async (requestConfiguration) => {
    if (
      !requestConfiguration.url?.startsWith("/v1/") ||
      requestConfiguration.url.includes("\\")
    ) {
      throw new Error("API requests must use a relative /v1/ endpoint.");
    }
    requestConfiguration.baseURL = properties.address;
    requestConfiguration.timeout =
      PLATFORM_HTTP_CONFIGURATION.timeoutMilliseconds;
    requestConfiguration.withCredentials = properties.platformBoundary;
    if (properties.platformBoundary)
      requestConfiguration.headers.set(
        "X-Requested-With",
        PLATFORM_HTTP_CONFIGURATION.requestedWith
      );
    if (requestConfiguration.platformAuthentication === "public") {
      requestConfiguration.headers.delete("Authorization");
      return requestConfiguration;
    }
    if (credentialStore.hasEnded()) throw createSessionExpiredError();
    const currentCredential = credentialStore.read();
    // A reload establishes identity through refresh; only an existing identity
    // or a retried request can require that identity to remain unchanged.
    const expectedIdentityEpoch =
      requestConfiguration.platformIdentityEpoch ??
      (currentCredential ? credentialStore.getIdentityEpoch() : undefined);
    const expectedScope =
      requestConfiguration.platformContextScope ??
      (currentCredential
        ? getCredentialContextScope(currentCredential)
        : undefined);
    const freshCredential =
      currentCredential && credentialStore.isFresh()
        ? currentCredential
        : await properties.refresh();
    const currentScope = getCredentialContextScope(freshCredential);
    if (
      (expectedIdentityEpoch !== undefined &&
        expectedIdentityEpoch !== credentialStore.getIdentityEpoch()) ||
      (expectedScope && expectedScope !== currentScope)
    ) {
      throw new PlatformApiError(
        "Your sign-in or active organisation changed. Review it before trying again.",
        "AUTH_CONTEXT_CHANGED",
        null,
        409,
        {},
        undefined
      );
    }
    requestConfiguration.headers.set(
      "Authorization",
      `Bearer ${freshCredential.accessToken}`
    );
    requestConfiguration.platformSessionRevision =
      credentialStore.getRevision();
    requestConfiguration.platformIdentityEpoch =
      credentialStore.getIdentityEpoch();
    requestConfiguration.platformContextScope = currentScope;
    return requestConfiguration;
  });

  httpClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (
        !axios.isAxiosError(error) ||
        error.response?.status !== 401 ||
        !error.config ||
        error.config.platformAuthentication === "public"
      )
        throw error;
      const requestConfiguration = error.config;
      const parsedError = platformErrorBodySchema.safeParse(
        error.response.data
      );
      const errorCode = parsedError.success
        ? parsedError.data.error.code
        : null;
      const canRefresh =
        errorCode === "AUTH_TOKEN_EXPIRED" ||
        (!properties.platformBoundary && errorCode === "AUTH_TOKEN_INVALID");
      if (
        canRefresh &&
        !requestConfiguration.platformAuthenticationRetried &&
        !credentialStore.hasEnded()
      ) {
        requestConfiguration.platformAuthenticationRetried = true;
        if (
          requestConfiguration.platformSessionRevision ===
          credentialStore.getRevision()
        )
          await properties.refresh();
        return httpClient.request(requestConfiguration);
      }
      // Product audience failures must not erase a valid Platform API session.
      if (
        properties.platformBoundary &&
        errorCode &&
        (TERMINAL_AUTHENTICATION_ERRORS.includes(errorCode) ||
          errorCode === "AUTH_TOKEN_EXPIRED") &&
        requestConfiguration.platformSessionRevision ===
          credentialStore.getRevision()
      )
        credentialStore.clear();
      throw error;
    }
  );
}
