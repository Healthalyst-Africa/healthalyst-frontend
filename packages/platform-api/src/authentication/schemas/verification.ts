import { z } from "zod";

export const acceptedResponseSchema = z.object({
  status: z.literal("ACCEPTED"),
});

export const emailVerificationResponseSchema = z.object({
  verified: z.literal(true),
  authenticatorEnrolmentRequired: z.boolean(),
  expiresIn: z.number().int().optional(),
});
