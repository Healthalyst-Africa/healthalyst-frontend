import axios from "axios";
import { z } from "zod";
import { getPlatformHttpClient } from "./platform-http-client";
import { toPlatformApiError } from "./platform-api-error";

const organizationTypeSchema = z.enum([
  "CLINIC",
  "HOSPITAL",
  "SPECIALIST_CLINIC",
  "DIAGNOSTIC_CENTRE",
  "LABORATORY",
  "IMAGING_CENTRE",
  "PHARMACY",
  "MULTI_BRANCH_GROUP",
]);

const organizationStatusSchema = z.enum([
  "DRAFT",
  "PENDING_VERIFICATION",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "DEACTIVATED",
]);

const documentTypeSchema = z.enum([
  "CAC_CERTIFICATE",
  "FACILITY_LICENCE",
  "MEDICAL_DIRECTOR_LICENCE",
  "MLSCN_LICENCE",
  "PCN_PREMISES_LICENCE",
  "NHIA_ACCREDITATION",
  "PROOF_OF_ADDRESS",
  "OTHER",
]);

export type OrganizationDocumentType = z.infer<typeof documentTypeSchema>;

const organizationApplicationSchema = z.object({
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
});

export type OrganizationApplication = z.infer<
  typeof organizationApplicationSchema
> & { entityTag: string | null };

const applicationPatchSchema = z
  .object({
    legalName: z.string().min(1).max(200).optional(),
    tradingName: z.string().min(1).max(200).optional(),
    type: organizationTypeSchema.optional(),
    email: z.string().email().max(254).optional(),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/)
      .optional(),
    addressLine: z.string().min(1).max(300).optional(),
    city: z.string().min(1).max(100).optional(),
    stateCode: z.string().length(2).optional(),
    lga: z.string().min(1).max(100).nullable().optional(),
    cacNumber: z.string().nullable().optional(),
    facilityLicenceNo: z.string().min(1).max(100).nullable().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Update at least one application field.",
  });

const uploadUrlResponseSchema = z.object({
  documentId: z.string().uuid(),
  uploadUrl: z.string().url(),
  headers: z.record(z.string(), z.string()),
  expiresIn: z.number().int(),
});

const documentUploadRequestSchema = z.object({
  type: documentTypeSchema,
  fileName: z.string().min(1).max(200),
  contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(10 * 1024 * 1024),
});

export type OrganizationDocumentUploadRequest = z.infer<
  typeof documentUploadRequestSchema
>;

const documentSummarySchema = z.object({
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

export type OrganizationDocument = z.infer<typeof documentSummarySchema>;

const statusChangeResponseSchema = z.object({
  id: z.string().uuid(),
  status: organizationStatusSchema,
  version: z.number().int(),
});

function readApplicationEntityTag(
  responseEntityTag: string | undefined,
  applicationVersion: number
): string {
  return responseEntityTag ?? String(applicationVersion);
}

/** `GET /v1/onboarding/application` for the active organisation context. */
export async function getOrganizationApplication(): Promise<OrganizationApplication> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      "/v1/onboarding/application"
    );
    const application = organizationApplicationSchema.safeParse(response.data);
    if (!application.success) {
      throw new Error(
        "We received an unexpected application response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return {
      ...application.data,
      entityTag: readApplicationEntityTag(
        response.headers.etag,
        application.data.version
      ),
    };
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load your organisation application. Try again shortly."
    );
  }
}

/** Save editable application fields using the current `If-Match` version. */
export async function updateOrganizationApplication(
  entityTag: string,
  applicationChanges: z.input<typeof applicationPatchSchema>
): Promise<OrganizationApplication> {
  const validatedChanges = applicationPatchSchema.safeParse(applicationChanges);
  if (!validatedChanges.success) {
    throw new Error(
      validatedChanges.error.issues[0]?.message ??
        "Check the application details and try again."
    );
  }

  try {
    const response = await getPlatformHttpClient().patch<unknown>(
      "/v1/onboarding/application",
      validatedChanges.data,
      {
        headers: { "If-Match": entityTag },
      }
    );
    const application = organizationApplicationSchema.safeParse(response.data);
    if (!application.success) {
      throw new Error(
        "We received an unexpected application response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return {
      ...application.data,
      entityTag: readApplicationEntityTag(
        response.headers.etag,
        application.data.version
      ),
    };
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save your organisation application. Try again."
    );
  }
}

/** Request a short-lived upload URL for a supported onboarding document. */
export async function requestOrganizationDocumentUpload(
  document: OrganizationDocumentUploadRequest
): Promise<z.infer<typeof uploadUrlResponseSchema>> {
  const validatedDocument = documentUploadRequestSchema.safeParse(document);
  if (!validatedDocument.success) {
    throw new Error(
      validatedDocument.error.issues[0]?.message ??
        "Choose a PDF, JPEG, or PNG document smaller than 10 MB."
    );
  }

  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/onboarding/documents/upload-url",
      validatedDocument.data
    );
    const uploadRequest = uploadUrlResponseSchema.safeParse(response.data);
    if (!uploadRequest.success) {
      throw new Error(
        "We received an unexpected upload response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return uploadRequest.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not prepare this document for upload. Try again."
    );
  }
}

/** Upload a file to the presigned storage URL using only its returned headers. */
export async function uploadOrganizationDocumentFile(
  uploadUrl: string,
  headers: Record<string, string>,
  documentFile: File
): Promise<void> {
  try {
    await axios.put(uploadUrl, documentFile, {
      headers,
      timeout: 30_000,
      withCredentials: false,
    });
  } catch {
    throw new Error(
      "The document could not be uploaded. Check your connection and try again."
    );
  }
}

/** Confirm the presigned upload so the Platform API can validate and scan it. */
export async function confirmOrganizationDocumentUpload(
  documentId: string,
  expiresOn?: string
): Promise<OrganizationDocument> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/onboarding/documents",
      { documentId, ...(expiresOn ? { expiresOn } : {}) }
    );
    const document = documentSummarySchema.safeParse(response.data);
    if (!document.success) {
      throw new Error(
        "We received an unexpected document response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return document.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not confirm this document upload. Try again."
    );
  }
}

/** Remove a document before the application is submitted. */
export async function deleteOrganizationDocument(
  documentId: string
): Promise<void> {
  try {
    await getPlatformHttpClient().delete(
      `/v1/onboarding/documents/${encodeURIComponent(documentId)}`
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not remove this document.");
  }
}

/** Submit a complete application for review with its current version. */
export async function submitOrganizationApplication(
  entityTag: string
): Promise<z.infer<typeof statusChangeResponseSchema>> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/onboarding/application/submit",
      undefined,
      { headers: { "If-Match": entityTag } }
    );
    const statusChange = statusChangeResponseSchema.safeParse(response.data);
    if (!statusChange.success) {
      throw new Error(
        "We received an unexpected submission response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return statusChange.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not submit your application. Check the checklist and try again."
    );
  }
}
