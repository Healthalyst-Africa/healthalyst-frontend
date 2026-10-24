import { getPlatformHttpClient } from "../../browser/http-client";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import { acceptedResponseSchema } from "../schemas/verification";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";
import { toPlatformApiError } from "../../browser/errors/index";
import type {
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
      { email: emailAddress }
    );
    if (!acceptedResponseSchema.safeParse(response.data).success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
  } catch (error) {
    throw toPlatformApiError(error, "We could not request a password reset.");
  }
}

/** `POST /v1/auth/password/reset`; the backend-for-frontend clears the session. */
export async function resetPassword(
  request: PasswordResetRequest
): Promise<void> {
  try {
    await getPlatformHttpClient().post(
      AUTHENTICATION_ENDPOINTS.resetPassword,
      request
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not reset your password.", {
      password: "password",
    });
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
