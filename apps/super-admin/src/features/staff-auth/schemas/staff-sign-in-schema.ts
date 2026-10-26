import { z as schemaLibrary } from "zod";
import { STAFF_AUTHENTICATOR_CONFIGURATION } from "~/features/staff-auth/config/staff-sign-in";

export const staffSignInSchema = schemaLibrary.object({
  emailAddress: schemaLibrary.email("Enter a valid work email address."),
  password: schemaLibrary.string().min(1, "Enter your password."),
});

export const staffAuthenticatorCodeSchema = schemaLibrary.object({
  code: schemaLibrary
    .string()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app."),
});

export const staffRecoveryCodeSchema = schemaLibrary.object({
  code: schemaLibrary
    .string()
    .trim()
    .min(
      STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMinimumLength,
      "Enter one of your recovery codes."
    )
    .max(
      STAFF_AUTHENTICATOR_CONFIGURATION.recoveryCodeMaximumLength,
      "Enter one of your recovery codes."
    ),
});
