import { z } from "zod";
import {
  documentTypeSchema,
  organizationTypeSchema,
} from "~/shared/organization/schemas/organization-values-schema";

export const policyVersionsSchema = z.object({
  terms: z.string().min(1),
  privacyNotice: z.string().min(1),
  dpa: z.string().min(1),
});

export const organizationTypeReferenceSchema = z.object({
  type: organizationTypeSchema,
  required: z.array(documentTypeSchema),
  optional: z.array(documentTypeSchema),
});

export const organizationTypesResponseSchema = z.object({
  data: z.array(organizationTypeReferenceSchema),
});

export const nigerianStatesResponseSchema = z.object({
  data: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
    })
  ),
});

export const registrationResponseSchema = z.object({
  status: z.literal("PENDING_EMAIL_VERIFICATION"),
  message: z.string(),
});
