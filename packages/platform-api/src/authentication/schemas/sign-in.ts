import { z as schemaLibrary } from "zod";

export const signInMethodSchema = schemaLibrary.enum(["totp", "recovery_code"]);

export const passwordStepResponseSchema = schemaLibrary.discriminatedUnion(
  "status",
  [
    schemaLibrary.object({
      status: schemaLibrary.literal("MFA_REQUIRED"),
      mfaToken: schemaLibrary.string().min(1).max(4096),
      methods: schemaLibrary.array(signInMethodSchema).min(1),
      expiresIn: schemaLibrary.number().int(),
    }),
    schemaLibrary.object({
      status: schemaLibrary.literal("MFA_ENROLMENT_REQUIRED"),
      enrolmentToken: schemaLibrary.string().min(1).max(4096),
      expiresIn: schemaLibrary.number().int(),
    }),
  ]
);
