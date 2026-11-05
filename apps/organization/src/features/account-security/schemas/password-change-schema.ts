import { z } from "zod";
import { CURRENT_PASSWORD_MAXIMUM_LENGTH } from "~/features/account-security/config/account-security";
import { createPasswordSchema } from "~/features/authentication/schemas/password-rules";

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string({ error: "Current password is required." })
      .min(1, { error: "Current password is required." })
      .max(CURRENT_PASSWORD_MAXIMUM_LENGTH, {
        error: `Current password must be no more than ${CURRENT_PASSWORD_MAXIMUM_LENGTH} characters.`,
      }),
    newPassword: createPasswordSchema("New password"),
    confirmPassword: createPasswordSchema("Confirm password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    error: "Choose a password you are not using now.",
    path: ["newPassword"],
  });
