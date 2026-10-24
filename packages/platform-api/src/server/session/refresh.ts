import { AUTHENTICATION_ENDPOINTS } from "../../authentication/config/authentication-requests";
import { PLATFORM_HTTP_CONFIGURATION } from "../../config/browser-config";
import { randomBytes } from "node:crypto";
import {
  ACCESS_TOKEN_REFRESH_WINDOW_MILLISECONDS,
  SESSION_LOCK_WAIT_MILLISECONDS,
  SESSION_REFRESH_POLL_INTERVAL_MILLISECONDS,
} from "../config/session-policy";
import { API_REFRESH_COOKIE_NAME } from "../config/runtime-configuration";
import {
  authenticationFailure,
  apiFailure,
} from "../errors/platform-request-failure";
import { platformApiClient } from "../http/upstream-client";
import { parsePlatformResponse } from "../http/response-body";
import { readUpstreamRefreshCookie } from "../http/response-headers";
import { getNestedApiErrorCode } from "../http/response-values";
import type {
  PlatformBackendSession,
  PlatformSessionStore,
  PlatformSessionApplication,
} from "../types/platform-session";

const pendingRefreshes = new Map<string, Promise<PlatformBackendSession>>();

export async function ensureFreshPlatformSession(
  session: PlatformBackendSession,
  sessionIdentifier: string,
  application: PlatformSessionApplication,
  expectedOrigin: string,
  platformApiAddress: string,
  sessionStore: PlatformSessionStore
): Promise<PlatformBackendSession> {
  if (
    session.accessTokenExpiresAt - Date.now() >
    ACCESS_TOKEN_REFRESH_WINDOW_MILLISECONDS
  ) {
    return session;
  }
  return refreshPlatformSession(
    session,
    sessionIdentifier,
    application,
    expectedOrigin,
    platformApiAddress,
    sessionStore
  );
}

export async function refreshPlatformSession(
  previousSession: PlatformBackendSession,
  sessionIdentifier: string,
  application: PlatformSessionApplication,
  expectedOrigin: string,
  platformApiAddress: string,
  sessionStore: PlatformSessionStore
): Promise<PlatformBackendSession> {
  const refreshKey = `${application}:${sessionIdentifier}`;
  const pendingRefresh = pendingRefreshes.get(refreshKey);
  if (pendingRefresh) return pendingRefresh;

  const refreshPromise = refreshPlatformSessionWithLock(
    previousSession,
    sessionIdentifier,
    refreshKey,
    expectedOrigin,
    platformApiAddress,
    sessionStore
  );
  pendingRefreshes.set(refreshKey, refreshPromise);
  try {
    return await refreshPromise;
  } finally {
    pendingRefreshes.delete(refreshKey);
  }
}

async function refreshPlatformSessionWithLock(
  previousSession: PlatformBackendSession,
  sessionIdentifier: string,
  refreshKey: string,
  expectedOrigin: string,
  platformApiAddress: string,
  sessionStore: PlatformSessionStore
): Promise<PlatformBackendSession> {
  const lockIdentifier = randomBytes(24).toString("base64url");
  const lockStartedAt = Date.now();

  while (Date.now() - lockStartedAt < SESSION_LOCK_WAIT_MILLISECONDS) {
    const storedSession = await sessionStore.readSession(sessionIdentifier);
    if (!storedSession) throw authenticationFailure();
    if (storedSession.accessToken !== previousSession.accessToken) {
      return storedSession;
    }

    const lockAcquired = await sessionStore.acquireRefreshLock(
      refreshKey,
      lockIdentifier
    );
    if (!lockAcquired) {
      await wait(SESSION_REFRESH_POLL_INTERVAL_MILLISECONDS);
      continue;
    }

    try {
      const latestSession = await sessionStore.readSession(sessionIdentifier);
      if (!latestSession) throw authenticationFailure();
      if (latestSession.accessToken !== previousSession.accessToken) {
        return latestSession;
      }
      return await requestPlatformRefresh(
        latestSession,
        sessionIdentifier,
        expectedOrigin,
        platformApiAddress,
        sessionStore
      );
    } finally {
      await sessionStore.releaseRefreshLock(refreshKey, lockIdentifier);
    }
  }

  throw new Error("The sign-in session is busy. Please try again.");
}

async function requestPlatformRefresh(
  session: PlatformBackendSession,
  sessionIdentifier: string,
  expectedOrigin: string,
  platformApiAddress: string,
  sessionStore: PlatformSessionStore
): Promise<PlatformBackendSession> {
  const refreshResponse = await platformApiClient.post<Buffer>(
    `${platformApiAddress}${AUTHENTICATION_ENDPOINTS.refresh}`,
    undefined,
    {
      headers: {
        Cookie: `${API_REFRESH_COOKIE_NAME}=${session.refreshToken}`,
        Origin: expectedOrigin,
        "X-Requested-With": PLATFORM_HTTP_CONFIGURATION.requestedWith,
        "Content-Type": null,
      },
      responseType: "arraybuffer",
      transformResponse: [(responseBody: Buffer) => responseBody],
      validateStatus: () => true,
    }
  );

  const refreshedResponse = parsePlatformResponse(
    refreshResponse,
    AUTHENTICATION_ENDPOINTS.refresh
  );
  const rotatedCookie = readUpstreamRefreshCookie(refreshResponse);
  if (refreshResponse.status < 200 || refreshResponse.status >= 300) {
    if (rotatedCookie.kind === "cleared" || refreshResponse.status === 401) {
      await sessionStore.deleteSession(sessionIdentifier);
      throw authenticationFailure(
        getNestedApiErrorCode(refreshedResponse.body) ?? "AUTH_SESSION_EXPIRED"
      );
    }
    throw apiFailure(
      refreshedResponse.body.toString("utf8"),
      refreshResponse.status
    );
  }
  if (!refreshedResponse.accessTokenResponse) {
    throw new Error("The Platform API returned an invalid refresh response.");
  }

  const nextSession: PlatformBackendSession = {
    ...session,
    accessToken: refreshedResponse.accessTokenResponse.accessToken,
    accessTokenExpiresAt:
      Date.now() + refreshedResponse.accessTokenResponse.expiresIn * 1000,
    ...(rotatedCookie.kind === "rotated"
      ? {
          refreshToken: rotatedCookie.token,
          refreshTokenExpiresAt: rotatedCookie.expiresAt,
        }
      : {}),
  };
  await sessionStore.writeSession(sessionIdentifier, nextSession);
  return nextSession;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
