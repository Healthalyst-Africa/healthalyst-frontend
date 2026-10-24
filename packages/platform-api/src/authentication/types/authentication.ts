import type { z } from "zod";
import type {
  signInMethodSchema,
  passwordStepResponseSchema,
} from "../schemas/sign-in";
import type {
  sessionSchema,
  meResponseSchema,
  tokenResponseSchema,
} from "../schemas/identity";
import type { emailVerificationResponseSchema } from "../schemas/verification";
import type { authenticatorSetupSchema } from "../schemas/authenticator";
import type { sessionListSchema } from "../schemas/sessions";

export type SignInMethod = z.infer<typeof signInMethodSchema>;

export type PasswordStepResponse = z.infer<typeof passwordStepResponseSchema>;

/** A safe browser session summary. Access and refresh tokens stay server-side. */
export type PlatformSession = z.infer<typeof sessionSchema>;

export type PlatformProfile = z.infer<typeof meResponseSchema>;

export type EmailVerificationResponse = z.infer<
  typeof emailVerificationResponseSchema
>;

export type AuthenticatorSetup = z.infer<typeof authenticatorSetupSchema>;

export type AuthenticatorConfirmation = {
  recoveryCodes: string[];
  session: PlatformSession | null;
};

export type AuthenticatorConfirmationRequest = {
  factorId: string;
  code: string;
};

export type PlatformSessionList = z.infer<typeof sessionListSchema>;

export type PlatformTokenResponse = z.infer<typeof tokenResponseSchema>;

export type PasswordSignInRequest = { identifier: string; password: string };

export type SignInCodeRequest = { method: SignInMethod; code: string };

export type StepUpVerificationRequest = { code: string; method?: SignInMethod };

export type PlatformContextRequest =
  { organizationId: string; branchId?: string } | { realm: "PLATFORM" };

export type PasswordResetRequest = { token: string; password: string };

export type PasswordChangeRequest = {
  currentPassword: string;
  newPassword: string;
};
