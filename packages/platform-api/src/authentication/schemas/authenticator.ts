import { z } from "zod";
import { sessionSchema } from "./identity";

export const authenticatorSetupSchema = z.object({
  factorId: z.string().min(1),
  secret: z.string().min(1),
  otpauthUrl: z.string().startsWith("otpauth://"),
});

export const recoveryCodesSchema = z.array(z.string().min(1)).min(1);

export const authenticatorConfirmationSchema = z.union([
  sessionSchema.extend({ recoveryCodes: recoveryCodesSchema }),
  z.object({ recoveryCodes: recoveryCodesSchema }),
]);

export const recoveryCodesResponseSchema = z.object({
  recoveryCodes: z.array(z.string().min(1)).min(1),
});
