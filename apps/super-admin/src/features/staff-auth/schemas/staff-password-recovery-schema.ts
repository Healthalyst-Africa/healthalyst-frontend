import { z as schemaLibrary } from "zod";
import {
  STAFF_EMAIL_ADDRESS_MAXIMUM_LENGTH,
  STAFF_PASSWORD_LIMITS,
} from "~/features/staff-auth/config/staff-password-recovery";

export const staffPasswordResetRequestSchema = schemaLibrary.object({
  emailAddress: schemaLibrary
    .string()
    .trim()
    .max(
      STAFF_EMAIL_ADDRESS_MAXIMUM_LENGTH,
      `Use no more than ${STAFF_EMAIL_ADDRESS_MAXIMUM_LENGTH} characters.`
    )
    .pipe(schemaLibrary.email("Enter a valid work email address.")),
});

function createStaffPasswordSchema(label: string) {
  return schemaLibrary
    .string()
    .min(1, `${label} is required.`)
    .min(
      STAFF_PASSWORD_LIMITS.minimum,
      `${label} must be at least ${STAFF_PASSWORD_LIMITS.minimum} characters.`
    )
    .max(
      STAFF_PASSWORD_LIMITS.maximum,
      `${label} must be no more than ${STAFF_PASSWORD_LIMITS.maximum} characters.`
    );
}

export const staffPasswordResetSchema = schemaLibrary
  .object({
    newPassword: createStaffPasswordSchema("New password"),
    confirmPassword: schemaLibrary
      .string()
      .min(1, "Confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
