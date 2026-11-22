import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { PATIENT_ENDPOINTS } from "~/features/patients/config/patients";
import {
  patientRelationshipListSchema,
  patientRelationshipSchema,
  type PatientRelationship,
} from "~/features/patients/schemas/patient-response-schemas";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

/** Family, guardians and contacts, from this patient's point of view. */
export async function listRelationships(
  patientId: string
): Promise<PatientRelationship[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.relationships(patientId)
    );
    return parseHealthScheduleResponse(
      patientRelationshipListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load family and contacts.");
  }
}

/** Requires `patient:update`. */
export async function addRelationship(
  patientId: string,
  request: Record<string, unknown>
): Promise<PatientRelationship> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_ENDPOINTS.relationships(patientId),
      request
    );
    return parseHealthScheduleResponse(
      patientRelationshipSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not add the link.", {
      type: "type",
      relatedPatientId: "relatedPatientId",
      "contact.name": "contactName",
      "contact.phone": "contactPhone",
    });
  }
}

/** Kept in the history. Requires `patient:update`. */
export async function endRelationship(
  patientId: string,
  relationshipId: string
): Promise<void> {
  try {
    await getHealthScheduleHttpClient().delete(
      PATIENT_ENDPOINTS.relationship(patientId, relationshipId)
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not end the link.");
  }
}
