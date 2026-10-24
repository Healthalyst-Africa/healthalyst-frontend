import { z as schemaLibrary } from "zod";
import { sessionResponseSchema } from "./identity";

export const authenticatorSetupSchema = schemaLibrary.object({
  factorId: schemaLibrary.string().uuid(),
  secret: schemaLibrary.string().min(1),
  otpauthUrl: schemaLibrary.string().startsWith("otpauth://"),
});

export const recoveryCodesSchema = schemaLibrary
  .array(schemaLibrary.string().min(1))
  .min(1);

export const authenticatorConfirmationSchema = schemaLibrary.union([
  sessionResponseSchema.extend({ recoveryCodes: recoveryCodesSchema }),
  schemaLibrary.object({ recoveryCodes: recoveryCodesSchema }).strict(),
]);

export const recoveryCodesResponseSchema = schemaLibrary.object({
  recoveryCodes: schemaLibrary.array(schemaLibrary.string().min(1)).min(1),
});
