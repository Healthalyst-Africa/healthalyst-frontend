import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  INCOMPLETE_PATIENT_LIMIT,
  PATIENT_ENDPOINTS,
} from "~/features/patients/config/patients";
import {
  duplicateCandidatesSchema,
  patientDetailSchema,
  patientMatchListSchema,
  patientSchema,
  type DuplicateCandidate,
  type Patient,
  type PatientDetail,
  type PatientMatch,
} from "~/features/patients/schemas/patient-response-schemas";
import type { RegistrationRequest } from "~/features/patients/utilities/patient-requests";
import { toEntityTag } from "~/features/patients/utilities/patient-presentation";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export const PATIENT_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "patients"] as const,
  search: (organizationId: string, searchText: string) =>
    [
      "health-schedule",
      organizationId,
      "patients",
      "search",
      searchText,
    ] as const,
  incomplete: (organizationId: string) =>
    ["health-schedule", organizationId, "patients", "incomplete"] as const,
  detail: (organizationId: string, patientId: string) =>
    ["health-schedule", organizationId, "patients", patientId] as const,
  allergies: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "patients",
      patientId,
      "allergies",
    ] as const,
  coverage: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "patients",
      patientId,
      "coverage",
    ] as const,
  relationships: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "patients",
      patientId,
      "relationships",
    ] as const,
  consents: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "patients",
      patientId,
      "consents",
    ] as const,
  documents: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "patients",
      patientId,
      "documents",
    ] as const,
  duplicates: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "patients",
      patientId,
      "duplicates",
    ] as const,
  merges: (organizationId: string) =>
    ["health-schedule", organizationId, "patients", "merges"] as const,
  mergePreview: (
    organizationId: string,
    survivorId: string,
    mergedId: string
  ) =>
    [
      "health-schedule",
      organizationId,
      "patients",
      "merge-preview",
      survivorId,
      mergedId,
    ] as const,
};

/** The form's names for the API's registration fields. */
const PATIENT_FIELD_NAMES = {
  firstName: "firstName",
  middleName: "middleName",
  lastName: "lastName",
  sex: "sex",
  dateOfBirth: "dateOfBirth",
  ageYears: "ageYears",
  phone: "phone",
  email: "email",
  addressLine: "addressLine",
  city: "city",
  stateCode: "stateCode",
  folderNumber: "folderNumber",
  nin: "nin",
  preferredLanguage: "preferredLanguage",
  contactChannel: "contactChannel",
};

/** Patients by name, phone, patient or folder number. Requires `patient:read`. */
export async function searchPatientRecords(
  searchText: string
): Promise<PatientMatch[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.patients,
      { params: { q: searchText, limit: 20 } }
    );
    return parseHealthScheduleResponse(
      patientMatchListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not search for patients.");
  }
}

/** Records with required details missing, newest first. Requires `patient:read`. */
export async function listIncompletePatients(): Promise<PatientMatch[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.patients,
      { params: { incomplete: "true", limit: INCOMPLETE_PATIENT_LIMIT } }
    );
    return parseHealthScheduleResponse(
      patientMatchListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the records to complete."
    );
  }
}

/** A patient's record with allergies and primary cover. Requires `patient:read`. */
export async function getPatientDetail(
  patientId: string
): Promise<PatientDetail> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_ENDPOINTS.patient(patientId)
    );
    return parseHealthScheduleResponse(
      patientDetailSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not open this patient's record.");
  }
}

/**
 * Registers a patient. The identifier is chosen here, so a retried request
 * returns the same patient. Requires `patient:create`.
 */
export async function registerPatient({
  kind,
  request,
}: {
  kind: "full" | "quick";
  request: RegistrationRequest;
}): Promise<Patient> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      kind === "full"
        ? PATIENT_ENDPOINTS.patients
        : PATIENT_ENDPOINTS.quickPatient,
      request
    );
    return parseHealthScheduleResponse(
      patientSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not register the patient.",
      PATIENT_FIELD_NAMES
    );
  }
}

/** Registered patients who may be the same person. Requires `patient:create`. */
export async function checkForDuplicates(
  request: Record<string, unknown>
): Promise<DuplicateCandidate[]> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_ENDPOINTS.duplicateCheck,
      request
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

/**
 * Saves changed registration details. Refused with `VERSION_CONFLICT` when
 * someone else saved since the record was opened. Requires `patient:update`.
 */
export async function updatePatient({
  patientId,
  version,
  changes,
}: {
  patientId: string;
  version: number;
  changes: Record<string, unknown>;
}): Promise<Patient> {
  try {
    const response = await getHealthScheduleHttpClient().patch<unknown>(
      PATIENT_ENDPOINTS.patient(patientId),
      changes,
      { headers: { "If-Match": toEntityTag(version) } }
    );
    return parseHealthScheduleResponse(
      patientSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save the patient's details.",
      PATIENT_FIELD_NAMES
    );
  }
}
