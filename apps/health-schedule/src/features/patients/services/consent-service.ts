import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { PATIENT_ENDPOINTS } from "~/features/patients/config/patients";
import {
  patientConsentsSchema,
  type PatientConsents,
} from "~/features/patients/schemas/patient-response-schemas";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

/** Which consents are given now, and every change, newest first. */
export async function getConsents(patientId: string): Promise<PatientConsents> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.consents(patientId)
    );
    return parseHealthScheduleResponse(
      patientConsentsSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the consents.");
  }
}

/** Requires `patient:consent`. */
export async function recordConsent(
  patientId: string,
  request: Record<string, unknown>
): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      PATIENT_ENDPOINTS.consents(patientId),
      request
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not record the consent.", {
      method: "method",
      language: "language",
      signedBy: "signedBy",
      guardianRelationshipId: "guardianRelationshipId",
      signerName: "signerName",
      witnessName: "witnessName",
      notes: "notes",
    });
  }
}

/** Kept in the history. Requires `patient:consent`. */
export async function revokeConsent(
  patientId: string,
  consentId: string,
  reason: string
): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      PATIENT_ENDPOINTS.revokeConsent(patientId, consentId),
      { reason }
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not revoke the consent.", {
      reason: "reason",
    });
  }
}
