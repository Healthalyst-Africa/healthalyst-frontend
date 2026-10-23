import { z } from "zod";
import { getPlatformHttpClient } from "./http-client";
import { PlatformApiError, toPlatformApiError } from "./api-error";

const UNEXPECTED_RESPONSE_MESSAGE =
  "We received an unexpected response from HealthAlyst. Contact HealthAlyst for help.";
const BODYLESS_POST_HEADERS = { "Content-Type": null } as const;

const signInMethodSchema = z.enum(["totp", "recovery_code"]);

// The Platform API uses "*" for access to all branches.
const branchScopeSchema = z.array(z.string());

const authenticationContextSchema = z.object({
  realm: z.enum(["TENANT", "PLATFORM"]),
  organizationId: z.string().uuid().nullable(),
  branchId: z.string().uuid().nullable().optional(),
  organizationStatus: z.string().nullable().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  branchIds: branchScopeSchema.optional(),
});

const platformUserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  emailVerifiedAt: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  phoneVerifiedAt: z.string().nullable().optional(),
  mfa: z.object({ totp: z.boolean() }),
});

const membershipSchema = z.object({
  membershipId: z.string().uuid(),
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
    status: z.string(),
    type: z.string().nullable(),
  }),
  roles: z.array(z.string()),
  products: z.array(z.string()),
});

export type SignInMethod = z.infer<typeof signInMethodSchema>;

const passwordStepResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("MFA_REQUIRED"),
    methods: z.array(signInMethodSchema).min(1),
    expiresIn: z.number().int(),
  }),
  z.object({
    status: z.literal("MFA_ENROLMENT_REQUIRED"),
    expiresIn: z.number().int(),
  }),
]);

export type PasswordStepResponse = z.infer<typeof passwordStepResponseSchema>;

const sessionSchema = z.object({
  tokenType: z.literal("Bearer").optional(),
  expiresIn: z.number().int().optional(),
  activeContext: authenticationContextSchema,
  user: platformUserSchema,
  memberships: z.array(membershipSchema),
  platformRoles: z.array(z.string()),
});

/** A safe browser session summary. Access and refresh tokens stay server-side. */
export type PlatformSession = z.infer<typeof sessionSchema>;

const tokenResponseSchema = z.object({
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int(),
  activeContext: authenticationContextSchema,
});

const meResponseSchema = z.object({
  user: platformUserSchema.extend({
    emailVerifiedAt: z.string().nullable(),
    phone: z.string().nullable(),
    phoneVerifiedAt: z.string().nullable(),
  }),
  memberships: z.array(membershipSchema),
  platformRoles: z.array(z.string()),
  activeContext: authenticationContextSchema.extend({
    organizationStatus: z.string().nullable(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    branchIds: branchScopeSchema,
  }),
});

export type PlatformProfile = z.infer<typeof meResponseSchema>;

const acceptedResponseSchema = z.object({ status: z.literal("ACCEPTED") });
const emailVerificationResponseSchema = z.object({
  verified: z.literal(true),
  authenticatorEnrolmentRequired: z.boolean(),
  expiresIn: z.number().int().optional(),
});

export type EmailVerificationResponse = z.infer<
  typeof emailVerificationResponseSchema
>;

const recoveryCodesResponseSchema = z.object({
  recoveryCodes: z.array(z.string().min(1)).min(1),
});

/** `GET /v1/me` restores the signed-in identity through the same-origin server. */
export async function getCurrentPlatformProfile(): Promise<PlatformProfile> {
  try {
    const response = await getPlatformHttpClient().get<unknown>("/v1/me");
    const profile = meResponseSchema.safeParse(response.data);
    if (!profile.success) {
      throw new PlatformApiError(
        UNEXPECTED_RESPONSE_MESSAGE,
        "INVALID_PLATFORM_RESPONSE",
        null,
        response.status,
        {},
        profile.error
      );
    }
    return profile.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not restore your sign-in.");
  }
}

/** Restore identity and active organisation context from the server session. */
export async function restorePlatformSession(): Promise<PlatformSession> {
  try {
    const response = await getCurrentPlatformProfile();
    const session = sessionSchema.safeParse(response);
    if (!session.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return session.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not restore your sign-in.");
  }
}

/**
 * `POST /v1/auth/login` returns a short-lived MFA or authenticator-enrolment
 * challenge. The backend-for-frontend keeps any eventual access and refresh tokens server-side.
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
export async function verifySignInCode(verification: {
  method: SignInMethod;
  code: string;
}): Promise<PlatformSession> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/mfa/verify",
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

/** `POST /v1/auth/verify-email`; consumes the one-time link token. */
export async function verifyPlatformEmailAddress(
  verificationToken: string
): Promise<EmailVerificationResponse> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/verify-email",
      { token: verificationToken }
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
      "/v1/auth/verify-email/resend",
      { email: emailAddress }
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

/** End the current Platform API session through the backend-for-frontend. */
export async function signOut(): Promise<void> {
  try {
    await getPlatformHttpClient().post("/v1/auth/logout", undefined, {
      headers: BODYLESS_POST_HEADERS,
    });
  } catch (error) {
    throw toPlatformApiError(error, "We could not sign you out. Try again.");
  }
}

const authenticatorSetupSchema = z.object({
  factorId: z.string().min(1),
  secret: z.string().min(1),
  otpauthUrl: z.string().startsWith("otpauth://"),
});

export type AuthenticatorSetup = z.infer<typeof authenticatorSetupSchema>;

/** Start setup using the short-lived HttpOnly enrolment challenge cookie. */
export async function startAuthenticatorSetup(): Promise<AuthenticatorSetup> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/mfa/totp/setup",
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

const recoveryCodesSchema = z.array(z.string().min(1)).min(1);
const authenticatorConfirmationSchema = z.union([
  sessionSchema.extend({ recoveryCodes: recoveryCodesSchema }),
  z.object({ recoveryCodes: recoveryCodesSchema }),
]);

export type AuthenticatorConfirmation = {
  recoveryCodes: string[];
  session: PlatformSession | null;
};

export type AuthenticatorConfirmationRequest = {
  factorId: string;
  code: string;
};

/** Confirm the first authenticator code and return recovery codes once. */
export async function confirmAuthenticator(
  confirmation: AuthenticatorConfirmationRequest
): Promise<AuthenticatorConfirmation> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/mfa/totp/confirm",
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

/** End every active Platform API session for the signed-in user. */
export async function signOutAllSessions(): Promise<void> {
  try {
    await getPlatformHttpClient().post("/v1/auth/logout-all", undefined, {
      headers: BODYLESS_POST_HEADERS,
    });
  } catch (error) {
    throw toPlatformApiError(error, "We could not sign out all sessions.");
  }
}

const sessionListSchema = z.object({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      current: z.boolean(),
      userAgent: z.string().nullable(),
      createdAt: z.string().datetime(),
      lastUsedAt: z.string().datetime(),
    })
  ),
});

export type PlatformSessionList = z.infer<typeof sessionListSchema>;

/** `GET /v1/auth/sessions`: list sessions belonging to the signed-in user. */
export async function getPlatformSessions(): Promise<PlatformSessionList> {
  try {
    const response =
      await getPlatformHttpClient().get<unknown>("/v1/auth/sessions");
    const sessions = sessionListSchema.safeParse(response.data);
    if (!sessions.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return sessions.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load your active sessions.");
  }
}

/** `DELETE /v1/auth/sessions/{id}`: end one of the user's sessions. */
export async function revokePlatformSession(sessionId: string): Promise<void> {
  try {
    await getPlatformHttpClient().delete(
      `/v1/auth/sessions/${encodeURIComponent(sessionId)}`
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not end that session.");
  }
}

/** `POST /v1/auth/mfa/recovery-codes`; requires a recent step-up. */
export async function regenerateRecoveryCodes(): Promise<string[]> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/mfa/recovery-codes",
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
export async function verifyStepUpCode(verification: {
  code: string;
  method?: SignInMethod;
}): Promise<z.infer<typeof tokenResponseSchema>> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/step-up",
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

/** Switch to an organisation or branch, or to the platform realm. */
export async function switchPlatformContext(
  context: { organizationId: string; branchId?: string } | { realm: "PLATFORM" }
): Promise<z.infer<typeof tokenResponseSchema>> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/context",
      context
    );
    const tokenResponse = tokenResponseSchema.safeParse(response.data);
    if (!tokenResponse.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return tokenResponse.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not switch your organisation.");
  }
}

/** `POST /v1/auth/phone/send-code` for the signed-in administrator. */
export async function sendPhoneVerificationCode(
  phoneNumber: string
): Promise<void> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/phone/send-code",
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
    await getPlatformHttpClient().post("/v1/auth/phone/verify", { code });
  } catch (error) {
    throw toPlatformApiError(error, "We could not verify that phone number.");
  }
}

/** `POST /v1/auth/password/forgot`; the response never reveals account state. */
export async function requestPasswordReset(
  emailAddress: string
): Promise<void> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/auth/password/forgot",
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
export async function resetPassword(request: {
  token: string;
  password: string;
}): Promise<void> {
  try {
    await getPlatformHttpClient().post("/v1/auth/password/reset", request);
  } catch (error) {
    throw toPlatformApiError(error, "We could not reset your password.", {
      password: "password",
    });
  }
}

/** `POST /v1/auth/password/change`; requires a recent step-up. */
export async function changePassword(request: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  try {
    await getPlatformHttpClient().post("/v1/auth/password/change", request);
  } catch (error) {
    throw toPlatformApiError(error, "We could not change your password.", {
      currentPassword: "currentPassword",
      newPassword: "newPassword",
    });
  }
}
