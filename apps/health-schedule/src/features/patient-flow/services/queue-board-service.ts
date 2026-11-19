import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { PATIENT_FLOW_ENDPOINTS } from "~/features/patient-flow/config/patient-flow";
import {
  queueEntryListSchema,
  queueEntrySchema,
  queueSummaryListSchema,
  visitDetailSchema,
  type QueueEntry,
  type VisitDetail,
  type QueueSummary,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import type { TransferRequest } from "~/features/patient-flow/utilities/patient-flow-requests";
import type { QueueTarget } from "~/features/patient-flow/utilities/queue-targets";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export const QUEUE_BOARD_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "queues"] as const,
  summaries: (organizationId: string, branchId: string) =>
    [
      "health-schedule",
      organizationId,
      "queues",
      "summaries",
      branchId,
    ] as const,
  entries: (organizationId: string, branchId: string, queueValue: string) =>
    [
      "health-schedule",
      organizationId,
      "queues",
      "entries",
      branchId,
      queueValue,
    ] as const,
};

const TRANSFER_FIELD_NAMES = {
  to: "queueTarget",
  "to.kind": "queueTarget",
  "to.departmentId": "queueTarget",
  "to.resourceId": "queueTarget",
  note: "note",
};

/** The API's query for one queue. A doctor's queue includes "next free doctor". */
function toQueueParameters(target: QueueTarget) {
  return {
    kind: target.kind,
    ...(target.kind === "DEPARTMENT"
      ? { departmentId: target.departmentId }
      : {}),
    ...(target.kind === "CONSULTATION" && target.resourceId
      ? { resourceId: target.resourceId, includeUnassigned: true }
      : {}),
  };
}

/** Each queue with someone in it, with counts. Requires `queue:read`. */
export async function listQueueSummaries(
  branchId: string
): Promise<QueueSummary[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_FLOW_ENDPOINTS.queues,
      { params: { branchId } }
    );
    return parseHealthScheduleResponse(
      queueSummaryListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the queues.");
  }
}

/** One queue in calling order. Requires `queue:read`. */
export async function listQueueEntries(
  branchId: string,
  target: QueueTarget
): Promise<QueueEntry[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_FLOW_ENDPOINTS.queueEntries,
      { params: { branchId, ...toQueueParameters(target) } }
    );
    return parseHealthScheduleResponse(
      queueEntryListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load this queue.");
  }
}

async function postQueueAction(
  path: string,
  body: object,
  fallbackMessage: string,
  fieldNames?: Record<string, string>
): Promise<QueueEntry> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      path,
      body
    );
    return parseHealthScheduleResponse(
      queueEntrySchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, fallbackMessage, fieldNames);
  }
}

/** Calls the first waiting patient. Requires `queue:manage`. */
export function callNextPatient(
  branchId: string,
  target: QueueTarget
): Promise<QueueEntry> {
  return postQueueAction(
    PATIENT_FLOW_ENDPOINTS.callNext,
    { branchId, ...toQueueParameters(target) },
    "We could not call the next patient."
  );
}

/** Calls this patient, or calls them again. Requires `queue:manage`. */
export function callPatient(entryId: string): Promise<QueueEntry> {
  return postQueueAction(
    PATIENT_FLOW_ENDPOINTS.callEntry(entryId),
    {},
    "We could not call the patient."
  );
}

/** The patient is now with staff. Requires `queue:manage`. */
export function startSeeingPatient(entryId: string): Promise<QueueEntry> {
  return postQueueAction(
    PATIENT_FLOW_ENDPOINTS.startEntry(entryId),
    {},
    "We could not mark the patient as seen."
  );
}

/** A called patient did not come: back to waiting. Requires `queue:manage`. */
export function skipPatient(entryId: string): Promise<QueueEntry> {
  return postQueueAction(
    PATIENT_FLOW_ENDPOINTS.skipEntry(entryId),
    {},
    "We could not skip the patient."
  );
}

/** To the next queue, keeping the patient's priority. Requires `queue:manage`. */
export function sendPatientOn(
  entryId: string,
  request: TransferRequest
): Promise<QueueEntry> {
  return postQueueAction(
    PATIENT_FLOW_ENDPOINTS.transferEntry(entryId),
    request,
    "We could not send the patient on.",
    TRANSFER_FIELD_NAMES
  );
}

/** Ends the visit: the patient leaves every queue. Requires `queue:manage`. */
export async function finishVisit(visitId: string): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      PATIENT_FLOW_ENDPOINTS.completeVisit(visitId),
      {}
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not finish the visit.");
  }
}

/** A visit and every queue it went through. Requires `queue:read`. */
export async function getVisitDetail(visitId: string): Promise<VisitDetail> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      PATIENT_FLOW_ENDPOINTS.visit(visitId)
    );
    return parseHealthScheduleResponse(
      visitDetailSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the visit.");
  }
}

/** The patient left before being seen: the visit ends. Requires `queue:manage`. */
export async function recordLeftWithoutBeingSeen(
  visitId: string,
  reason: string | undefined
): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      PATIENT_FLOW_ENDPOINTS.visitLeft(visitId),
      reason ? { reason } : {}
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not record that the patient left.",
      {
        reason: "reason",
      }
    );
  }
}
