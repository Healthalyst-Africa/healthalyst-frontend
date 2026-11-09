import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { SCHEDULE_ENDPOINTS } from "~/features/schedule-setup/config/schedule-setup";
import {
  timeOffEntrySchema,
  timeOffListSchema,
  type TimeOffEntry,
} from "~/features/schedule-setup/schemas/schedule-response-schemas";
import { parseScheduleResponse } from "~/features/schedule-setup/services/parse-schedule-response";
import type { CreateTimeOffRequest } from "~/features/schedule-setup/utilities/schedule-requests";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";

export const TIME_OFF_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "time-off"] as const,
  period: (organizationId: string, from: string, to: string) =>
    ["health-schedule", organizationId, "time-off", from, to] as const,
};

const TIME_OFF_FIELD_NAMES = {
  resourceId: "calendarId",
  branchId: "branchId",
  kind: "kind",
  startsAt: "startDate",
  endsAt: "endDate",
  reason: "reason",
};

/** Time off overlapping a period. Requires `schedule:read`. */
export async function listTimeOff(period: {
  from: string;
  to: string;
}): Promise<TimeOffEntry[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      SCHEDULE_ENDPOINTS.timeOff,
      { params: period }
    );
    return parseScheduleResponse(
      timeOffListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load time off.");
  }
}

/** Requires `schedule:manage`. Free slots that overlap it disappear. */
export async function createTimeOff(
  request: CreateTimeOffRequest
): Promise<TimeOffEntry> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      SCHEDULE_ENDPOINTS.timeOff,
      request
    );
    return parseScheduleResponse(
      timeOffEntrySchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not add the time off.",
      TIME_OFF_FIELD_NAMES
    );
  }
}

/** Requires `schedule:manage`. */
export async function removeTimeOff(timeOffIdentifier: string): Promise<void> {
  try {
    await getHealthScheduleHttpClient().delete(
      SCHEDULE_ENDPOINTS.timeOffEntry(timeOffIdentifier)
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not remove the time off.");
  }
}
