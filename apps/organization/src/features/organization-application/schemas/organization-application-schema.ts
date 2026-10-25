import {
  ORGANIZATION_FIELD_LIMITS,
  INTERNATIONAL_PHONE_PATTERN,
} from "~/shared/organization/config/organization-validation";
import { z } from "zod";
import {
  documentTypeSchema,
  organizationTypeSchema,
  organizationStatusSchema,
} from "~/shared/organization/schemas/organization-values-schema";
import { DOCUMENT_UPLOAD_CONFIGURATION } from "~/features/organization-application/config/document-upload";

export const organizationApplicationSchema = z.object({
  id: z.string().uuid(),
  status: organizationStatusSchema,
  version: z.number().int(),
  canEdit: z.boolean(),
  canSubmit: z.boolean(),
  profile: z.object({
    legalName: z.string(),
    tradingName: z.string(),
    type: organizationTypeSchema.nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    addressLine: z.string().nullable(),
    city: z.string().nullable(),
    stateCode: z.string().nullable(),
    lga: z.string().nullable(),
    cacNumber: z.string().nullable(),
    facilityLicenceNo: z.string().nullable(),
  }),
  checklist: z.object({
    profileComplete: z.boolean(),
    emailVerified: z.boolean(),
    phoneVerified: z.boolean(),
    mfaEnrolled: z.boolean(),
    documentsComplete: z.boolean(),
  }),
  requiredDocuments: z.array(
    z.object({
      type: documentTypeSchema,
      required: z.boolean(),
      satisfied: z.boolean(),
    })
  ),
  documents: z.array(
    z.object({
      id: z.string().uuid(),
      type: documentTypeSchema,
      fileName: z.string(),
      contentType: z.string(),
      sizeBytes: z.number().int(),
      status: z.enum([
        "UPLOADING",
        "SCANNING",
        "CLEAN",
        "INFECTED",
        "ACCEPTED",
        "REJECTED",
      ]),
      expiresOn: z.string().nullable(),
      createdAt: z.string(),
    })
  ),
  messages: z.array(
    z.object({
      toStatus: organizationStatusSchema,
      reasonCode: z.string().nullable(),
      message: z.string().nullable(),
      items: z
        .array(
          z.object({
            field: z.string(),
            message: z.string(),
          })
        )
        .nullable(),
      createdAt: z.string(),
    })
  ),
  submittedAt: z.string().nullable(),
  /** Products chosen at registration; older API versions omit the list. */
  products: z
    .array(
      z.object({
        code: z.string(),
        name: z.string(),
        status: z.string(),
      })
    )
    .default([]),
});

export const applicationPatchSchema = z
  .object({
    legalName: z.string().min(1).max(ORGANIZATION_FIELD_LIMITS.name).optional(),
    tradingName: z
      .string()
      .min(1)
      .max(ORGANIZATION_FIELD_LIMITS.name)
      .optional(),
    type: organizationTypeSchema.optional(),
    email: z
      .string()
      .email()
      .max(ORGANIZATION_FIELD_LIMITS.emailAddress)
      .optional(),
    phone: z.string().regex(INTERNATIONAL_PHONE_PATTERN).optional(),
    addressLine: z
      .string()
      .min(1)
      .max(ORGANIZATION_FIELD_LIMITS.addressLine)
      .optional(),
    city: z.string().min(1).max(ORGANIZATION_FIELD_LIMITS.city).optional(),
    stateCode: z.string().length(2).optional(),
    lga: z
      .string()
      .min(1)
      .max(ORGANIZATION_FIELD_LIMITS.localGovernmentArea)
      .nullable()
      .optional(),
    cacNumber: z.string().nullable().optional(),
    facilityLicenceNo: z
      .string()
      .min(1)
      .max(ORGANIZATION_FIELD_LIMITS.facilityLicenceNumber)
      .nullable()
      .optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Update at least one application field.",
  });

export const uploadUrlResponseSchema = z.object({
  documentId: z.string().uuid(),
  uploadUrl: z.string().url(),
  headers: z.record(z.string(), z.string()),
  expiresIn: z.number().int(),
});

export const documentUploadRequestSchema = z.object({
  type: documentTypeSchema,
  fileName: z
    .string()
    .min(1)
    .max(DOCUMENT_UPLOAD_CONFIGURATION.maximumFileNameLength),
  contentType: z.enum(DOCUMENT_UPLOAD_CONFIGURATION.contentTypes),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(DOCUMENT_UPLOAD_CONFIGURATION.maximumSizeBytes),
});

export const documentSummarySchema = z.object({
  id: z.string().uuid(),
  type: documentTypeSchema,
  fileName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int(),
  status: z.enum([
    "UPLOADING",
    "SCANNING",
    "CLEAN",
    "INFECTED",
    "ACCEPTED",
    "REJECTED",
  ]),
  expiresOn: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const statusChangeResponseSchema = z.object({
  id: z.string().uuid(),
  status: organizationStatusSchema,
  version: z.number().int(),
});
