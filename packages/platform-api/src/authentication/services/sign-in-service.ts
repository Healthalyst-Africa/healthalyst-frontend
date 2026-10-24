import type {
  PasswordSignInRequest,
  PasswordStepResponse,
  SignInCodeRequest,
  PlatformSession,
} from "../types/authentication";
import { getPlatformHttpClient } from "../../browser/http-client";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import { passwordStepResponseSchema } from "../schemas/sign-in";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";
import { toPlatformApiError } from "../../browser/errors/index";
import { sessionSchema } from "../schemas/identity";

/**
 * `POST /v1/auth/login` returns a short-lived MFA or authenticator-enrolment
 * challenge. The backend-for-frontend keeps any eventual access and refresh tokens server-side.
 */
export async function signInWithPassword(
  credentials: PasswordSignInRequest
): Promise<PasswordStepResponse> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.signIn,
      credentials
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

/** Verify the authenticator or recovery code and establish a server session. */
export async function verifySignInCode(
  verification: SignInCodeRequest
): Promise<PlatformSession> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.verifySignIn,
      verification
    );
    const session = sessionSchema.safeParse(response.data);
    if (!session.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return session.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not check the code. Try again.", {
      code: "code",
    });
  }
}
