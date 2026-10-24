import { z } from "zod";
import { createPasswordSchema } from "~/features/authentication/schemas/password-rules";

export const passwordResetSchema = z
  .object({
    newPassword: createPasswordSchema("New password"),
    confirmPassword: createPasswordSchema("Confirm password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });
