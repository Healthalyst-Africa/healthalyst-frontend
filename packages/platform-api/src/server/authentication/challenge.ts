import { AUTHENTICATION_ENDPOINTS } from "../../authentication/config/authentication-requests";
import { AUTHENTICATION_CHALLENGE_COOKIE_MAX_AGE_SECONDS } from "../config/session-policy";
import { PlatformRequestFailure } from "../errors/platform-request-failure";
import { getNestedApiErrorCode, isRecord } from "../http/response-values";
import type { PlatformAuthenticationChallenge } from "../types/platform-session";

export function addAuthenticationChallengeToRequestBody(
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

export function readAuthenticationChallenge(
  responseBody: unknown,
  platformPath: string
): PlatformAuthenticationChallenge | null {
  if (!isRecord(responseBody)) return null;
  const isEmailVerification =
    platformPath === AUTHENTICATION_ENDPOINTS.verifyEmail;
  if (!isEmailVerification && platformPath !== AUTHENTICATION_ENDPOINTS.signIn)
    return null;

  const authenticationVerificationToken = responseBody.mfaToken;
  const enrolmentToken = responseBody.enrolmentToken;
  const challengeToken =
    typeof authenticationVerificationToken === "string" &&
    authenticationVerificationToken.length > 0
      ? { kind: "mfa" as const, token: authenticationVerificationToken }
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

export function addAuthenticationFlowMetadata(
  responseBody: Buffer,
  platformPath: string,
  challenge: PlatformAuthenticationChallenge | null
): Buffer {
  if (platformPath !== AUTHENTICATION_ENDPOINTS.verifyEmail)
    return responseBody;
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

export function isAuthenticationChallengeRejected(
  responseBody: Buffer
): boolean {
  const errorCode = getNestedApiErrorCode(responseBody);
  return Boolean(
    errorCode &&
    errorCode.includes("TOKEN") &&
    /(INVALID|EXPIRED|REVOKED)/.test(errorCode)
  );
}
