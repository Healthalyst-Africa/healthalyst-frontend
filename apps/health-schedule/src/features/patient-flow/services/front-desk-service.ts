import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  PATIENT_FLOW_ENDPOINTS,
  PATIENT_SEARCH_CONFIGURATION,
} from "~/features/patient-flow/config/patient-flow";
import {
  dayBoardSchema,
  patientMatchSchema,
  patientSearchResultSchema,
  visitBoardSchema,
  visitSchema,
  type DayBoard,
  type PatientMatch,
  type Visit,
  type VisitBoard,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import type {
  CheckInRequest,
  QuickPatientRequest,
  UnknownPatientRequest,
} from "~/features/patient-flow/utilities/patient-flow-requests";
import { isPatientFlowSampleDataEnabled } from "~/features/patient-flow/config/sample-data";
import {
  checkInSamplePatient,
  getSampleDayBoard,
  getSampleVisitBoard,
  registerSampleQuickPatient,
  registerSampleUnknownPatient,
  searchSamplePatients,
} from "~/features/patient-flow/sample-data/sample-patient-flow";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export const FRONT_DESK_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "front-desk"] as const,
  dayBoard: (organizationId: string, branchId: string, date: string) =>
    [
      "health-schedule",
      organizationId,
      "front-desk",
      "day-board",
      branchId,
      date,
    ] as const,
  visitBoard: (organizationId: string, branchId: string) =>
    [
      "health-schedule",
      organizationId,
      "front-desk",
      "visits",
      branchId,
    ] as const,
  patientSearch: (organizationId: string, searchText: string) =>
    [
      "health-schedule",
      organizationId,
      "front-desk",
      "patients",
      searchText,
    ] as const,
};

/** The registration form's names for the API's fields. */
const QUICK_PATIENT_FIELD_NAMES = {
  firstName: "firstName",
  lastName: "lastName",
  sex: "sex",
  phone: "phone",
};

const UNKNOWN_PATIENT_FIELD_NAMES = {
  sex: "sex",
  ageYears: "approximateAge",
  label: "label",
};

const CHECK_IN_FIELD_NAMES = {
  queue: "queueTarget",
  "queue.kind": "queueTarget",
  "queue.departmentId": "queueTarget",
  "queue.resourceId": "queueTarget",
  note: "note",
};

/** Today's appointments at a branch. Requires `appointment:read`. */
export async function getDayBoard(
  branchId: string,
  date: string
): Promise<DayBoard> {
  if (isPatientFlowSampleDataEnabled()) return getSampleDayBoard();
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_FLOW_ENDPOINTS.dayBoard,
      { params: { branchId, date } }
    );
    return parseHealthScheduleResponse(
      dayBoardSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load today's appointments.");
  }
}

/** Everyone checked in and not yet finished. Requires `queue:read`. */
export async function getVisitBoard(branchId: string): Promise<VisitBoard> {
  if (isPatientFlowSampleDataEnabled()) return getSampleVisitBoard();
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_FLOW_ENDPOINTS.visitBoard,
      { params: { branchId } }
    );
    return parseHealthScheduleResponse(
      visitBoardSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the patients in the building."
    );
  }
}

/**
 * Patients matching a name (spelling and sound-alikes), phone, patient
 * number or folder number. Requires `patient:read`.
 */
export async function searchPatients(
  searchText: string
): Promise<PatientMatch[]> {
  if (isPatientFlowSampleDataEnabled()) return searchSamplePatients(searchText);
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_FLOW_ENDPOINTS.patients,
      {
        params: {
          q: searchText,
          limit: PATIENT_SEARCH_CONFIGURATION.resultLimit,
        },
      }
    );
    return parseHealthScheduleResponse(
      patientSearchResultSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not search for patients.");
  }
}

/** Name, sex and phone; the date of birth can follow. Requires `patient:create`. */
export async function registerQuickPatient(
  request: QuickPatientRequest & { id: string }
): Promise<PatientMatch> {
  if (isPatientFlowSampleDataEnabled())
    return registerSampleQuickPatient(request);
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_FLOW_ENDPOINTS.quickPatient,
      request
    );
    return parseHealthScheduleResponse(
      patientMatchSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not register the patient.",
      QUICK_PATIENT_FIELD_NAMES
    );
  }
}

/** An unidentified patient, completed later. Requires `patient:create`. */
export async function registerUnknownPatient(
  request: UnknownPatientRequest & { id: string }
): Promise<PatientMatch> {
  if (isPatientFlowSampleDataEnabled())
    return registerSampleUnknownPatient(request);
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_FLOW_ENDPOINTS.temporaryPatient,
      request
    );
    return parseHealthScheduleResponse(
      patientMatchSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not register the patient.",
      UNKNOWN_PATIENT_FIELD_NAMES
    );
  }
}

/** Opens a visit and puts the patient in their first queue. Requires `queue:check-in`. */
export async function checkInPatient(request: CheckInRequest): Promise<Visit> {
  if (isPatientFlowSampleDataEnabled()) return checkInSamplePatient(request);
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      PATIENT_FLOW_ENDPOINTS.checkIns,
      request
    );
    return parseHealthScheduleResponse(
      visitSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not check the patient in.",
      CHECK_IN_FIELD_NAMES
    );
  }
}
