import { z } from "zod";
import { getStaffHttpClient } from "~/features/staff-auth/api/staff-http-client";
import { explainStaffApiError } from "~/features/staff-auth/api/staff-service";

const registrationStatusSchema = z.enum([
  "PENDING_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
]);

const organizationApplicationSchema = z.object({
  applicationId: z.uuid(),
  organizationName: z.string(),
  organizationType: z.string(),
  registrationNumber: z.string(),
  countryCode: z.string(),
  organizationEmailAddress: z.string(),
  organizationPhoneNumber: z.string().nullish(),
  websiteUrl: z.string().nullish(),
  productInterest: z.string(),
  requestedModule: z.string(),
  status: registrationStatusSchema,
  reviewNote: z.string().nullish(),
  submittedAt: z.string(),
});

const evidenceDocumentSchema = z.object({
  documentId: z.uuid(),
  originalFilename: z.string(),
  mediaType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  sizeBytes: z.number(),
  uploadedAt: z.string(),
});

const evidenceRequestSchema = z.object({
  requestId: z.uuid(),
  applicationId: z.uuid(),
  title: z.string(),
  instructions: z.string(),
  status: z.enum(["REQUESTED", "SUBMITTED", "ACCEPTED"]),
  reviewerNote: z.string().nullish(),
  createdAt: z.string(),
  documents: z.array(evidenceDocumentSchema),
});

export type OrganizationApplication = z.infer<
  typeof organizationApplicationSchema
>;
export type EvidenceRequest = z.infer<typeof evidenceRequestSchema>;
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;

const ORGANIZATIONS_ENDPOINT = "/api/v1/staff/organization-registrations";

export async function listOrganizationApplications(): Promise<
  OrganizationApplication[]
> {
  try {
    const response = await getStaffHttpClient().get<unknown>(
      ORGANIZATIONS_ENDPOINT
    );
    return z.array(organizationApplicationSchema).parse(response.data);
  } catch (error) {
    throw explainStaffApiError(
      error,
      "We could not load organisations. Try again."
    );
  }
}

export async function listReviewQueue(): Promise<OrganizationApplication[]> {
  try {
    const response = await getStaffHttpClient().get<unknown>(
      `${ORGANIZATIONS_ENDPOINT}/review-queue`
    );
    return z.array(organizationApplicationSchema).parse(response.data);
  } catch (error) {
    throw explainStaffApiError(
      error,
      "We could not load the review queue. Try again."
    );
  }
}

export async function recordReviewDecision(
  applicationId: string,
  status: Exclude<RegistrationStatus, "PENDING_REVIEW">,
  note: string
): Promise<void> {
  try {
    await getStaffHttpClient().post(
      `${ORGANIZATIONS_ENDPOINT}/${applicationId}/decision`,
      { status, note }
    );
  } catch (error) {
    throw explainStaffApiError(
      error,
      "We could not save the decision. Refresh and try again."
    );
  }
}

export async function listEvidenceRequests(
  applicationId: string
): Promise<EvidenceRequest[]> {
  try {
    const response = await getStaffHttpClient().get<unknown>(
      `${ORGANIZATIONS_ENDPOINT}/${applicationId}/evidence-requests`
    );
    return z.array(evidenceRequestSchema).parse(response.data);
  } catch (error) {
    throw explainStaffApiError(error, "We could not load evidence. Try again.");
  }
}

export async function createEvidenceRequest(
  applicationId: string,
  title: string,
  instructions: string
): Promise<EvidenceRequest> {
  try {
    const response = await getStaffHttpClient().post<unknown>(
      `${ORGANIZATIONS_ENDPOINT}/${applicationId}/evidence-requests`,
      { title, instructions }
    );
    return evidenceRequestSchema.parse(response.data);
  } catch (error) {
    throw explainStaffApiError(
      error,
      "We could not request evidence. Try again."
    );
  }
}

export async function reviewEvidenceRequest(
  requestId: string,
  accepted: boolean,
  note: string
): Promise<EvidenceRequest> {
  try {
    const response = await getStaffHttpClient().post<unknown>(
      `${ORGANIZATIONS_ENDPOINT}/evidence-requests/${requestId}/decision`,
      { accepted, note }
    );
    return evidenceRequestSchema.parse(response.data);
  } catch (error) {
    throw explainStaffApiError(
      error,
      "We could not save the evidence review. Try again."
    );
  }
}

export async function downloadEvidenceDocument(
  applicationId: string,
  documentId: string
): Promise<Blob> {
  try {
    const response = await getStaffHttpClient().get<Blob>(
      `${ORGANIZATIONS_ENDPOINT}/${applicationId}/evidence-documents/${documentId}`,
      { responseType: "blob" }
    );
    return response.data;
  } catch (error) {
    throw explainStaffApiError(
      error,
      "We could not download this document. Try again."
    );
  }
}
