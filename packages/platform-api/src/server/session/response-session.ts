import { AUTHENTICATION_ENDPOINTS } from "../../authentication/config/authentication-requests";
import { randomBytes } from "node:crypto";
import type { AxiosResponse } from "axios";
import {
  getAuthenticationChallengeRequestField,
  isAuthenticationChallengeStartingPath,
  isAuthenticationEstablishingPath,
  isSessionTerminationPath,
} from "../config/route-policy";
import {
  addAuthenticationFlowMetadata,
  isAuthenticationChallengeRejected,
} from "../authentication/challenge";
import { jsonResponse } from "../errors/platform-request-failure";
import { parsePlatformResponse } from "../http/response-body";
import {
  copyResponseHeaders,
  readUpstreamRefreshCookie,
} from "../http/response-headers";
import {
  appendAuthenticationChallengeCookie,
  appendSessionCookie,
} from "./cookies";
import type {
  PlatformBackendSession,
  PlatformRouteConfiguration,
  PlatformRequestSession,
} from "../types/platform-session";

export async function finalizePlatformResponse(
  upstreamResponse: AxiosResponse<Buffer>,
  platformPath: string,
  configuration: PlatformRouteConfiguration,
  requestSession: PlatformRequestSession
): Promise<Response> {
  const { cookieSessionIdentifier, sessionStore, hasStaleSessionCookie } =
    requestSession;
  let { responseSession } = requestSession;
  const challengeRequestField =
    getAuthenticationChallengeRequestField(platformPath);
  const parsedResponse = parsePlatformResponse(upstreamResponse, platformPath);
  const responseHeaders = copyResponseHeaders(upstreamResponse);
  const result = new Response(
    upstreamResponse.status === 204 || upstreamResponse.status === 304
      ? null
      : new Uint8Array(
          addAuthenticationFlowMetadata(
            parsedResponse.body,
            platformPath,
            parsedResponse.authenticationChallenge
          )
        ),
    { status: upstreamResponse.status, headers: responseHeaders }
  );
  let sessionCookieReplaced = false;

  if (cookieSessionIdentifier && responseSession && sessionStore) {
    const upstreamRefreshCookie = readUpstreamRefreshCookie(upstreamResponse);
    if (upstreamRefreshCookie.kind === "cleared") {
      await sessionStore.deleteSession(cookieSessionIdentifier);
      appendSessionCookie(
        result.headers,
        configuration.sessionCookieName,
        null
      );
      appendAuthenticationChallengeCookie(
        result.headers,
        configuration.challengeCookieName,
        null
      );
      return result;
    }

    if (upstreamRefreshCookie.kind === "rotated") {
      responseSession = {
        ...responseSession,
        refreshToken: upstreamRefreshCookie.token,
        refreshTokenExpiresAt: upstreamRefreshCookie.expiresAt,
      };
    }
    if (parsedResponse.accessTokenResponse) {
      responseSession = {
        ...responseSession,
        accessToken: parsedResponse.accessTokenResponse.accessToken,
        accessTokenExpiresAt:
          Date.now() + parsedResponse.accessTokenResponse.expiresIn * 1000,
      };
    }
    if (
      upstreamRefreshCookie.kind === "rotated" ||
      parsedResponse.accessTokenResponse
    ) {
      await sessionStore.writeSession(cookieSessionIdentifier, responseSession);
    }
  }

  if (
    parsedResponse.accessTokenResponse &&
    isAuthenticationEstablishingPath(platformPath) &&
    sessionStore
  ) {
    const upstreamRefreshCookie = readUpstreamRefreshCookie(upstreamResponse);
    if (upstreamRefreshCookie.kind !== "rotated") {
      return jsonResponse(
        {
          error: {
            code: "PLATFORM_SESSION_CREATION_FAILED",
            message: "We could not establish a secure sign-in session.",
          },
        },
        502
      );
    }
    const sessionIdentifier = randomBytes(32).toString("base64url");
    const newSession: PlatformBackendSession = {
      accessToken: parsedResponse.accessTokenResponse.accessToken,
      accessTokenExpiresAt:
        Date.now() + parsedResponse.accessTokenResponse.expiresIn * 1000,
      refreshToken: upstreamRefreshCookie.token,
      refreshTokenExpiresAt: upstreamRefreshCookie.expiresAt,
    };
    await sessionStore.writeSession(sessionIdentifier, newSession);
    if (cookieSessionIdentifier) {
      await sessionStore.deleteSession(cookieSessionIdentifier);
    }
    appendSessionCookie(
      result.headers,
      configuration.sessionCookieName,
      sessionIdentifier,
      newSession.refreshTokenExpiresAt
    );
    sessionCookieReplaced = true;
  }

  if (
    isSessionTerminationPath(platformPath) ||
    (platformPath === AUTHENTICATION_ENDPOINTS.resetPassword &&
      upstreamResponse.status >= 200 &&
      upstreamResponse.status < 300)
  ) {
    if (cookieSessionIdentifier && sessionStore) {
      await sessionStore.deleteSession(cookieSessionIdentifier);
    }
    appendSessionCookie(result.headers, configuration.sessionCookieName, null);
    appendAuthenticationChallengeCookie(
      result.headers,
      configuration.challengeCookieName,
      null
    );
    sessionCookieReplaced = true;
  }

  if (
    parsedResponse.authenticationChallenge &&
    upstreamResponse.status >= 200 &&
    upstreamResponse.status < 300
  ) {
    appendAuthenticationChallengeCookie(
      result.headers,
      configuration.challengeCookieName,
      parsedResponse.authenticationChallenge.token,
      parsedResponse.authenticationChallenge.expiresIn
    );
  } else if (isAuthenticationChallengeStartingPath(platformPath)) {
    appendAuthenticationChallengeCookie(
      result.headers,
      configuration.challengeCookieName,
      null
    );
  }

  if (
    challengeRequestField &&
    ((upstreamResponse.status >= 200 &&
      upstreamResponse.status < 300 &&
      platformPath !== AUTHENTICATION_ENDPOINTS.authenticatorSetup) ||
      isAuthenticationChallengeRejected(parsedResponse.body))
  ) {
    appendAuthenticationChallengeCookie(
      result.headers,
      configuration.challengeCookieName,
      null
    );
  }

  if (
    cookieSessionIdentifier &&
    responseSession &&
    !sessionCookieReplaced &&
    !isAuthenticationEstablishingPath(platformPath)
  ) {
    appendSessionCookie(
      result.headers,
      configuration.sessionCookieName,
      cookieSessionIdentifier,
      responseSession.refreshTokenExpiresAt
    );
    sessionCookieReplaced = true;
  }

  if (hasStaleSessionCookie && !sessionCookieReplaced) {
    appendSessionCookie(result.headers, configuration.sessionCookieName, null);
  }

  return result;
}
