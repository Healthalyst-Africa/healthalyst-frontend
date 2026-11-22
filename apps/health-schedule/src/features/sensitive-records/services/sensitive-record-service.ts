import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  SENSITIVE_RECORD_ENDPOINTS,
  SENSITIVE_RECORD_LIMITS,
} from "~/features/sensitive-records/config/sensitive-records";
import {
  emergencyAccessGrantListSchema,
  emergencyAccessGrantSchema,
  recordSensitivitySchema,
  type EmergencyAccessGrant,
  type RecordSensitivity,
  type ReviewableGrant,
  type SensitivityCategory,
} from "~/features/sensitive-records/schemas/sensitive-record-response-schemas";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

/** Whether the record is restricted and the reader's access. Requires `patient:read`. */
export async function getRecordSensitivity(
  patientId: string
): Promise<RecordSensitivity> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      SENSITIVE_RECORD_ENDPOINTS.sensitivity(patientId)
    );
    return parseHealthScheduleResponse(
      recordSensitivitySchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not check this record's access.");
  }
}

/** Labels every record of the person. Requires `sensitive:manage`. */
export async function addSensitivityLabel(
  patientId: string,
  request: { category: SensitivityCategory; reason: string }
): Promise<RecordSensitivity> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      SENSITIVE_RECORD_ENDPOINTS.labels(patientId),
      request
    );
    return parseHealthScheduleResponse(
      recordSensitivitySchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not add the label.", {
      category: "category",
      reason: "reason",
    });
  }
}

/** Requires `sensitive:manage`. */
export async function removeSensitivityLabel(
  patientId: string,
  labelId: string,
  reason: string
): Promise<RecordSensitivity> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      SENSITIVE_RECORD_ENDPOINTS.removeLabel(patientId, labelId),
      { reason }
    );
    return parseHealthScheduleResponse(
      recordSensitivitySchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not remove the label.", {
      reason: "reason",
    });
  }
}

/**
 * Opens a restricted record for four hours. The reason is logged and goes
 * to a manager for review. Requires `triage:record`.
 */
export async function requestEmergencyAccess(
  patientId: string,
  reason: string
): Promise<EmergencyAccessGrant> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      SENSITIVE_RECORD_ENDPOINTS.emergencyAccess(patientId),
      { reason }
    );
    return parseHealthScheduleResponse(
      emergencyAccessGrantSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not open the record.", {
      reason: "reason",
    });
  }
}

/** Emergency access to review, newest first. Requires `audit:read`. */
export async function listEmergencyAccessGrants(
  onlyUnreviewed: boolean
): Promise<ReviewableGrant[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      SENSITIVE_RECORD_ENDPOINTS.accessGrants,
      {
        params: {
          unreviewed: String(onlyUnreviewed),
          limit: SENSITIVE_RECORD_LIMITS.grantsPage,
        },
      }
    );
    return parseHealthScheduleResponse(
      emergencyAccessGrantListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load emergency access.");
  }
}

/** A reviewer may not review their own access. Requires `audit:read`. */
export async function reviewEmergencyAccess(
  grantId: string,
  request: { outcome: "JUSTIFIED" | "NOT_JUSTIFIED"; note: string }
): Promise<EmergencyAccessGrant> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      SENSITIVE_RECORD_ENDPOINTS.reviewGrant(grantId),
      request
    );
    return parseHealthScheduleResponse(
      emergencyAccessGrantSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not save the review.", {
      outcome: "outcome",
      note: "note",
    });
  }
}
