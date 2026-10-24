import { z as schemaLibrary } from "zod";

export const organizationStatusSchema = schemaLibrary.enum([
  "DRAFT",
  "PENDING_VERIFICATION",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "DEACTIVATED",
]);

export const organizationTypeSchema = schemaLibrary.enum([
  "CLINIC",
  "HOSPITAL",
  "SPECIALIST_CLINIC",
  "DIAGNOSTIC_CENTRE",
  "LABORATORY",
  "IMAGING_CENTRE",
  "PHARMACY",
  "MULTI_BRANCH_GROUP",
]);

export const organizationApplicationSchema = schemaLibrary.object({
  id: schemaLibrary.uuid(),
  legalName: schemaLibrary.string(),
  displayName: schemaLibrary.string(),
  type: organizationTypeSchema.nullable(),
  stateCode: schemaLibrary.string().nullable(),
  status: organizationStatusSchema,
  submittedAt: schemaLibrary.iso.datetime().nullable(),
  reviewerId: schemaLibrary.uuid().nullable(),
  createdAt: schemaLibrary.iso.datetime(),
});

export const organizationListResponseSchema = schemaLibrary.object({
  data: schemaLibrary.array(organizationApplicationSchema),
  page: schemaLibrary.object({
    nextCursor: schemaLibrary.string().nullable(),
    hasMore: schemaLibrary.boolean(),
  }),
});

export const organizationDocumentSchema = schemaLibrary.object({
  id: schemaLibrary.uuid(),
  type: schemaLibrary.enum([
    "CAC_CERTIFICATE",
    "FACILITY_LICENCE",
    "MEDICAL_DIRECTOR_LICENCE",
    "MLSCN_LICENCE",
    "PCN_PREMISES_LICENCE",
    "NHIA_ACCREDITATION",
    "PROOF_OF_ADDRESS",
    "OTHER",
  ]),
  fileName: schemaLibrary.string(),
  contentType: schemaLibrary.string(),
  sizeBytes: schemaLibrary.number().int(),
  status: schemaLibrary.enum([
    "UPLOADING",
    "SCANNING",
    "CLEAN",
    "INFECTED",
    "ACCEPTED",
    "REJECTED",
  ]),
  expiresOn: schemaLibrary.iso.date().nullable(),
  createdAt: schemaLibrary.iso.datetime(),
});

export const organizationDetailSchema = organizationApplicationSchema.extend({
  version: schemaLibrary.number().int().positive(),
  profile: schemaLibrary.record(
    schemaLibrary.string(),
    schemaLibrary.unknown()
  ),
  products: schemaLibrary.array(
    schemaLibrary.object({
      code: schemaLibrary.string(),
      status: schemaLibrary.string(),
    })
  ),
  documents: schemaLibrary.array(organizationDocumentSchema),
  members: schemaLibrary.array(schemaLibrary.unknown()),
  history: schemaLibrary.array(schemaLibrary.unknown()),
  possibleDuplicates: schemaLibrary.array(
    schemaLibrary.object({
      id: schemaLibrary.uuid(),
      legalName: schemaLibrary.string(),
      status: organizationStatusSchema,
      matchedOn: schemaLibrary.array(schemaLibrary.string()),
    })
  ),
});

export const organizationStatusChangeSchema = schemaLibrary.object({
  id: schemaLibrary.uuid(),
  status: organizationStatusSchema,
  version: schemaLibrary.number().int(),
});

export const documentViewAddressSchema = schemaLibrary.object({
  url: schemaLibrary.url(),
  expiresIn: schemaLibrary.number().int().positive(),
});
