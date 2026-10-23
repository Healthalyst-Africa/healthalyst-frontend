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
>;

/** `GET /v1/onboarding/application` for the active organisation context. */
export async function getOrganizationApplication(
  accessToken: string
): Promise<OrganizationApplication> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      "/v1/onboarding/application",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const application = organizationApplicationSchema.safeParse(response.data);
    if (!application.success) {
      throw new Error(
        "We received an unexpected application response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return application.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load your organisation application. Try again shortly."
    );
  }
}
