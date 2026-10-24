import axios from "axios";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  documentUploadRequestSchema,
  documentSummarySchema,
  uploadUrlResponseSchema,
} from "~/features/organization-application/schemas/organization-application-schema";
import type {
  OrganizationDocumentUploadRequest,
  OrganizationDocument,
  OrganizationDocumentUpload,
  OrganizationDocumentFileSubmission,
} from "~/features/organization-application/types/organization-application";
import {
  DOCUMENT_UPLOAD_CONFIGURATION,
  DOCUMENT_UPLOAD_ENDPOINTS,
} from "~/features/organization-application/config/document-upload";

/** Request a short-lived upload URL for a supported onboarding document. */
export async function requestOrganizationDocumentUpload(
  document: OrganizationDocumentUploadRequest
): Promise<OrganizationDocumentUpload> {
  const validatedDocument = documentUploadRequestSchema.safeParse(document);
  if (!validatedDocument.success) {
    throw new Error(
      validatedDocument.error.issues[0]?.message ??
        "Choose a PDF, JPEG, or PNG document smaller than 10 MB."
    );
  }

  try {
    const response = await getPlatformHttpClient().post<unknown>(
      DOCUMENT_UPLOAD_ENDPOINTS.uploadUrl,
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
      timeout: DOCUMENT_UPLOAD_CONFIGURATION.timeoutMilliseconds,
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
      DOCUMENT_UPLOAD_ENDPOINTS.documents,
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
      `${DOCUMENT_UPLOAD_ENDPOINTS.documents}/${encodeURIComponent(documentId)}`
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not remove this document.");
  }
}

/** Complete the storage transfer and confirmation as one application operation. */
export async function uploadOrganizationDocument({
  type,
  documentFile,
  expiresOn,
}: OrganizationDocumentFileSubmission): Promise<OrganizationDocument> {
  const contentType = documentUploadRequestSchema.shape.contentType.safeParse(
    documentFile.type
  );
  if (!contentType.success)
    throw new Error("Choose a PDF, JPEG, or PNG document.");
  const uploadRequest = await requestOrganizationDocumentUpload({
    type,
    fileName: documentFile.name,
    contentType: contentType.data,
    sizeBytes: documentFile.size,
  });
  await uploadOrganizationDocumentFile(
    uploadRequest.uploadUrl,
    uploadRequest.headers,
    documentFile
  );
  return confirmOrganizationDocumentUpload(uploadRequest.documentId, expiresOn);
}
