import type {
  PasswordSignInRequest,
  PasswordStepResponse,
  SignInCodeRequest,
  PlatformSession,
} from "../types/authentication";
import {
  getPlatformClient,
  getPlatformHttpClient,
} from "../../browser/http-client";
import { PUBLIC_PLATFORM_REQUEST } from "../../config/browser-config";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import { passwordStepResponseSchema } from "../schemas/sign-in";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";
import { toPlatformApiError } from "../../browser/errors/index";
import { sessionSchema, sessionResponseSchema } from "../schemas/identity";

/**
 * `POST /v1/auth/login` returns a short-lived MFA or authenticator-enrolment
 * challenge. The workflow holds that challenge only until MFA is complete.
 */
export async function signInWithPassword(
  credentials: PasswordSignInRequest
): Promise<PasswordStepResponse> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.signIn,
      credentials,
      PUBLIC_PLATFORM_REQUEST
    );
    const passwordStep = passwordStepResponseSchema.safeParse(response.data);
    if (!passwordStep.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return passwordStep.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not sign you in. Try again.", {
      identifier: "identifier",
      password: "password",
    });
  }
}

/** Verify MFA, capture the access token in transport memory, and return identity data. */
export async function verifySignInCode(
  verification: SignInCodeRequest
): Promise<PlatformSession> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.verifySignIn,
      verification,
      PUBLIC_PLATFORM_REQUEST
    );
    const session = sessionResponseSchema.safeParse(response.data);
    if (!session.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    getPlatformClient().replaceAccessCredential(
      session.data,
      session.data.user.id
    );
    return sessionSchema.parse(session.data);
  } catch (error) {
    throw toPlatformApiError(error, "We could not check the code. Try again.", {
      code: "code",
    });
  }
}
