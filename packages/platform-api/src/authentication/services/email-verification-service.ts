import type { EmailVerificationResponse } from "../types/authentication";
import { getPlatformHttpClient } from "../../browser/http-client";
import { PUBLIC_PLATFORM_REQUEST } from "../../config/browser-config";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import {
  emailVerificationResponseSchema,
  acceptedResponseSchema,
} from "../schemas/verification";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";
import { toPlatformApiError } from "../../browser/errors/index";

/** `POST /v1/auth/verify-email`; consumes the one-time link token. */
export async function verifyPlatformEmailAddress(
  verificationToken: string
): Promise<EmailVerificationResponse> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.verifyEmail,
      { token: verificationToken },
      PUBLIC_PLATFORM_REQUEST
    );
    const verificationResponse = emailVerificationResponseSchema.safeParse(
      response.data
    );
    if (!verificationResponse.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return verificationResponse.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not confirm the email address. Try again shortly."
    );
  }
}

/** `POST /v1/auth/verify-email/resend`; always returns an accepted response. */
export async function resendEmailVerification(
  emailAddress: string
): Promise<void> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.resendEmail,
      { email: emailAddress },
      PUBLIC_PLATFORM_REQUEST
    );
    if (!acceptedResponseSchema.safeParse(response.data).success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not request a new confirmation link. Try again shortly."
    );
  }
}
