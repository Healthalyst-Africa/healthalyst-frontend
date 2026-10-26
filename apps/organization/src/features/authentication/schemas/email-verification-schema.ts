import { z } from "zod";

export const emailVerificationRequestSchema = z.object({
  emailAddress: z
    .string({ error: "Work email address is required." })
    .trim()
    .min(1, { error: "Work email address is required." })
    .max(254, {
      error: "Work email address must be no more than 254 characters.",
    })
    .pipe(z.email({ error: "Enter a valid email address." })),
});
