import axios, { type AxiosInstance } from "axios";
import {
  AUTHENTICATION_ENDPOINTS,
  BODYLESS_POST_HEADERS,
} from "../../authentication/config/authentication-requests";
import { tokenResponseSchema } from "../../authentication/schemas/identity";
import { PUBLIC_PLATFORM_REQUEST } from "../../config/browser-config";
import { PlatformApiError } from "../errors/platform-api-error";
import type { AccessCredential } from "../types/access-credential";
import type { AccessCredentialStore } from "./create-access-credential-store";

export function createSessionExpiredError() {
  return new PlatformApiError(
    "Your sign-in has ended. Sign in again.",
    "AUTH_REFRESH_INVALID",
    null,
    401,
    {},
    undefined
  );
}

/** Refresh rotation is coordinated per browser tab. The backend handles its cross-tab grace period. */
export function createSessionRefresh(
  httpClient: AxiosInstance,
  credentialStore: AccessCredentialStore
) {
  let pendingRefresh: Promise<AccessCredential> | null = null;

  function refresh(): Promise<AccessCredential> {
    if (pendingRefresh) return pendingRefresh;
    if (credentialStore.hasEnded())
      return Promise.reject(createSessionExpiredError());
    const refreshRevision = credentialStore.getRevision();
    const operation = (async () => {
      try {
        const response = await httpClient.post<unknown>(
          AUTHENTICATION_ENDPOINTS.refresh,
          undefined,
          {
            ...PUBLIC_PLATFORM_REQUEST,
            headers: BODYLESS_POST_HEADERS,
          }
        );
        const parsedCredential = tokenResponseSchema.safeParse(response.data);
        if (!parsedCredential.success) {
          throw new PlatformApiError(
            "The Platform API returned an invalid refresh response.",
            "INVALID_PLATFORM_RESPONSE",
            null,
            response.status,
            {},
            parsedCredential.error
          );
        }
        // Discard a late refresh after a new login, context change, or logout.
        if (credentialStore.getRevision() !== refreshRevision) {
          const currentCredential = credentialStore.read();
          if (currentCredential && !credentialStore.hasEnded())
            return currentCredential;
          throw createSessionExpiredError();
        }
        credentialStore.replace(parsedCredential.data);
        return parsedCredential.data;
      } catch (error) {
        if (
          credentialStore.getRevision() === refreshRevision &&
          axios.isAxiosError(error) &&
          error.response?.status === 401
        )
          credentialStore.clear();
        throw error;
      }
    })();
    pendingRefresh = operation;
    void operation
      .finally(() => {
        if (pendingRefresh === operation) pendingRefresh = null;
      })
      .catch(() => undefined);
    return operation;
  }

  return refresh;
}
