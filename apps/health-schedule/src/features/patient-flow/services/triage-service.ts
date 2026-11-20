import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { TRIAGE_ENDPOINTS } from "~/features/patient-flow/config/triage";
import {
  triageAssessmentSchema,
  triageHistorySchema,
  type TriageRecord,
  type TriageAssessment,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import type { TriageRequest } from "~/features/patient-flow/utilities/triage-assessment";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

/**
 * Saves the vitals and band. The band sets the patient's place in every
 * queue they are in. Requires `triage:record`; a lower band against red
 * needs `triage:override` and a reason.
 */
export async function recordTriage(
  visitId: string,
  request: TriageRequest
): Promise<TriageAssessment> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      TRIAGE_ENDPOINTS.triage(visitId),
      request
    );
    return parseHealthScheduleResponse(
      triageAssessmentSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not save the vitals.");
  }
}

/**
 * The visit's triage assessments, newest first: the first one counts.
 * Requires `triage:record`; a restricted record answers `RECORD_RESTRICTED`.
 */
export async function getTriageHistory(
  visitId: string
): Promise<TriageRecord[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      TRIAGE_ENDPOINTS.triage(visitId)
    );
    return parseHealthScheduleResponse(
      triageHistorySchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the earlier triage.");
  }
}
