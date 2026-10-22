import { z } from "zod";
import { getPlatformHttpClient } from "./platform-http-client";
import { toPlatformApiError } from "./platform-api-error";

const UNEXPECTED_RESPONSE_MESSAGE =
  "We received an unexpected response from HealthAlyst. Contact HealthAlyst for help.";

const signInMethodSchema = z.enum(["totp", "recovery_code"]);

export type SignInMethod = z.infer<typeof signInMethodSchema>;

const passwordStepResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("MFA_REQUIRED"),
    mfaToken: z.string().min(1),
    methods: z.array(signInMethodSchema).min(1),
    expiresIn: z.number().int(),
  }),
  z.object({
    status: z.literal("MFA_ENROLMENT_REQUIRED"),
    enrolmentToken: z.string().min(1),
    expiresIn: z.number().int(),
  }),
]);

export type PasswordStepResponse = z.infer<typeof passwordStepResponseSchema>;

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int(),
  user: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().nullable(),
  }),
  memberships: z.array(
    z.object({
      membershipId: z.string(),
      organization: z.object({
        id: z.string(),
        name: z.string(),
        status: z.string(),
        type: z.string().nullable(),
      }),
      roles: z.array(z.string()),
      products: z.array(z.string()),
    })
  ),
});

/** A signed-in session. Keep the access token in memory only. */
export type PlatformSession = z.infer<typeof sessionSchema>;

/**
 * `POST /v1/auth/login`, the password step. It answers `MFA_REQUIRED` with a
 * short-lived `mfaToken` for the authenticator step, or
 * `MFA_ENROLMENT_REQUIRED` when the account has no authenticator yet.
 * `403` codes include `EMAIL_NOT_VERIFIED`, `AUTH_ACCOUNT_LOCKED` and
 * `AUTH_ACCOUNT_DISABLED`; `401 AUTH_INVALID_CREDENTIALS` for a wrong
 * password.
 */
export async function signInWithPassword(credentials: {
  identifier: string;
  password: string;
}): Promise<PasswordStepResponse> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/login",
      credentials
    );
    const passwordStep = passwordStepResponseSchema.safeParse(response.data);
    if (!passwordStep.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return passwordStep.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not sign you in. Try again.", {
      identifier: "identifier",
      password: "password",
    });
  }
}

/**
 * `POST /v1/auth/mfa/verify`, the authenticator step: a 6-digit code from
 * the authenticator app, or a recovery code. `401 AUTH_MFA_INVALID` for a
 * wrong code; `AUTH_TOKEN_EXPIRED` when the password step must be repeated.
 */
export async function verifySignInCode(verification: {
  mfaToken: string;
  method: SignInMethod;
  code: string;
}): Promise<PlatformSession> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/mfa/verify",
      verification
    );
    const session = sessionSchema.safeParse(response.data);
    if (!session.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return session.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not check the code. Try again.", {
      code: "code",
    });
  }
}

/** `POST /v1/auth/logout`: ends the session the access token belongs to. */
export async function signOut(accessToken: string): Promise<void> {
  try {
    await getPlatformHttpClient().post("/v1/auth/logout", undefined, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    throw toPlatformApiError(error, "We could not sign you out. Try again.");
  }
}
