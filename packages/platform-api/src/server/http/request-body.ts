import { PLATFORM_HTTP_CONFIGURATION } from "../../config/browser-config";
import { getAuthenticationChallengeRequestField } from "../config/route-policy";
import { addAuthenticationChallengeToRequestBody } from "../authentication/challenge";
import { readCookieValue } from "../session/cookies";
import type { PlatformRouteConfiguration } from "../types/platform-session";
import {
  errorResponse,
  jsonResponse,
  PlatformRequestBodyTooLarge,
} from "../errors/platform-request-failure";
import {
  REQUEST_BODY_LIMIT_BYTES,
  SENSITIVE_TOKEN_PROPERTY_NAMES,
} from "../config/request-policy";

export function isSafeMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

export function hasTokenQueryParameter(requestUrl: URL): boolean {
  return [...requestUrl.searchParams.keys()].some((parameterName) =>
    SENSITIVE_TOKEN_PROPERTY_NAMES.has(
      parameterName.toLowerCase().replaceAll("_", "").replaceAll("-", "")
    )
  );
}

export function hasValidBrowserRequest(
  request: Request,
  expectedOrigin: string
): boolean {
  return (
    request.headers.get("origin") === expectedOrigin &&
    request.headers.get("x-requested-with") ===
      PLATFORM_HTTP_CONFIGURATION.requestedWith
  );
}

export async function readRequestBody(
  request: Request
): Promise<Buffer | undefined> {
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

export async function preparePlatformRequestBody(
  request: Request,
  platformPath: string,
  configuration: PlatformRouteConfiguration
): Promise<Buffer | undefined | Response> {
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

  return requestBody;
}
