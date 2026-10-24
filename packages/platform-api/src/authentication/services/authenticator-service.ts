import type {
  AuthenticatorSetup,
  AuthenticatorConfirmationRequest,
  AuthenticatorConfirmation,
  StepUpVerificationRequest,
  PlatformTokenResponse,
} from "../types/authentication";
import { getPlatformHttpClient } from "../../browser/http-client";
import {
  AUTHENTICATION_ENDPOINTS,
  BODYLESS_POST_HEADERS,
} from "../config/authentication-requests";
import {
  authenticatorSetupSchema,
  authenticatorConfirmationSchema,
  recoveryCodesResponseSchema,
} from "../schemas/authenticator";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";
import { toPlatformApiError } from "../../browser/errors/index";
import { sessionSchema, tokenResponseSchema } from "../schemas/identity";

/** Start setup using the short-lived HttpOnly enrolment challenge cookie. */
export async function startAuthenticatorSetup(): Promise<AuthenticatorSetup> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.authenticatorSetup,
      {}
    );
    const setup = authenticatorSetupSchema.safeParse(response.data);
    if (!setup.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return setup.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not start setting up your authenticator app. Try again."
    );
  }
}

/** Confirm the first authenticator code and return recovery codes once. */
export async function confirmAuthenticator(
  confirmation: AuthenticatorConfirmationRequest
): Promise<AuthenticatorConfirmation> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.authenticatorConfirmation,
      confirmation
    );
    const confirmed = authenticatorConfirmationSchema.safeParse(response.data);
    if (!confirmed.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    const { recoveryCodes, ...sessionFields } = confirmed.data;
    const session = sessionSchema.safeParse(sessionFields);
    return {
      recoveryCodes,
      session: session.success ? session.data : null,
    };
  } catch (error) {
    throw toPlatformApiError(error, "We could not check the code. Try again.", {
      code: "code",
    });
  }
}

/** `POST /v1/auth/mfa/recovery-codes`; requires a recent step-up. */
export async function regenerateRecoveryCodes(): Promise<string[]> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.recoveryCodes,
      undefined,
      { headers: BODYLESS_POST_HEADERS }
    );
    const recoveryCodes = recoveryCodesResponseSchema.safeParse(response.data);
    if (!recoveryCodes.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return recoveryCodes.data.recoveryCodes;
  } catch (error) {
    throw toPlatformApiError(error, "We could not create new recovery codes.");
  }
}

/** `POST /v1/auth/step-up`; the backend-for-frontend keeps the token server-side. */
export async function verifyStepUpCode(
  verification: StepUpVerificationRequest
): Promise<PlatformTokenResponse> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.stepUp,
      verification
    );
    const tokenResponse = tokenResponseSchema.safeParse(response.data);
    if (!tokenResponse.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return tokenResponse.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not verify your code.", {
      code: "code",
    });
  }
}
