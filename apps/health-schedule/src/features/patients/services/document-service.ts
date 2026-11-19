import { isAxiosError } from "axios";
import {
  PlatformApiError,
  toPlatformApiError,
} from "@healthalyst/platform-api/api-error";
import {
  DOCUMENT_CHECK_RETRY,
  PATIENT_ENDPOINTS,
} from "~/features/patients/config/patients";
import {
  documentLinkSchema,
  documentUploadStartedSchema,
  patientDocumentListSchema,
  patientDocumentSchema,
  type DocumentUploadStarted,
  type PatientDocument,
} from "~/features/patients/schemas/patient-response-schemas";
import { getDocumentStorageHttpClient } from "~/infrastructure/api/document-storage-http-client";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

/** The API answers this when document storage is not set up yet. */
export const DOCUMENTS_NOT_CONFIGURED = "DOCUMENTS_NOT_CONFIGURED";
const SCANNER_UNAVAILABLE = "SCANNER_UNAVAILABLE";

/** The patient's documents, newest first. */
export async function listDocuments(
  patientId: string
): Promise<PatientDocument[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.documents(patientId)
    );
    return parseHealthScheduleResponse(
      patientDocumentListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the documents.");
  }
}

async function startUpload(
  patientId: string,
  request: Record<string, unknown>
): Promise<DocumentUploadStarted> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_ENDPOINTS.documents(patientId),
      request
    );
    return parseHealthScheduleResponse(
      documentUploadStartedSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not start the upload.", {
      category: "category",
      title: "title",
      contentType: "file",
      sizeBytes: "file",
    });
  }
}

/**
 * Sends the file to the signed storage link. The browser sets the length
 * from the file; only the content type is sent as a header.
 */
async function sendFile(
  started: DocumentUploadStarted,
  file: File,
  onProgress: (fraction: number) => void
): Promise<void> {
  try {
    await getDocumentStorageHttpClient().put(started.upload.url, file, {
      headers: { "Content-Type": started.upload.headers["Content-Type"] },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          onProgress(progressEvent.loaded / progressEvent.total);
        }
      },
    });
  } catch (error) {
    const isTimeout =
      isAxiosError(error) &&
      (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT");
    throw new PlatformApiError(
      isTimeout
        ? "The file took too long to send. Check your connection and try again."
        : "The file did not finish sending. Check your connection and try again.",
      "DOCUMENT_SEND_FAILED",
      null,
      null,
      {},
      error
    );
  }
}

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/** Checks the file's type and scans it for viruses, retrying a busy scanner. */
async function completeUpload(
  patientId: string,
  documentId: string
): Promise<PatientDocument> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await getHealthScheduleHttpClient().post<unknown>(
        PATIENT_ENDPOINTS.completeDocument(patientId, documentId),
        {}
      );
      return parseHealthScheduleResponse(
        patientDocumentSchema,
        response.data,
        response.status
      );
    } catch (error) {
      const apiError = toPlatformApiError(
        error,
        "We could not check the file."
      );
      const isScannerBusy = apiError.code === SCANNER_UNAVAILABLE;
      if (isScannerBusy && attempt < DOCUMENT_CHECK_RETRY.attemptLimit) {
        await waitFor(DOCUMENT_CHECK_RETRY.delayMilliseconds);
        continue;
      }
      if (isScannerBusy) {
        throw new PlatformApiError(
          "The virus check is busy. Try uploading the file again in a minute.",
          apiError.code,
          apiError.requestId,
          apiError.status,
          {},
          error
        );
      }
      throw apiError;
    }
  }
}

export type DocumentUploadStage = "starting" | "sending" | "checking";

/**
 * The whole upload: ask for a link, send the file straight to storage, then
 * have it checked. A refused file (the wrong type, or a virus) comes back
 * with its status for the caller to explain.
 */
export async function uploadDocument({
  patientId,
  request,
  file,
  onStageChange,
  onProgress,
}: {
  patientId: string;
  request: Record<string, unknown>;
  file: File;
  onStageChange: (stage: DocumentUploadStage) => void;
  onProgress: (fraction: number) => void;
}): Promise<PatientDocument> {
  onStageChange("starting");
  const started = await startUpload(patientId, request);
  onStageChange("sending");
  await sendFile(started, file, onProgress);
  onStageChange("checking");
  return completeUpload(patientId, started.document.id);
}

/**
 * A five-minute link to open the document. Clinical documents need
 * `triage:record`. Never store the link.
 */
export async function getDocumentLink(
  patientId: string,
  documentId: string
): Promise<string> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.documentLink(patientId, documentId)
    );
    return parseHealthScheduleResponse(
      documentLinkSchema,
      response.data,
      response.status
    ).url;
  } catch (error) {
    throw toPlatformApiError(error, "The document did not open.");
  }
}

/** Hides the document from the record; the file is kept. */
export async function removeDocument(
  patientId: string,
  documentId: string,
  reason: string
): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      PATIENT_ENDPOINTS.removeDocument(patientId, documentId),
      { reason }
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not remove the document.", {
      reason: "reason",
    });
  }
}
