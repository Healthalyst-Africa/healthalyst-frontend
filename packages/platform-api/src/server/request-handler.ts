import type { AxiosResponse } from "axios";
import { isSessionTerminationPath } from "./config/route-policy";
import {
  errorResponse,
  isAuthenticationFailure,
} from "./errors/platform-request-failure";
import { preparePlatformRequestBody } from "./http/request-body";
import { validatePlatformRequest } from "./http/request-validation";
import { isRefreshableUnauthorized } from "./http/response-headers";
import { sendPlatformRequest } from "./http/upstream-client";
import { refreshPlatformSession } from "./session/refresh";
import {
  clearPlatformRequestSession,
  resolvePlatformRequestSession,
} from "./session/request-session";
import { finalizePlatformResponse } from "./session/response-session";
import type { PlatformRouteConfiguration } from "./types/platform-session";

/** Forward a same-origin request while keeping upstream credentials on the server. */
export async function handlePlatformBackendForFrontendRequest(
  request: Request,
  routeParameters: Promise<{ path: string[] }>,
  configuration: PlatformRouteConfiguration
): Promise<Response> {
  try {
    return await executePlatformRequest(
      request,
      routeParameters,
      configuration
    );
  } catch {
    return errorResponse(undefined);
  }
}

async function executePlatformRequest(
  request: Request,
  routeParameters: Promise<{ path: string[] }>,
  configuration: PlatformRouteConfiguration
): Promise<Response> {
  const { path } = await routeParameters;
  const platformPath = `/${path.join("/")}`;
  const validatedRequest = validatePlatformRequest(
    request,
    platformPath,
    configuration
  );
  if (validatedRequest instanceof Response) return validatedRequest;
  const { method, expectedOrigin, platformApiAddress } = validatedRequest;

  const requestSession = await resolvePlatformRequestSession(
    request,
    platformPath,
    configuration,
    expectedOrigin,
    platformApiAddress
  );
  if (requestSession instanceof Response) return requestSession;
  const { cookieSessionIdentifier, sessionStore } = requestSession;

  const requestBody = await preparePlatformRequestBody(
    request,
    platformPath,
    configuration
  );
  if (requestBody instanceof Response) return requestBody;
  const upstreamUrl = new URL(
    `${platformPath.slice(1)}${new URL(request.url).search}`,
    `${platformApiAddress}/`
  );

  let upstreamResponse: AxiosResponse<Buffer>;
  try {
    upstreamResponse = await sendPlatformRequest({
      request,
      method,
      upstreamUrl,
      requestBody,
      session: requestSession.responseSession,
      expectedOrigin,
    });
  } catch (error) {
    if (
      isSessionTerminationPath(platformPath) &&
      cookieSessionIdentifier &&
      sessionStore
    ) {
      return clearPlatformRequestSession(
        errorResponse(error),
        cookieSessionIdentifier,
        sessionStore,
        configuration.sessionCookieName
      );
    }
    throw error;
  }

  if (
    method === "GET" &&
    cookieSessionIdentifier &&
    requestSession.responseSession &&
    sessionStore &&
    isRefreshableUnauthorized(upstreamResponse)
  ) {
    try {
      requestSession.responseSession = await refreshPlatformSession(
        requestSession.responseSession,
        cookieSessionIdentifier,
        configuration.application,
        expectedOrigin,
        platformApiAddress,
        sessionStore
      );
      upstreamResponse = await sendPlatformRequest({
        request,
        method,
        upstreamUrl,
        requestBody,
        session: requestSession.responseSession,
        expectedOrigin,
      });
    } catch (error) {
      const expiredResponse = errorResponse(error);
      if (isAuthenticationFailure(error)) {
        return clearPlatformRequestSession(
          expiredResponse,
          cookieSessionIdentifier,
          sessionStore,
          configuration.sessionCookieName,
          true
        );
      }
      return expiredResponse;
    }
  }

  return finalizePlatformResponse(
    upstreamResponse,
    platformPath,
    configuration,
    requestSession
  );
}
