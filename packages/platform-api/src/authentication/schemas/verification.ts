import { z as schemaLibrary } from "zod";

export const acceptedResponseSchema = schemaLibrary.object({
  status: schemaLibrary.literal("ACCEPTED"),
});

export const emailVerificationResponseSchema = schemaLibrary.object({
  verified: schemaLibrary.literal(true),
  enrolmentToken: schemaLibrary.string().min(1).max(4096).optional(),
  expiresIn: schemaLibrary.number().int().optional(),
});
