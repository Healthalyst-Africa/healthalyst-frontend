import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { APPOINTMENT_ENDPOINTS } from "~/features/appointments/config/appointments";
import {
  appointmentSchema,
  waitlistEntrySchema,
  waitlistSchema,
  type Appointment,
  type WaitlistEntry,
} from "~/features/appointments/schemas/appointment-response-schemas";
import {
  withoutBlankNotes,
  type WaitlistRequest,
} from "~/features/appointments/utilities/appointment-requests";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export const WAITLIST_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "waitlist"] as const,
  branch: (organizationId: string, branchId: string) =>
    ["health-schedule", organizationId, "waitlist", branchId] as const,
};

const WAITLIST_FIELD_NAMES = {
  fromDate: "fromDate",
  toDate: "toDate",
  timeOfDay: "timeOfDay",
  notes: "notes",
};

/**
 * Puts a patient on the waitlist for an appointment type: one entry per
 * patient and type. Requires `appointment:book`.
 */
export async function addToWaitlist(
  request: WaitlistRequest
): Promise<WaitlistEntry> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      APPOINTMENT_ENDPOINTS.waitlist,
      withoutBlankNotes(request)
    );
    return parseHealthScheduleResponse(
      waitlistEntrySchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not add the patient to the waitlist.",
      WAITLIST_FIELD_NAMES
    );
  }
}

/** Patients still waiting at a branch, longest waiting first. */
export async function listWaitlist(branchId: string): Promise<WaitlistEntry[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      APPOINTMENT_ENDPOINTS.waitlist,
      { params: { branchId, status: "WAITING" } }
    );
    return parseHealthScheduleResponse(
      waitlistSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the waitlist.");
  }
}

/** Books a waiting patient into a held time. Requires `appointment:book`. */
export async function bookFromWaitlist({
  entryId,
  holdId,
}: {
  entryId: string;
  holdId: string;
}): Promise<Appointment> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      APPOINTMENT_ENDPOINTS.bookFromWaitlist(entryId),
      { holdId }
    );
    return parseHealthScheduleResponse(
      appointmentSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not book the waiting patient.");
  }
}

/** Takes a patient off the waitlist, with a reason. */
export async function removeFromWaitlist({
  entryId,
  reason,
}: {
  entryId: string;
  reason: string;
}): Promise<void> {
  try {
    await getHealthScheduleHttpClient().post(
      APPOINTMENT_ENDPOINTS.removeFromWaitlist(entryId),
      { reason }
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not take the patient off the waitlist.",
      { reason: "reason" }
    );
  }
}
