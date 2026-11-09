import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { SCHEDULE_ENDPOINTS } from "~/features/schedule-setup/config/schedule-setup";
import {
  appointmentTypeListSchema,
  appointmentTypeSchema,
  type AppointmentType,
} from "~/features/schedule-setup/schemas/schedule-response-schemas";
import { parseScheduleResponse } from "~/features/schedule-setup/services/parse-schedule-response";
import type { AppointmentTypeRequest } from "~/features/schedule-setup/utilities/schedule-requests";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";

export const APPOINTMENT_TYPE_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "appointment-types"] as const,
};

/** API request fields mapped to form fields, for validation messages. */
const APPOINTMENT_TYPE_FIELD_NAMES = {
  name: "name",
  durationMinutes: "durationMinutes",
  newPatientDurationMinutes: "newPatientDurationMinutes",
  bufferMinutes: "bufferMinutes",
  priceKobo: "priceNaira",
  modality: "modality",
  capacity: "capacity",
  minLeadMinutes: "minimumNoticeHours",
  maxAdvanceDays: "advanceBookingDays",
  dailyCap: "dailyLimit",
  overbookPercent: "overbookingPercent",
  prepNotes: "preparationNotes",
  resourceIds: "calendarIds",
};

/** Every appointment type, including switched-off ones. Requires `schedule:read`. */
export async function listAppointmentTypes(): Promise<AppointmentType[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      SCHEDULE_ENDPOINTS.appointmentTypes,
      { params: { includeInactive: "true" } }
    );
    return parseScheduleResponse(
      appointmentTypeListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the appointment types.");
  }
}

/** Requires `schedule:manage`. */
export async function createAppointmentType(
  request: AppointmentTypeRequest
): Promise<AppointmentType> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      SCHEDULE_ENDPOINTS.appointmentTypes,
      request
    );
    return parseScheduleResponse(
      appointmentTypeSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not add the appointment type.",
      APPOINTMENT_TYPE_FIELD_NAMES
    );
  }
}

/** Requires `schedule:manage`. The calendar list replaces the saved one. */
export async function updateAppointmentType(
  appointmentTypeId: string,
  request: AppointmentTypeRequest & { isActive: boolean }
): Promise<AppointmentType> {
  try {
    const response = await getHealthScheduleHttpClient().patch<unknown>(
      SCHEDULE_ENDPOINTS.appointmentType(appointmentTypeId),
      request
    );
    return parseScheduleResponse(
      appointmentTypeSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save the appointment type.",
      APPOINTMENT_TYPE_FIELD_NAMES
    );
  }
}
