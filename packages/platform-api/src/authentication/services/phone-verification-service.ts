import { getPlatformHttpClient } from "../../browser/http-client";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import { acceptedResponseSchema } from "../schemas/verification";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";
import { toPlatformApiError } from "../../browser/errors/index";

/** `POST /v1/auth/phone/send-code` for the signed-in administrator. */
export async function sendPhoneVerificationCode(
  phoneNumber: string
): Promise<void> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.sendPhoneCode,
      { phone: phoneNumber }
    );
    if (!acceptedResponseSchema.safeParse(response.data).success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not send a phone verification code."
    );
  }
}

/** `POST /v1/auth/phone/verify` for the signed-in administrator. */
export async function verifyPhoneNumber(code: string): Promise<void> {
  try {
    await getPlatformHttpClient().post(AUTHENTICATION_ENDPOINTS.verifyPhone, {
      code,
    });
  } catch (error) {
    throw toPlatformApiError(error, "We could not verify that phone number.");
  }
}
