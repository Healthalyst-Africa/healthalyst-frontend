import { z } from "zod";
import { createPasswordSchema } from "~/features/authentication/schemas/password-rules";

/** A new person's password when they accept an invitation. */
export const invitationPasswordFormSchema = z
  .object({
    password: createPasswordSchema("Password"),
    confirmPassword: z.string().min(1, "Enter the password again."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match.",
  });

export const invitationPreviewSchema = z.object({
  organization: z.object({
    name: z.string(),
    type: z.string().nullable(),
  }),
  invitedBy: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  roles: z.array(z.string()),
  expiresAt: z.string(),
  accountExists: z.boolean(),
});

export const invitationAcceptanceSchema = z.object({
  status: z.literal("ACCEPTED"),
  organizationId: z.string().uuid(),
  next: z.enum(["SIGN_IN", "SWITCH_CONTEXT"]),
});

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
export type InvitationAcceptance = z.infer<typeof invitationAcceptanceSchema>;
