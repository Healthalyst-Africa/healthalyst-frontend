import { z } from "zod";

/** Limits from the Platform API's `LoginBody` and `MfaVerifyBody`. */
export const SIGN_IN_LIMITS = {
  identifierMinimum: 3,
  identifierMaximum: 254,
  passwordMaximum: 128,
  recoveryCodeMaximum: 32,
} as const;

export const passwordStepSchema = z.object({
  identifier: z
    .string({ error: "Work email address is required." })
    .trim()
    .min(1, { error: "Work email address is required." })
    .min(SIGN_IN_LIMITS.identifierMinimum, {
      error: "Enter the work email address you registered with.",
    })
    .max(SIGN_IN_LIMITS.identifierMaximum, {
      error: `Work email address must be no more than ${SIGN_IN_LIMITS.identifierMaximum} characters.`,
    }),
  password: z
    .string({ error: "Password is required." })
    .min(1, { error: "Password is required." })
    .max(SIGN_IN_LIMITS.passwordMaximum, {
      error: `Password must be no more than ${SIGN_IN_LIMITS.passwordMaximum} characters.`,
    }),
});

export const authenticatorCodeSchema = z.object({
  code: z
    .string({ error: "Enter the 6-digit code." })
    .transform((code) => code.replace(/\s/g, ""))
    .pipe(
      z.string().regex(/^\d{6}$/, {
        error: "Enter the 6-digit code from your authenticator app.",
      })
    ),
});

export const recoveryCodeSchema = z.object({
  code: z
    .string({ error: "Enter a recovery code." })
    .trim()
    .min(6, { error: "Enter one of your recovery codes." })
    .max(SIGN_IN_LIMITS.recoveryCodeMaximum, {
      error: "Enter one of your recovery codes.",
    }),
});
