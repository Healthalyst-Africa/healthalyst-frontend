import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { PATIENT_ENDPOINTS } from "~/features/patients/config/patients";
import {
  patientAllergiesSchema,
  patientCoverageListSchema,
  patientCoverageSchema,
  type PatientAllergies,
  type PatientCoverage,
} from "~/features/patients/schemas/patient-response-schemas";
import { toEntityTag } from "~/features/patients/utilities/patient-presentation";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

const COVERAGE_FIELD_NAMES = {
  payerType: "payerType",
  payerName: "payerName",
  planName: "planName",
  memberNumber: "memberNumber",
  relationship: "relationship",
  principalName: "principalName",
  employerName: "employerName",
  validFrom: "validFrom",
  validUntil: "validUntil",
};

/** Allergy status, active entries and history. Requires `patient:read`. */
export async function getAllergies(
  patientId: string
): Promise<PatientAllergies> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.allergies(patientId)
    );
    return parseHealthScheduleResponse(
      patientAllergiesSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the allergies.");
  }
}

/** Front desk (`patient:update`), nurses and doctors (`triage:record`). */
export async function recordAllergy(
  patientId: string,
  request: Record<string, unknown>
): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      PATIENT_ENDPOINTS.allergies(patientId),
      request
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not record the allergy.", {
      substance: "substance",
      category: "category",
      reaction: "reaction",
      severity: "severity",
      note: "note",
    });
  }
}

export async function recordNoKnownAllergies(patientId: string): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      PATIENT_ENDPOINTS.noKnownAllergies(patientId),
      {}
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not record no known allergies.");
  }
}

/** Resolved, or recorded by mistake: kept in the history. */
export async function endAllergy(
  patientId: string,
  allergyId: string,
  request: { status: string; reason: string }
): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      PATIENT_ENDPOINTS.endAllergy(patientId, allergyId),
      request
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not end the allergy.", {
      status: "status",
      reason: "reason",
    });
  }
}

/** Active cover first, primary first. Requires `patient:read`. */
export async function listCoverage(
  patientId: string
): Promise<PatientCoverage[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.coverage(patientId)
    );
    return parseHealthScheduleResponse(
      patientCoverageListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the cover.");
  }
}

/** Requires `patient:update`. */
export async function addCoverage(
  patientId: string,
  request: Record<string, unknown>
): Promise<PatientCoverage> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_ENDPOINTS.coverage(patientId),
      request
    );
    return parseHealthScheduleResponse(
      patientCoverageSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not add the cover.",
      COVERAGE_FIELD_NAMES
    );
  }
}

/**
 * Edits, makes primary or ends (`{ status: "ENDED" }`) a cover. Changing the
 * payer or card number resets eligibility. Requires `patient:update`.
 */
export async function updateCoverage({
  patientId,
  coverage,
  changes,
}: {
  patientId: string;
  coverage: PatientCoverage;
  changes: Record<string, unknown>;
}): Promise<PatientCoverage> {
  try {
    const response = await getHealthScheduleHttpClient().patch<unknown>(
      PATIENT_ENDPOINTS.coverageEntry(patientId, coverage.id),
      changes,
      { headers: { "If-Match": toEntityTag(coverage.version) } }
    );
    return parseHealthScheduleResponse(
      patientCoverageSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save the cover.",
      COVERAGE_FIELD_NAMES
    );
  }
}

/** What the payer said when asked. Requires `patient:update`. */
export async function recordEligibility(
  patientId: string,
  coverageId: string,
  request: Record<string, unknown>
): Promise<PatientCoverage> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_ENDPOINTS.eligibility(patientId, coverageId),
      request
    );
    return parseHealthScheduleResponse(
      patientCoverageSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not record the check.", {
      result: "result",
      reference: "reference",
      note: "note",
    });
  }
}
