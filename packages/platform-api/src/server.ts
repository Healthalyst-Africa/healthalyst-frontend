import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import Redis from "ioredis";
import axios, { type AxiosResponse } from "axios";
import { z } from "zod";

const REFRESHABLE_AUTHENTICATION_CODES = new Set([
  "AUTH_TOKEN_MISSING",
  "AUTH_TOKEN_INVALID",
  "AUTH_TOKEN_EXPIRED",
  "AUTH_SESSION_REVOKED",
]);
const API_REFRESH_COOKIE_NAME =
  process.env.HEALTHALYST_PLATFORM_REFRESH_COOKIE_NAME?.trim() ||
  "__Secure-hs_rt";
const ACCESS_TOKEN_REFRESH_WINDOW_MILLISECONDS = 30_000;
const SESSION_LOCK_LEASE_MILLISECONDS = 35_000;
const SESSION_LOCK_WAIT_MILLISECONDS = 35_000;
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const AUTHENTICATION_CHALLENGE_COOKIE_MAX_AGE_SECONDS = 60 * 10;
const AUTHENTICATION_CHALLENGE_COOKIE_PATH = "/api/platform/v1/auth";
const REQUEST_BODY_LIMIT_BYTES = 2 * 1024 * 1024;
const REDIS_SESSION_PREFIX = "healthalyst:platform-bff:session";
const REDIS_LOCK_PREFIX = "healthalyst:platform-bff:refresh-lock";
const ACCESS_TOKEN_RESPONSE_SCHEMA = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});
const ENCRYPTED_SESSION_SCHEMA = z.object({
  accessToken: z.string().min(1),
  accessTokenExpiresAt: z.number().int().positive(),
  refreshToken: z.string().min(1),
  refreshTokenExpiresAt: z.number().int().positive(),
});

type PlatformBackendSession = z.infer<typeof ENCRYPTED_SESSION_SCHEMA>;
type PlatformSessionApplication = "organization" | "super-admin";
type PlatformRouteConfiguration = {
  application: PlatformSessionApplication;
  localOrigin: string;
  sessionCookieName: string;
  challengeCookieName: string;
};
type PlatformAuthenticationChallenge = {
  kind: "mfa" | "enrolment";
  token: string;
  expiresIn: number;
};
type UpstreamRefreshCookie =
  | { kind: "rotated"; token: string; expiresAt: number }
  | { kind: "cleared" }
  | { kind: "missing" };
type ParsedPlatformResponse = {
  body: Buffer;
  accessTokenResponse: z.infer<typeof ACCESS_TOKEN_RESPONSE_SCHEMA> | null;
  authenticationChallenge: PlatformAuthenticationChallenge | null;
};
type PlatformSessionStore = {
  readSession: (
    sessionIdentifier: string
  ) => Promise<PlatformBackendSession | null>;
  writeSession: (
    sessionIdentifier: string,
    session: PlatformBackendSession
  ) => Promise<void>;
  deleteSession: (sessionIdentifier: string) => Promise<void>;
  acquireRefreshLock: (
    sessionIdentifier: string,
    lockIdentifier: string
  ) => Promise<boolean>;
  releaseRefreshLock: (
    sessionIdentifier: string,
    lockIdentifier: string
  ) => Promise<void>;
};

class PlatformRequestFailure extends Error {
  constructor(
    readonly status: number,
    readonly responseBody: unknown,
    readonly errorCode: string | null = null
  ) {
    super("The Platform API request failed.");
  }
}

class PlatformRequestBodyTooLarge extends Error {}

const pendingRefreshes = new Map<string, Promise<PlatformBackendSession>>();
const developmentRefreshLocks = new Map<string, string>();
const developmentSessions = new Map<
  string,
  { encryptedSession: string; expiresAt: number }
>();
let redisClient: Redis | null = null;
let redisConnection: Promise<Redis> | null = null;

const platformApiClient = axios.create({
  timeout: 30_000,
  maxRedirects: 0,
  maxBodyLength: REQUEST_BODY_LIMIT_BYTES,
  maxContentLength: REQUEST_BODY_LIMIT_BYTES,
  decompress: true,
  validateStatus: () => true,
});

/** Handle one same-origin request and proxy it to the fixed Platform API host. */
export async function handlePlatformBackendForFrontendRequest(
  request: Request,
  routeParameters: Promise<{ path: string[] }>,
  configuration: PlatformRouteConfiguration
): Promise<Response> {
  try {
    return await executePlatformBackendForFrontendRequest(
      request,
      routeParameters,
      configuration
    );
  } catch {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_API_UNAVAILABLE",
          message:
            "The HealthAlyst service is temporarily unavailable. Please try again.",
        },
      },
      502
    );
  }
}

async function executePlatformBackendForFrontendRequest(
  request: Request,
  routeParameters: Promise<{ path: string[] }>,
  configuration: PlatformRouteConfiguration
): Promise<Response> {
  const { path } = await routeParameters;
  const platformPath = `/${path.join("/")}`;
  const browserRequestUrl = new URL(request.url);
  if (hasTokenQueryParameter(browserRequestUrl)) {
    return jsonResponse(
      {
        error: {
          code: "TOKEN_IN_QUERY_NOT_ALLOWED",
          message: "Authentication tokens must not be sent in the URL.",
        },
      },
      400
    );
  }

  if (
    platformPath === "/v1/auth/refresh" ||
    !isAllowedPlatformPath(platformPath)
  ) {
    return jsonResponse(
      { error: { code: "NOT_FOUND", message: "Not found." } },
      404
    );
  }

  const method = request.method.toUpperCase();
  if (!["GET", "POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    return jsonResponse(
      { error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." } },
      405,
      { Allow: "GET, POST, PATCH, PUT, DELETE" }
    );
  }

  const expectedOrigin = getExpectedApplicationOrigin(configuration);
  if (!expectedOrigin) {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_CONFIGURATION_MISSING",
          message:
            "The application server is missing its origin configuration.",
        },
      },
      503
    );
  }

  if (
    !isSafeMethod(method) &&
    !hasValidBrowserRequest(request, expectedOrigin)
  ) {
    return jsonResponse(
      {
        error: {
          code: "CSRF_CHECK_FAILED",
          message: "Request could not be verified.",
        },
      },
      403
    );
  }

  const platformApiAddress = getPlatformApiAddress();
  if (!platformApiAddress) {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_CONFIGURATION_MISSING",
          message:
            "The Platform API address is not configured on the application server.",
        },
      },
      503
    );
  }

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
      { "X-Platform-Session-Expired": "true" }
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
      { "X-Platform-Session-Expired": "true" }
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
        await sessionStore.deleteSession(cookieSessionIdentifier);
        appendSessionCookie(
          expiredResponse.headers,
          configuration.sessionCookieName,
          null
        );
        if (isAuthenticationFailure(error)) {
          expiredResponse.headers.set("X-Platform-Session-Expired", "true");
        }
      }
      return expiredResponse;
    }
  }

  let requestBody: Buffer | undefined;
  try {
    requestBody = await readRequestBody(request);
  } catch (error) {
    if (!(error instanceof PlatformRequestBodyTooLarge)) {
      return jsonResponse(
        {
          error: {
            code: "REQUEST_BODY_UNREADABLE",
            message: "The request body could not be read.",
          },
        },
        400
      );
    }
    return jsonResponse(
      {
        error: {
          code: "REQUEST_TOO_LARGE",
          message: "Request body is too large.",
        },
      },
      413
    );
  }

  const challengeRequestField =
    getAuthenticationChallengeRequestField(platformPath);
  if (challengeRequestField) {
    const challengeToken = readCookieValue(
      request.headers.get("cookie"),
      configuration.challengeCookieName
    );
    if (!challengeToken) {
      return jsonResponse(
        {
          error: {
            code: "AUTH_CHALLENGE_EXPIRED",
            message: "This sign-in step has expired. Start again to continue.",
          },
        },
        401
      );
    }
    try {
      requestBody = addAuthenticationChallengeToRequestBody(
        requestBody,
        challengeRequestField,
        challengeToken
      );
    } catch (error) {
      return errorResponse(error);
    }
  }

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
      session: responseSession,
      expectedOrigin,
    });
  } catch (error) {
    if (
      isSessionTerminationPath(platformPath) &&
      cookieSessionIdentifier &&
      sessionStore
    ) {
      await sessionStore.deleteSession(cookieSessionIdentifier);
      const failedSignOutResponse = errorResponse(error);
      appendSessionCookie(
        failedSignOutResponse.headers,
        configuration.sessionCookieName,
        null
      );
      return failedSignOutResponse;
    }
    throw error;
  }

  if (
    method === "GET" &&
    cookieSessionIdentifier &&
    responseSession &&
    sessionStore &&
    isRefreshableUnauthorized(upstreamResponse)
  ) {
    try {
      responseSession = await refreshPlatformSession(
        responseSession,
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
        session: responseSession,
        expectedOrigin,
      });
    } catch (error) {
      const expiredResponse = errorResponse(error);
      if (isAuthenticationFailure(error)) {
        await sessionStore.deleteSession(cookieSessionIdentifier);
        appendSessionCookie(
          expiredResponse.headers,
          configuration.sessionCookieName,
          null
        );
        expiredResponse.headers.set("X-Platform-Session-Expired", "true");
      }
      return expiredResponse;
    }
  }

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
    (platformPath === "/v1/auth/password/reset" &&
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
      platformPath !== "/v1/auth/mfa/totp/setup") ||
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

function getExpectedApplicationOrigin(
  configuration: PlatformRouteConfiguration
): string | null {
  const configuredOrigin = process.env.HEALTHALYST_APP_ORIGIN?.trim();
  if (configuredOrigin) {
    try {
      const parsedOrigin = new URL(configuredOrigin);
      if (parsedOrigin.origin !== configuredOrigin.replace(/\/$/, ""))
        return null;
      return parsedOrigin.origin;
    } catch {
      return null;
    }
  }

  return process.env.NODE_ENV === "development"
    ? configuration.localOrigin
    : null;
}

function getPlatformApiAddress(): string | null {
  const configuredAddress = process.env.HEALTHALYST_PLATFORM_API_URL?.trim();
  if (!configuredAddress) return null;
  try {
    const parsedAddress = new URL(configuredAddress);
    const isLocalHttpAddress =
      parsedAddress.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(parsedAddress.hostname);
    if (parsedAddress.protocol !== "https:" && !isLocalHttpAddress) return null;
    return parsedAddress.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function isAllowedPlatformPath(platformPath: string): boolean {
  if (!platformPath.startsWith("/v1/")) return false;
  if (
    platformPath.includes("\\") ||
    platformPath.includes("%") ||
    platformPath.includes("//")
  ) {
    return false;
  }
  const pathSegments = platformPath.split("/").filter(Boolean);
  if (
    pathSegments.some(
      (pathSegment) => pathSegment === "." || pathSegment === ".."
    )
  ) {
    return false;
  }
  return [
    "/v1/auth/",
    "/v1/me",
    "/v1/reference/",
    "/v1/onboarding/",
    "/v1/organization",
    "/v1/admin/organizations",
    "/v1/admin/dashboard",
  ].some((allowedPath) =>
    allowedPath.endsWith("/")
      ? platformPath.startsWith(allowedPath)
      : platformPath === allowedPath ||
        platformPath.startsWith(`${allowedPath}/`)
  );
}

function isPublicPlatformPath(platformPath: string): boolean {
  return (
    [
      "/v1/auth/login",
      "/v1/auth/mfa/verify",
      "/v1/auth/mfa/totp/setup",
      "/v1/auth/mfa/totp/confirm",
      "/v1/auth/verify-email",
      "/v1/auth/verify-email/resend",
      "/v1/auth/password/forgot",
      "/v1/auth/password/reset",
    ].includes(platformPath) ||
    platformPath.startsWith("/v1/reference/") ||
    platformPath === "/v1/onboarding/registrations"
  );
}

function shouldSendExistingSession(platformPath: string): boolean {
  return ![
    "/v1/auth/login",
    "/v1/auth/mfa/verify",
    "/v1/auth/mfa/totp/setup",
    "/v1/auth/mfa/totp/confirm",
    "/v1/auth/verify-email",
    "/v1/auth/verify-email/resend",
    "/v1/auth/password/forgot",
    "/v1/auth/password/reset",
  ].includes(platformPath);
}

function isAuthenticationEstablishingPath(platformPath: string): boolean {
  return (
    platformPath === "/v1/auth/mfa/verify" ||
    platformPath === "/v1/auth/mfa/totp/confirm"
  );
}

function isAuthenticationChallengeStartingPath(platformPath: string): boolean {
  return (
    platformPath === "/v1/auth/login" ||
    platformPath === "/v1/auth/verify-email"
  );
}

function getAuthenticationChallengeRequestField(
  platformPath: string
): "mfaToken" | "enrolmentToken" | null {
  if (platformPath === "/v1/auth/mfa/verify") return "mfaToken";
  if (
    platformPath === "/v1/auth/mfa/totp/setup" ||
    platformPath === "/v1/auth/mfa/totp/confirm"
  ) {
    return "enrolmentToken";
  }
  return null;
}

function addAuthenticationChallengeToRequestBody(
  requestBody: Buffer | undefined,
  fieldName: "mfaToken" | "enrolmentToken",
  challengeToken: string
): Buffer {
  let requestProperties: Record<string, unknown> = {};
  if (requestBody && requestBody.byteLength > 0) {
    try {
      const parsedRequestBody: unknown = JSON.parse(
        requestBody.toString("utf8")
      );
      if (!isRecord(parsedRequestBody))
        throw new Error("Invalid request body.");
      requestProperties = parsedRequestBody;
    } catch {
      throw new PlatformRequestFailure(
        400,
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "The request body must be a JSON object.",
          },
        },
        "VALIDATION_FAILED"
      );
    }
  }
  return Buffer.from(
    JSON.stringify({ ...requestProperties, [fieldName]: challengeToken }),
    "utf8"
  );
}

function isSessionTerminationPath(platformPath: string): boolean {
  return (
    platformPath === "/v1/auth/logout" || platformPath === "/v1/auth/logout-all"
  );
}

function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

function hasTokenQueryParameter(requestUrl: URL): boolean {
  const tokenParameterNames = new Set([
    "accesstoken",
    "refreshtoken",
    "idtoken",
    "mfatoken",
    "enrolmenttoken",
  ]);
  return [...requestUrl.searchParams.keys()].some((parameterName) =>
    tokenParameterNames.has(
      parameterName.toLowerCase().replaceAll("_", "").replaceAll("-", "")
    )
  );
}

function hasValidBrowserRequest(
  request: Request,
  expectedOrigin: string
): boolean {
  return (
    request.headers.get("origin") === expectedOrigin &&
    request.headers.get("x-requested-with") === "healthalyst"
  );
}

async function readRequestBody(request: Request): Promise<Buffer | undefined> {
  if (isSafeMethod(request.method) || request.body === null) return undefined;
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > REQUEST_BODY_LIMIT_BYTES) {
    throw new PlatformRequestBodyTooLarge();
  }

  const requestBodyReader = request.body.getReader();
  const requestBodyChunks: Buffer[] = [];
  let requestBodyByteLength = 0;
  try {
    while (true) {
      const readResult = await requestBodyReader.read();
      if (readResult.done) break;
      requestBodyByteLength += readResult.value.byteLength;
      if (requestBodyByteLength > REQUEST_BODY_LIMIT_BYTES) {
        await requestBodyReader.cancel().catch(() => undefined);
        throw new PlatformRequestBodyTooLarge();
      }
      requestBodyChunks.push(Buffer.from(readResult.value));
    }
  } finally {
    requestBodyReader.releaseLock();
  }
  return Buffer.concat(requestBodyChunks, requestBodyByteLength);
}

async function sendPlatformRequest(properties: {
  request: Request;
  method: string;
  upstreamUrl: URL;
  requestBody: Buffer | undefined;
  session: PlatformBackendSession | null;
  expectedOrigin: string;
}): Promise<AxiosResponse<Buffer>> {
  const headers: Record<string, string | null> = {
    Accept: properties.request.headers.get("accept") ?? "application/json",
    "X-Requested-With": "healthalyst",
    Origin: properties.expectedOrigin,
  };
  const contentType = properties.request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  const ifMatchHeader = properties.request.headers.get("if-match");
  if (ifMatchHeader) headers["If-Match"] = ifMatchHeader;
  const ifNoneMatchHeader = properties.request.headers.get("if-none-match");
  if (ifNoneMatchHeader) headers["If-None-Match"] = ifNoneMatchHeader;
  if (properties.session) {
    headers.Authorization = `Bearer ${properties.session.accessToken}`;
  }
  if (
    properties.session &&
    properties.upstreamUrl.pathname.startsWith("/v1/auth/")
  ) {
    headers.Cookie = `${API_REFRESH_COOKIE_NAME}=${properties.session.refreshToken}`;
  }

  return platformApiClient.request<Buffer>({
    url: properties.upstreamUrl.toString(),
    method: properties.method,
    data: properties.requestBody,
    headers,
    responseType: "arraybuffer",
    transformResponse: [(responseBody: Buffer) => responseBody],
  });
}

function parsePlatformResponse(
  upstreamResponse: AxiosResponse<Buffer>,
  platformPath: string
): ParsedPlatformResponse {
  const responseBody = Buffer.from(upstreamResponse.data ?? Buffer.alloc(0));
  const contentType = String(upstreamResponse.headers["content-type"] ?? "");
  const responseText = responseBody.toString("utf8").trimStart();
  if (
    responseBody.byteLength === 0 ||
    (!contentType.toLowerCase().includes("json") &&
      !responseText.startsWith("{") &&
      !responseText.startsWith("["))
  ) {
    return {
      body: responseBody,
      accessTokenResponse: null,
      authenticationChallenge: null,
    };
  }

  try {
    const parsedBody: unknown = JSON.parse(responseText);
    const tokenResponse = isRecord(parsedBody)
      ? ACCESS_TOKEN_RESPONSE_SCHEMA.safeParse(parsedBody)
      : null;
    const safeResponseBody = sanitizeSensitiveResponseValue(parsedBody);
    return {
      body: Buffer.from(JSON.stringify(safeResponseBody)),
      accessTokenResponse:
        tokenResponse?.success === true ? tokenResponse.data : null,
      authenticationChallenge: readAuthenticationChallenge(
        parsedBody,
        platformPath
      ),
    };
  } catch {
    return {
      body: responseBody,
      accessTokenResponse: null,
      authenticationChallenge: null,
    };
  }
}

function readAuthenticationChallenge(
  responseBody: unknown,
  platformPath: string
): PlatformAuthenticationChallenge | null {
  if (!isRecord(responseBody)) return null;
  const isEmailVerification = platformPath === "/v1/auth/verify-email";
  if (!isEmailVerification && platformPath !== "/v1/auth/login") return null;

  const mfaToken = responseBody.mfaToken;
  const enrolmentToken = responseBody.enrolmentToken;
  const challengeToken =
    typeof mfaToken === "string" && mfaToken.length > 0
      ? { kind: "mfa" as const, token: mfaToken }
      : typeof enrolmentToken === "string" && enrolmentToken.length > 0
        ? { kind: "enrolment" as const, token: enrolmentToken }
        : null;
  if (
    !challengeToken ||
    (isEmailVerification && challengeToken.kind !== "enrolment")
  ) {
    return null;
  }

  const responseExpiry = responseBody.expiresIn;
  if (
    responseExpiry !== undefined &&
    (typeof responseExpiry !== "number" ||
      !Number.isInteger(responseExpiry) ||
      responseExpiry <= 0)
  ) {
    return null;
  }
  const expiresIn =
    typeof responseExpiry === "number" &&
    Number.isInteger(responseExpiry) &&
    responseExpiry > 0
      ? Math.min(
          responseExpiry,
          AUTHENTICATION_CHALLENGE_COOKIE_MAX_AGE_SECONDS
        )
      : AUTHENTICATION_CHALLENGE_COOKIE_MAX_AGE_SECONDS;
  return { ...challengeToken, expiresIn };
}

function addAuthenticationFlowMetadata(
  responseBody: Buffer,
  platformPath: string,
  challenge: PlatformAuthenticationChallenge | null
): Buffer {
  if (platformPath !== "/v1/auth/verify-email") return responseBody;
  try {
    const parsedBody: unknown = JSON.parse(responseBody.toString("utf8"));
    if (!isRecord(parsedBody)) return responseBody;
    return Buffer.from(
      JSON.stringify({
        ...parsedBody,
        authenticatorEnrolmentRequired: challenge?.kind === "enrolment",
      }),
      "utf8"
    );
  } catch {
    return responseBody;
  }
}

function isAuthenticationChallengeRejected(responseBody: Buffer): boolean {
  const errorCode = getNestedApiErrorCode(responseBody);
  return Boolean(
    errorCode &&
    errorCode.includes("TOKEN") &&
    /(INVALID|EXPIRED|REVOKED)/.test(errorCode)
  );
}

function sanitizeSensitiveResponseValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeSensitiveResponseValue(entry));
  }
  if (!isRecord(value)) return value;

  const safeValue: Record<string, unknown> = {};
  for (const [propertyName, propertyValue] of Object.entries(value)) {
    const normalizedPropertyName = propertyName
      .toLowerCase()
      .replaceAll("_", "")
      .replaceAll("-", "");
    if (
      [
        "accesstoken",
        "refreshtoken",
        "idtoken",
        "mfatoken",
        "enrolmenttoken",
      ].includes(normalizedPropertyName)
    ) {
      continue;
    }
    safeValue[propertyName] = sanitizeSensitiveResponseValue(propertyValue);
  }
  return safeValue;
}

function copyResponseHeaders(upstreamResponse: AxiosResponse<Buffer>): Headers {
  const responseHeaders = new Headers({ "Cache-Control": "no-store" });
  const responseHeaderNames = [
    "content-type",
    "etag",
    "retry-after",
    "x-request-id",
    "x-correlation-id",
  ];
  for (const responseHeaderName of responseHeaderNames) {
    const responseHeaderValue = upstreamResponse.headers[responseHeaderName];
    if (typeof responseHeaderValue === "string") {
      responseHeaders.set(responseHeaderName, responseHeaderValue);
    }
  }
  return responseHeaders;
}

function readUpstreamRefreshCookie(
  upstreamResponse: AxiosResponse<Buffer>
): UpstreamRefreshCookie {
  const cookieHeaders = upstreamResponse.headers["set-cookie"];
  if (!Array.isArray(cookieHeaders)) return { kind: "missing" };
  const expectedCookiePrefix = `${API_REFRESH_COOKIE_NAME}=`;
  const refreshCookieHeader = cookieHeaders.find((cookieHeader) =>
    cookieHeader.startsWith(expectedCookiePrefix)
  );
  if (!refreshCookieHeader) return { kind: "missing" };

  const cookieAttributes = refreshCookieHeader
    .split(";")
    .map((attribute) => attribute.trim());
  const cookieValue =
    cookieAttributes[0]?.slice(expectedCookiePrefix.length) ?? "";
  const maxAgeAttribute = cookieAttributes.find((attribute) =>
    attribute.toLowerCase().startsWith("max-age=")
  );
  const expiresAttribute = cookieAttributes.find((attribute) =>
    attribute.toLowerCase().startsWith("expires=")
  );
  const maxAgeSeconds = maxAgeAttribute
    ? Number(maxAgeAttribute.slice("max-age=".length))
    : null;
  const expiresAt =
    maxAgeSeconds !== null && Number.isFinite(maxAgeSeconds)
      ? Date.now() + maxAgeSeconds * 1000
      : expiresAttribute
        ? Date.parse(expiresAttribute.slice("expires=".length))
        : Number.NaN;

  if (maxAgeSeconds === 0 || !cookieValue) return { kind: "cleared" };
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return { kind: "missing" };
  }
  return { kind: "rotated", token: cookieValue, expiresAt };
}

function isRefreshableUnauthorized(
  upstreamResponse: AxiosResponse<Buffer>
): boolean {
  if (upstreamResponse.status !== 401) return false;
  try {
    const errorResponse: unknown = JSON.parse(
      Buffer.from(upstreamResponse.data ?? Buffer.alloc(0)).toString("utf8")
    );
    return (
      isRecord(errorResponse) &&
      isRecord(errorResponse.error) &&
      typeof errorResponse.error.code === "string" &&
      REFRESHABLE_AUTHENTICATION_CODES.has(errorResponse.error.code)
    );
  } catch {
    return false;
  }
}

async function ensureFreshPlatformSession(
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

async function refreshPlatformSession(
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
      await wait(100);
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
    `${platformApiAddress}/v1/auth/refresh`,
    undefined,
    {
      headers: {
        Cookie: `${API_REFRESH_COOKIE_NAME}=${session.refreshToken}`,
        Origin: expectedOrigin,
        "X-Requested-With": "healthalyst",
        "Content-Type": null,
      },
      responseType: "arraybuffer",
      transformResponse: [(responseBody: Buffer) => responseBody],
      validateStatus: () => true,
    }
  );

  const refreshedResponse = parsePlatformResponse(
    refreshResponse,
    "/v1/auth/refresh"
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

async function getPlatformSessionStore(
  application: PlatformSessionApplication
): Promise<PlatformSessionStore | Response> {
  const encryptionKey = getSessionEncryptionKey();
  if (encryptionKey instanceof Response) return encryptionKey;

  const redisAddress =
    process.env.HEALTHALYST_PLATFORM_SESSION_REDIS_URL?.trim();
  if (!redisAddress && process.env.NODE_ENV === "development") {
    return createDevelopmentStore(application, encryptionKey);
  }
  if (!redisAddress) {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_CONFIGURATION_MISSING",
          message: "The server-side session store is not configured.",
        },
      },
      503
    );
  }

  try {
    const redisConnection = await getRedisConnection(redisAddress);
    return createRedisStore(redisConnection, application, encryptionKey);
  } catch {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_STORE_UNAVAILABLE",
          message: "Sign-in is temporarily unavailable. Please try again.",
        },
      },
      503
    );
  }
}

function getSessionEncryptionKey(): Buffer | Response {
  const configuredSecret =
    process.env.HEALTHALYST_PLATFORM_SESSION_SECRET ?? "";
  if (Buffer.byteLength(configuredSecret, "utf8") < 32) {
    return jsonResponse(
      {
        error: {
          code: "PLATFORM_SESSION_CONFIGURATION_MISSING",
          message:
            "The server-side session encryption secret is not configured.",
        },
      },
      503
    );
  }
  return createHash("sha256").update(configuredSecret, "utf8").digest();
}

async function getRedisConnection(redisAddress: string): Promise<Redis> {
  if (redisClient && redisConnection) return redisConnection;
  const nextRedisClient = new Redis(redisAddress, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 5_000,
    retryStrategy: (attemptNumber) => Math.min(attemptNumber * 100, 1_000),
  });
  nextRedisClient.on("error", () => undefined);
  redisClient = nextRedisClient;
  redisConnection = nextRedisClient
    .connect()
    .then(() => nextRedisClient)
    .catch((error: unknown) => {
      if (redisClient === nextRedisClient) {
        redisClient = null;
        redisConnection = null;
      }
      throw error;
    });
  return redisConnection;
}

function createDevelopmentStore(
  application: PlatformSessionApplication,
  encryptionKey: Buffer
): PlatformSessionStore {
  const redisScope = `${REDIS_SESSION_PREFIX}:${application}:`;
  return {
    async readSession(sessionIdentifier) {
      const memoryKey = `${redisScope}${sessionIdentifier}`;
      const storedSession = developmentSessions.get(memoryKey);
      if (!storedSession || storedSession.expiresAt <= Date.now()) {
        developmentSessions.delete(memoryKey);
        return null;
      }
      return decryptSession(
        storedSession.encryptedSession,
        encryptionKey,
        sessionIdentifier,
        application
      );
    },
    async writeSession(sessionIdentifier, session) {
      const memoryKey = `${redisScope}${sessionIdentifier}`;
      developmentSessions.set(memoryKey, {
        encryptedSession: encryptSession(
          session,
          encryptionKey,
          sessionIdentifier,
          application
        ),
        expiresAt: session.refreshTokenExpiresAt,
      });
    },
    async deleteSession(sessionIdentifier) {
      developmentSessions.delete(`${redisScope}${sessionIdentifier}`);
    },
    async acquireRefreshLock(sessionIdentifier, lockIdentifier) {
      const lockKey = `${REDIS_LOCK_PREFIX}:${redisScope}${sessionIdentifier}`;
      if (developmentRefreshLocks.has(lockKey)) return false;
      developmentRefreshLocks.set(lockKey, lockIdentifier);
      return true;
    },
    async releaseRefreshLock(sessionIdentifier, lockIdentifier) {
      const lockKey = `${REDIS_LOCK_PREFIX}:${redisScope}${sessionIdentifier}`;
      if (developmentRefreshLocks.get(lockKey) === lockIdentifier) {
        developmentRefreshLocks.delete(lockKey);
      }
    },
  };
}

function createRedisStore(
  redisConnection: Redis,
  application: PlatformSessionApplication,
  encryptionKey: Buffer
): PlatformSessionStore {
  const sessionKey = (sessionIdentifier: string) =>
    `${REDIS_SESSION_PREFIX}:${application}:${hashSessionIdentifier(sessionIdentifier)}`;
  const lockKey = (sessionIdentifier: string) =>
    `${REDIS_LOCK_PREFIX}:${application}:${hashSessionIdentifier(sessionIdentifier)}`;

  return {
    async readSession(sessionIdentifier) {
      const encryptedSession = await redisConnection.get(
        sessionKey(sessionIdentifier)
      );
      return encryptedSession
        ? decryptSession(
            encryptedSession,
            encryptionKey,
            sessionIdentifier,
            application
          )
        : null;
    },
    async writeSession(sessionIdentifier, session) {
      const sessionTtlSeconds = Math.floor(
        (session.refreshTokenExpiresAt - Date.now()) / 1000
      );
      if (sessionTtlSeconds <= 0) throw authenticationFailure();
      await redisConnection.set(
        sessionKey(sessionIdentifier),
        encryptSession(session, encryptionKey, sessionIdentifier, application),
        "EX",
        sessionTtlSeconds
      );
    },
    async deleteSession(sessionIdentifier) {
      await redisConnection.del(sessionKey(sessionIdentifier));
    },
    async acquireRefreshLock(sessionIdentifier, lockIdentifier) {
      const result = await redisConnection.set(
        lockKey(sessionIdentifier),
        lockIdentifier,
        "PX",
        SESSION_LOCK_LEASE_MILLISECONDS,
        "NX"
      );
      return result === "OK";
    },
    async releaseRefreshLock(sessionIdentifier, lockIdentifier) {
      const releaseLockScript =
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
      await redisConnection.eval(
        releaseLockScript,
        1,
        lockKey(sessionIdentifier),
        lockIdentifier
      );
    },
  };
}

function encryptSession(
  session: PlatformBackendSession,
  encryptionKey: Buffer,
  sessionIdentifier: string,
  application: PlatformSessionApplication
): string {
  const nonce = randomBytes(12);
  const encryptionCipher = createHmac("sha256", encryptionKey)
    .update("healthalyst-platform-bff-session-key")
    .digest();
  const cipher = createCipheriv("aes-256-gcm", encryptionCipher, nonce);
  cipher.setAAD(Buffer.from(`${application}:${sessionIdentifier}`, "utf8"));
  const encryptedBody = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  const authenticationTag = cipher.getAuthTag();
  return [
    nonce.toString("base64url"),
    authenticationTag.toString("base64url"),
    encryptedBody.toString("base64url"),
  ].join(".");
}

function decryptSession(
  encryptedSession: string,
  encryptionKey: Buffer,
  sessionIdentifier: string,
  application: PlatformSessionApplication
): PlatformBackendSession | null {
  try {
    const [nonceValue, authenticationTagValue, encryptedBodyValue] =
      encryptedSession.split(".");
    if (!nonceValue || !authenticationTagValue || !encryptedBodyValue)
      return null;
    const nonce = Buffer.from(nonceValue, "base64url");
    const authenticationTag = Buffer.from(authenticationTagValue, "base64url");
    const encryptedBody = Buffer.from(encryptedBodyValue, "base64url");
    if (nonce.byteLength !== 12 || authenticationTag.byteLength !== 16)
      return null;
    const encryptionCipher = createHmac("sha256", encryptionKey)
      .update("healthalyst-platform-bff-session-key")
      .digest();
    const decipher = createDecipheriv("aes-256-gcm", encryptionCipher, nonce);
    decipher.setAAD(Buffer.from(`${application}:${sessionIdentifier}`, "utf8"));
    decipher.setAuthTag(authenticationTag);
    const sessionJson = Buffer.concat([
      decipher.update(encryptedBody),
      decipher.final(),
    ]).toString("utf8");
    const session = ENCRYPTED_SESSION_SCHEMA.safeParse(JSON.parse(sessionJson));
    return session.success && session.data.refreshTokenExpiresAt > Date.now()
      ? session.data
      : null;
  } catch {
    return null;
  }
}

function hashSessionIdentifier(sessionIdentifier: string): string {
  return createHash("sha256").update(sessionIdentifier, "utf8").digest("hex");
}

function readCookieValue(
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

function appendAuthenticationChallengeCookie(
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

function appendSessionCookie(
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

function jsonResponse(
  body: unknown,
  status: number,
  additionalHeaders: Record<string, string> = {}
): Response {
  const responseHeaders = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...additionalHeaders,
  });
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function errorResponse(error: unknown): Response {
  if (error instanceof PlatformRequestFailure) {
    return jsonResponse(error.responseBody, error.status);
  }
  return jsonResponse(
    {
      error: {
        code: "PLATFORM_API_UNAVAILABLE",
        message:
          "The HealthAlyst service is temporarily unavailable. Please try again.",
      },
    },
    502
  );
}

function authenticationFailure(
  errorCode = "AUTH_SESSION_EXPIRED"
): PlatformRequestFailure {
  return new PlatformRequestFailure(
    401,
    {
      error: {
        code: errorCode,
        message: "Your sign-in has expired. Sign in again to continue.",
      },
    },
    errorCode
  );
}

function apiFailure(
  responseBody: string,
  status: number
): PlatformRequestFailure {
  try {
    const parsedResponse: unknown = JSON.parse(responseBody);
    if (isRecord(parsedResponse)) {
      const safeResponseBody = sanitizeSensitiveResponseValue(parsedResponse);
      const errorCode =
        isRecord(parsedResponse.error) &&
        typeof parsedResponse.error.code === "string"
          ? parsedResponse.error.code
          : null;
      return new PlatformRequestFailure(status, safeResponseBody, errorCode);
    }
  } catch {
    // Use the stable fallback below for non-JSON upstream errors.
  }
  return new PlatformRequestFailure(
    status,
    {
      error: {
        code: "PLATFORM_API_ERROR",
        message:
          "The HealthAlyst service is temporarily unavailable. Please try again.",
      },
    },
    "PLATFORM_API_ERROR"
  );
}

function isAuthenticationFailure(error: unknown): boolean {
  return error instanceof PlatformRequestFailure && error.status === 401;
}

function getNestedApiErrorCode(responseBody: Buffer): string | null {
  try {
    const parsedResponse: unknown = JSON.parse(responseBody.toString("utf8"));
    return isRecord(parsedResponse) &&
      isRecord(parsedResponse.error) &&
      typeof parsedResponse.error.code === "string"
      ? parsedResponse.error.code
      : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
