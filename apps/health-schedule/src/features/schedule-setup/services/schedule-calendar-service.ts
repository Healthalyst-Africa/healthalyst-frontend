import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import {
  SCHEDULE_ENDPOINTS,
  SCHEDULE_FIELD_LIMITS,
  STAFF_ENDPOINT,
} from "~/features/schedule-setup/config/schedule-setup";
import {
  scheduleCalendarListSchema,
  scheduleCalendarSchema,
  staffMemberSummaryListSchema,
  type ScheduleCalendar,
  type StaffMemberSummary,
} from "~/features/schedule-setup/schemas/schedule-response-schemas";
import { parseScheduleResponse } from "~/features/schedule-setup/services/parse-schedule-response";
import type { CreateCalendarRequest } from "~/features/schedule-setup/utilities/schedule-requests";
import type { AvailabilityRuleRequest } from "~/features/schedule-setup/utilities/weekly-hours";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";

export const SCHEDULE_CALENDAR_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "schedule-calendars"] as const,
  practitionerCandidates: (organizationId: string) =>
    ["platform", organizationId, "staff", "active"] as const,
};

/** Form fields that API validation paths map to. */
const CALENDAR_FIELD_NAMES = {
  name: "name",
  memberId: "memberId",
  branchId: "branchId",
};

/** Every calendar, including paused ones. Requires `schedule:read`. */
export async function listScheduleCalendars(): Promise<ScheduleCalendar[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      SCHEDULE_ENDPOINTS.calendars,
      { params: { includeInactive: "true" } }
    );
    return parseScheduleResponse(
      scheduleCalendarListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the calendars.");
  }
}

/** Requires `schedule:manage`. */
export async function createScheduleCalendar(
  request: CreateCalendarRequest
): Promise<ScheduleCalendar> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      SCHEDULE_ENDPOINTS.calendars,
      request
    );
    return parseScheduleResponse(
      scheduleCalendarSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not add the calendar.",
      CALENDAR_FIELD_NAMES
    );
  }
}

/** Rename, pause or resume a calendar. Requires `schedule:manage`. */
export async function updateScheduleCalendar(
  calendarId: string,
  changes: { name?: string; isActive?: boolean }
): Promise<ScheduleCalendar> {
  try {
    const response = await getHealthScheduleHttpClient().patch<unknown>(
      SCHEDULE_ENDPOINTS.calendar(calendarId),
      changes
    );
    return parseScheduleResponse(
      scheduleCalendarSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save the calendar.",
      CALENDAR_FIELD_NAMES
    );
  }
}

/** Replaces every weekly hours rule on the calendar. Requires `schedule:manage`. */
export async function replaceCalendarHours(
  calendarId: string,
  rules: AvailabilityRuleRequest[]
): Promise<ScheduleCalendar> {
  try {
    const response = await getHealthScheduleHttpClient().put<unknown>(
      SCHEDULE_ENDPOINTS.calendarAvailability(calendarId),
      { rules }
    );
    return parseScheduleResponse(
      scheduleCalendarSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not save the weekly hours.");
  }
}

/**
 * Active staff who could have a practitioner calendar, from the Platform API.
 * Requires `staff:read`. Loads one page of up to 100 people.
 */
export async function listPractitionerCandidates(): Promise<{
  members: StaffMemberSummary[];
  hasMore: boolean;
}> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      STAFF_ENDPOINT,
      {
        params: {
          status: "ACTIVE",
          limit: SCHEDULE_FIELD_LIMITS.staffPickerLimit,
        },
      }
    );
    const staffList = parseScheduleResponse(
      staffMemberSummaryListSchema,
      response.data,
      response.status
    );
    return { members: staffList.data, hasMore: staffList.page.hasMore };
  } catch (error) {
    throw toPlatformApiError(error, "We could not load your staff.");
  }
}
