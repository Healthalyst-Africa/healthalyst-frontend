import { z } from "zod";
import { PASSWORD_LIMITS } from "~/features/authentication/config/authentication-limits";

export function createPasswordSchema(label: string) {
  return z
    .string({ error: `${label} is required.` })
    .min(1, { error: `${label} is required.` })
    .min(PASSWORD_LIMITS.minimum, {
      error: `${label} must be at least ${PASSWORD_LIMITS.minimum} characters.`,
    })
    .max(PASSWORD_LIMITS.maximum, {
      error: `${label} must be no more than ${PASSWORD_LIMITS.maximum} characters.`,
    });
}
