import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { isPatientFlowSampleDataEnabled } from "~/features/patient-flow/config/sample-data";
import { TRIAGE_ENDPOINTS } from "~/features/patient-flow/config/triage";
import {
  getSamplePatientRecord,
  recordSampleTriage,
} from "~/features/patient-flow/sample-data/sample-patient-flow";
import {
  patientRecordSchema,
  triageAssessmentSchema,
  type PatientRecord,
  type TriageAssessment,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import type { TriageRequest } from "~/features/patient-flow/utilities/triage-assessment";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export const TRIAGE_QUERY_KEYS = {
  patientRecord: (organizationId: string, patientId: string) =>
    ["health-schedule", organizationId, "patients", patientId] as const,
};

/** The patient's date of birth, for whether adult danger signs apply. Requires `patient:read`. */
export async function getPatientRecord(
  patientId: string
): Promise<PatientRecord> {
  if (isPatientFlowSampleDataEnabled())
    return getSamplePatientRecord(patientId);
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      TRIAGE_ENDPOINTS.patient(patientId)
    );
    return parseHealthScheduleResponse(
      patientRecordSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the patient's record.");
  }
}

/**
 * Saves the vitals and band. The band sets the patient's place in every
 * queue they are in. Requires `triage:record`; a lower band against red
 * needs `triage:override` and a reason.
 */
export async function recordTriage(
  visitId: string,
  request: TriageRequest
): Promise<TriageAssessment> {
  if (isPatientFlowSampleDataEnabled()) {
    return recordSampleTriage(visitId, request);
  }
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
