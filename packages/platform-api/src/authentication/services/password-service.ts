import {
  clearPlatformSession,
  getPlatformHttpClient,
} from "../../browser/http-client";
import { PUBLIC_PLATFORM_REQUEST } from "../../config/browser-config";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import { acceptedResponseSchema } from "../schemas/verification";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";
import { toPlatformApiError } from "../../browser/errors/index";
import type {
  EmailChangeConfirmationRequest,
  PasswordResetRequest,
  PasswordChangeRequest,
} from "../types/authentication";

/** `POST /v1/auth/password/forgot`; the response never reveals account state. */
export async function requestPasswordReset(
  emailAddress: string
): Promise<void> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.forgotPassword,
      { email: emailAddress },
      PUBLIC_PLATFORM_REQUEST
    );
    if (!acceptedResponseSchema.safeParse(response.data).success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
  } catch (error) {
    throw toPlatformApiError(error, "We could not request a password reset.");
  }
}

/** `POST /v1/auth/password/reset` clears the backend cookie and the local session. */
export async function resetPassword(
  request: PasswordResetRequest
): Promise<void> {
  try {
    await getPlatformHttpClient().post(
      AUTHENTICATION_ENDPOINTS.resetPassword,
      request,
      PUBLIC_PLATFORM_REQUEST
    );
    clearPlatformSession();
  } catch (error) {
    throw toPlatformApiError(error, "We could not reset your password.", {
      password: "password",
    });
  }
}

/**
 * `POST /v1/auth/email-change/confirm`: the new address becomes the sign-in
 * email and the password is replaced. Every session ends, so the person signs
 * in again with the new address; their authenticator app stays.
 */
export async function confirmEmailChange(
  request: EmailChangeConfirmationRequest
): Promise<void> {
  try {
    await getPlatformHttpClient().post(
      AUTHENTICATION_ENDPOINTS.confirmEmailChange,
      request,
      PUBLIC_PLATFORM_REQUEST
    );
    clearPlatformSession();
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not confirm your new email address.",
      {
        password: "password",
      }
    );
  }
}

/** `POST /v1/auth/password/change`; requires a recent step-up. */
export async function changePassword(
  request: PasswordChangeRequest
): Promise<void> {
  try {
    await getPlatformHttpClient().post(
      AUTHENTICATION_ENDPOINTS.changePassword,
      request
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not change your password.", {
      currentPassword: "currentPassword",
      newPassword: "newPassword",
    });
  }
}
