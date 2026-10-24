import {
  isRecord,
  sanitizeSensitiveResponseValue,
} from "../http/response-values";

export class PlatformRequestFailure extends Error {
  constructor(
    readonly status: number,
    readonly responseBody: unknown,
    readonly errorCode: string | null = null
  ) {
    super("The Platform API request failed.");
  }
}

export class PlatformRequestBodyTooLarge extends Error {}

export function jsonResponse(
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

export function errorResponse(error: unknown): Response {
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

export function authenticationFailure(
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

export function apiFailure(
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

export function isAuthenticationFailure(error: unknown): boolean {
  return error instanceof PlatformRequestFailure && error.status === 401;
}
