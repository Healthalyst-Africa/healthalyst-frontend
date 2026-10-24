import { PLATFORM_SESSION_SIGNALS } from "../../config/browser-config";
import {
  isAuthenticationEstablishingPath,
  isPublicPlatformPath,
  isSessionTerminationPath,
  shouldSendExistingSession,
} from "../config/route-policy";
import {
  errorResponse,
  isAuthenticationFailure,
  jsonResponse,
} from "../errors/platform-request-failure";
import { getPlatformSessionStore } from "../stores/session-store";
import { appendSessionCookie, readCookieValue } from "./cookies";
import { ensureFreshPlatformSession } from "./refresh";
import type {
  PlatformRouteConfiguration,
  PlatformRequestSession,
  PlatformSessionStore,
} from "../types/platform-session";

export async function resolvePlatformRequestSession(
  request: Request,
  platformPath: string,
  configuration: PlatformRouteConfiguration,
  expectedOrigin: string,
  platformApiAddress: string
): Promise<PlatformRequestSession | Response> {
  const requiresSession = !isPublicPlatformPath(platformPath);
  const requiresSessionStore =
    requiresSession || isAuthenticationEstablishingPath(platformPath);
  let sessionStore: PlatformSessionStore | null = null;
  if (requiresSessionStore) {
    const resolvedSessionStore = await getPlatformSessionStore(
      configuration.application
    );
    if (resolvedSessionStore instanceof Response) {
      if (!isSessionTerminationPath(platformPath)) return resolvedSessionStore;
      const sessionStoreUnavailableResponse = new Response(
        resolvedSessionStore.body,
        {
          status: resolvedSessionStore.status,
          statusText: resolvedSessionStore.statusText,
          headers: new Headers(resolvedSessionStore.headers),
        }
      );
      appendSessionCookie(
        sessionStoreUnavailableResponse.headers,
        configuration.sessionCookieName,
        null
      );
      return sessionStoreUnavailableResponse;
    }
    sessionStore = resolvedSessionStore;
  }

  const cookieSessionIdentifier = sessionStore
    ? readCookieValue(
        request.headers.get("cookie"),
        configuration.sessionCookieName
      )
    : null;
  const currentSession =
    cookieSessionIdentifier && sessionStore
      ? await sessionStore.readSession(cookieSessionIdentifier)
      : null;
  const hasStaleSessionCookie = Boolean(
    cookieSessionIdentifier && !currentSession
  );

  if (cookieSessionIdentifier && !currentSession && requiresSession) {
    const expiredResponse = jsonResponse(
      {
        error: {
          code: "AUTH_SESSION_EXPIRED",
          message: "Your sign-in has expired. Sign in again to continue.",
        },
      },
      401,
      { [PLATFORM_SESSION_SIGNALS.expiredHeader]: "true" }
    );
    appendSessionCookie(
      expiredResponse.headers,
      configuration.sessionCookieName,
      null
    );
    return expiredResponse;
  }

  if (requiresSession && (!cookieSessionIdentifier || !currentSession)) {
    const unauthorizedResponse = jsonResponse(
      {
        error: {
          code: "AUTH_TOKEN_MISSING",
          message: "Sign in to continue.",
        },
      },
      401,
      { [PLATFORM_SESSION_SIGNALS.expiredHeader]: "true" }
    );
    appendSessionCookie(
      unauthorizedResponse.headers,
      configuration.sessionCookieName,
      null
    );
    return unauthorizedResponse;
  }

  const sendsExistingSession =
    currentSession !== null && shouldSendExistingSession(platformPath);
  let responseSession = sendsExistingSession ? currentSession : null;
  if (responseSession && cookieSessionIdentifier && sessionStore) {
    try {
      responseSession = await ensureFreshPlatformSession(
        responseSession,
        cookieSessionIdentifier,
        configuration.application,
        expectedOrigin,
        platformApiAddress,
        sessionStore
      );
    } catch (error) {
      const expiredResponse = errorResponse(error);
      if (
        isAuthenticationFailure(error) ||
        isSessionTerminationPath(platformPath)
      ) {
        return clearPlatformRequestSession(
          expiredResponse,
          cookieSessionIdentifier,
          sessionStore,
          configuration.sessionCookieName,
          isAuthenticationFailure(error)
        );
      }
      return expiredResponse;
    }
  }

  return {
    cookieSessionIdentifier,
    responseSession,
    sessionStore,
    hasStaleSessionCookie,
  };
}

export async function clearPlatformRequestSession(
  response: Response,
  sessionIdentifier: string,
  sessionStore: PlatformSessionStore,
  cookieName: string,
  expired = false
): Promise<Response> {
  await sessionStore.deleteSession(sessionIdentifier);
  appendSessionCookie(response.headers, cookieName, null);
  if (expired)
    response.headers.set(PLATFORM_SESSION_SIGNALS.expiredHeader, "true");
  return response;
}
