import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  CLINICAL_RECORD_ENDPOINTS,
  CLINICAL_RECORD_LIMITS,
} from "~/features/clinical-record/config/clinical-record";
import {
  diagnosisListSchema,
  problemListSchema,
  problemSchema,
  type Diagnosis,
  type Problem,
} from "~/features/clinical-record/schemas/clinical-record-response-schemas";
import { toEntityTag } from "~/features/patients/utilities/patient-presentation";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export type CreateProblemRequest = {
  id: string;
  /** An ICD-11 code from the diagnosis search, or `title` in words. */
  code?: string;
  title?: string;
  onsetDate?: string;
  notes?: string;
  visitId?: string;
  noteId?: string;
};

export type ProblemChanges = {
  status?: "ACTIVE" | "RESOLVED";
  onsetDate?: string | null;
  resolvedDate?: string | null;
  notes?: string | null;
};

const PROBLEM_FIELD_NAMES = {
  code: "code",
  title: "title",
  onsetDate: "onsetDate",
  notes: "notes",
};

/**
 * ICD-11 diagnoses that can be recorded. Codes and titles are shown
 * exactly as returned, as the WHO licence requires. Requires `note:read`.
 */
export async function searchDiagnoses(
  searchText: string
): Promise<Diagnosis[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      CLINICAL_RECORD_ENDPOINTS.diagnoses,
      {
        params: {
          q: searchText,
          limit: CLINICAL_RECORD_LIMITS.diagnosisResults,
        },
      }
    );
    return parseHealthScheduleResponse(
      diagnosisListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not search the diagnoses.");
  }
}

/** Active first, then resolved; with entries marked entered in error. */
export async function listProblems(patientId: string): Promise<Problem[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      CLINICAL_RECORD_ENDPOINTS.problems(patientId),
      { params: { status: "ALL" } }
    );
    return parseHealthScheduleResponse(
      problemListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the problem list.");
  }
}

/** Requires `note:write`. An already active code is refused. */
export async function createProblem(
  patientId: string,
  request: CreateProblemRequest
): Promise<Problem> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      CLINICAL_RECORD_ENDPOINTS.problems(patientId),
      request
    );
    return parseHealthScheduleResponse(
      problemSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not add the problem.",
      PROBLEM_FIELD_NAMES
    );
  }
}

/** Resolve, reopen or change dates and notes. Requires `note:write`. */
export async function updateProblem(
  problem: Pick<Problem, "id" | "patientId" | "version">,
  changes: ProblemChanges
): Promise<Problem> {
  try {
    const response = await getHealthScheduleHttpClient().patch<unknown>(
      CLINICAL_RECORD_ENDPOINTS.problem(problem.patientId, problem.id),
      changes,
      { headers: { "If-Match": toEntityTag(problem.version) } }
    );
    return parseHealthScheduleResponse(
      problemSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not save the problem.");
  }
}

/** Keeps the entry, struck through, with the reason. Requires `note:write`. */
export async function markProblemEnteredInError(
  problem: Pick<Problem, "id" | "patientId">,
  reason: string
): Promise<Problem> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      CLINICAL_RECORD_ENDPOINTS.problemEnteredInError(
        problem.patientId,
        problem.id
      ),
      { reason }
    );
    return parseHealthScheduleResponse(
      problemSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not mark the problem.");
  }
}
