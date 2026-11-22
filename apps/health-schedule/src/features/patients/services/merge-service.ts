import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { PATIENT_ENDPOINTS } from "~/features/patients/config/patients";
import {
  duplicateCandidatesSchema,
  mergePreviewSchema,
  patientMergeListSchema,
  patientMergeResultSchema,
  type DuplicateCandidate,
  type MergePreview,
  type PatientMerge,
} from "~/features/patients/schemas/patient-response-schemas";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export type MergeRequest = {
  survivorId: string;
  mergedId: string;
  survivorVersion: number;
  mergedVersion: number;
  take: string[];
  reason: string;
};

/** Records that may be the same person, most likely first. */
export async function listDuplicates(
  patientId: string
): Promise<DuplicateCandidate[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.duplicates(patientId)
    );
    return parseHealthScheduleResponse(
      duplicateCandidatesSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not check for duplicates.");
  }
}

/** Both records side by side. Requires `patient:merge`. */
export async function getMergePreview(
  survivorId: string,
  mergedId: string
): Promise<MergePreview> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.mergePreview,
      { params: { survivorId, mergedId } }
    );
    return parseHealthScheduleResponse(
      mergePreviewSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not compare the records.");
  }
}

/**
 * Merges the duplicate into the record that stays. The versions are the
 * ones shown in the preview; a record changed since then is refused.
 */
export async function mergePatients(request: MergeRequest): Promise<void> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_ENDPOINTS.merges,
      request
    );
    parseHealthScheduleResponse(
      patientMergeResultSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not merge the records.", {
      reason: "reason",
    });
  }
}

/** Merges of the last 90 days, newest first. Requires `patient:merge`. */
export async function listMerges(): Promise<PatientMerge[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.merges
    );
    return parseHealthScheduleResponse(
      patientMergeListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load recent merges.");
  }
}

/** Within 30 days, and only while neither record has changed since. */
export async function undoMerge(
  mergeId: string,
  reason: string
): Promise<void> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_ENDPOINTS.undoMerge(mergeId),
      { reason }
    );
    parseHealthScheduleResponse(
      patientMergeResultSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not undo the merge.", {
      reason: "reason",
    });
  }
}
