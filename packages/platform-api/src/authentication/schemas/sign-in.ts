import { z } from "zod";

export const signInMethodSchema = z.enum(["totp", "recovery_code"]);

export const passwordStepResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("MFA_REQUIRED"),
    methods: z.array(signInMethodSchema).min(1),
    expiresIn: z.number().int(),
  }),
  z.object({
    status: z.literal("MFA_ENROLMENT_REQUIRED"),
    expiresIn: z.number().int(),
  }),
]);
