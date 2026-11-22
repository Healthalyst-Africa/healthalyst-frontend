import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { APPOINTMENT_ENDPOINTS } from "~/features/appointments/config/appointments";
import {
  appointmentListSchema,
  appointmentSchema,
  dayBoardSchema,
  slotListSchema,
  type Appointment,
  type DayBoard,
  type Slot,
} from "~/features/appointments/schemas/appointment-response-schemas";
import {
  withoutBlankNotes,
  type BookingRequest,
  type CancelRequest,
  type HoldRequest,
  type RescheduleRequest,
  type SlotSearch,
} from "~/features/appointments/utilities/appointment-requests";
import { toEntityTag } from "~/features/patients/utilities/patient-presentation";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export const APPOINTMENT_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "appointments"] as const,
  slots: (organizationId: string, search: SlotSearch) =>
    [
      "health-schedule",
      organizationId,
      "appointments",
      "slots",
      search,
    ] as const,
  dayBoard: (organizationId: string, branchId: string, date: string) =>
    [
      "health-schedule",
      organizationId,
      "appointments",
      "day-board",
      branchId,
      date,
    ] as const,
  patientAppointments: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "appointments",
      "patient",
      patientId,
    ] as const,
};

/** Free times of an appointment type at a branch. Requires `schedule:read`. */
export async function listSlots(search: SlotSearch): Promise<Slot[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      APPOINTMENT_ENDPOINTS.slots,
      { params: search }
    );
    return parseHealthScheduleResponse(
      slotListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the free times.");
  }
}

/**
 * Keeps a time for five minutes so another desk cannot take it. A retry
 * with the same identifier returns the same hold. Requires `appointment:book`.
 */
export async function holdSlot(request: HoldRequest): Promise<Appointment> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      APPOINTMENT_ENDPOINTS.holds,
      request
    );
    return parseHealthScheduleResponse(
      appointmentSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not keep that time for you.");
  }
}

/** Gives back a held time that will not be booked. */
export async function releaseHold(holdId: string): Promise<void> {
  try {
    await getHealthScheduleHttpClient().delete(
      APPOINTMENT_ENDPOINTS.hold(holdId)
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not give the time back.");
  }
}

/** Books a held time for a patient. Requires `appointment:book`. */
export async function bookAppointment(
  request: BookingRequest
): Promise<Appointment> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      APPOINTMENT_ENDPOINTS.appointments,
      withoutBlankNotes(request)
    );
    return parseHealthScheduleResponse(
      appointmentSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not book the appointment.", {
      notes: "notes",
    });
  }
}

/** A patient's appointments, up to 200. Requires `appointment:read`. */
export async function listPatientAppointments(
  patientId: string
): Promise<Appointment[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      APPOINTMENT_ENDPOINTS.appointments,
      { params: { patientId } }
    );
    return parseHealthScheduleResponse(
      appointmentListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the patient's appointments."
    );
  }
}

/**
 * Moves a booking to a newly held time. Refused with `VERSION_CONFLICT`
 * when someone changed it since it was opened. Requires `appointment:book`.
 */
export async function rescheduleAppointment({
  appointmentId,
  version,
  ...changes
}: RescheduleRequest): Promise<Appointment> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      APPOINTMENT_ENDPOINTS.reschedule(appointmentId),
      changes,
      { headers: { "If-Match": toEntityTag(version) } }
    );
    return parseHealthScheduleResponse(
      appointmentSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not move the appointment.");
  }
}

/** Cancels a booking and frees its time. Requires `appointment:book`. */
export async function cancelAppointment({
  appointmentId,
  ...request
}: CancelRequest): Promise<Appointment> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      APPOINTMENT_ENDPOINTS.cancel(appointmentId),
      request
    );
    return parseHealthScheduleResponse(
      appointmentSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not cancel the appointment.", {
      reason: "reason",
      cancelledBy: "cancelledBy",
    });
  }
}

/** Records that the patient did not come, once the time has started. */
export async function recordNoShow(
  appointmentId: string
): Promise<Appointment> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      APPOINTMENT_ENDPOINTS.noShow(appointmentId),
      {}
    );
    return parseHealthScheduleResponse(
      appointmentSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not record that the patient did not come."
    );
  }
}

/** A branch's day, calendar by calendar. Requires `appointment:read`. */
export async function getDayBoard(
  branchId: string,
  date: string
): Promise<DayBoard> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      APPOINTMENT_ENDPOINTS.dayBoard,
      { params: { branchId, date } }
    );
    return parseHealthScheduleResponse(
      dayBoardSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the day's appointments."
    );
  }
}
