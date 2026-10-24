import type { z as schemaLibrary } from "zod";
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

export type SignInMethod = schemaLibrary.infer<typeof signInMethodSchema>;

export type PasswordStepResponse = schemaLibrary.infer<
  typeof passwordStepResponseSchema
>;

/** Identity state for rendering. Access tokens remain private to the transport. */
export type PlatformSession = schemaLibrary.infer<typeof sessionSchema>;

export type PlatformProfile = schemaLibrary.infer<typeof meResponseSchema>;

export type EmailVerificationResponse = schemaLibrary.infer<
  typeof emailVerificationResponseSchema
>;

export type AuthenticatorSetup = schemaLibrary.infer<
  typeof authenticatorSetupSchema
>;

export type AuthenticatorConfirmation = {
  recoveryCodes: string[];
  session: PlatformSession | null;
};

export type AuthenticatorConfirmationRequest = {
  enrolmentToken?: string;
  factorId: string;
  code: string;
};

export type PlatformSessionList = schemaLibrary.infer<typeof sessionListSchema>;

export type PlatformTokenResponse = Omit<
  schemaLibrary.infer<typeof tokenResponseSchema>,
  "accessToken"
>;

export type PasswordSignInRequest = { identifier: string; password: string };

export type SignInCodeRequest = {
  mfaToken: string;
  method: SignInMethod;
  code: string;
};

export type StepUpVerificationRequest = { code: string; method?: SignInMethod };

export type PlatformContextRequest =
  { organizationId: string; branchId?: string } | { realm: "PLATFORM" };

export type PasswordResetRequest = { token: string; password: string };

export type PasswordChangeRequest = {
  currentPassword: string;
  newPassword: string;
};
