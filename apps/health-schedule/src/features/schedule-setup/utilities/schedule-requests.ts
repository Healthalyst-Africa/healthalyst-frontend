import { APPOINTMENT_TYPE_DEFAULTS } from "~/features/schedule-setup/config/schedule-setup";
import type {
  AppointmentTypeFormValues,
  CreateCalendarFormValues,
  TimeOffFormValues,
} from "~/features/schedule-setup/schemas/schedule-form-schemas";
import type {
  AppointmentType,
  CalendarKind,
  Modality,
  TimeOffKind,
} from "~/features/schedule-setup/schemas/schedule-response-schemas";
import {
  toBranchDateTime,
  toEndOfBranchDay,
} from "~/features/schedule-setup/utilities/branch-time";
import {
  koboToNairaText,
  nairaTextToKobo,
} from "~/features/schedule-setup/utilities/naira-amount";

export type CreateCalendarRequest =
  | { kind: "PRACTITIONER"; memberId: string }
  | {
      kind: Exclude<CalendarKind, "PRACTITIONER">;
      branchId: string;
      name: string;
    };

export function toCreateCalendarRequest(
  values: CreateCalendarFormValues
): CreateCalendarRequest {
  return values.kind === "PRACTITIONER"
    ? { kind: "PRACTITIONER", memberId: values.memberId }
    : { kind: values.kind, branchId: values.branchId, name: values.name };
}

export type CreateTimeOffRequest = {
  resourceId?: string;
  branchId?: string;
  kind: TimeOffKind;
  startsAt: string;
  endsAt: string;
  reason?: string;
};

/** A whole-day period runs from the first day's midnight to the day after the last. */
export function toCreateTimeOffRequest(
  values: TimeOffFormValues
): CreateTimeOffRequest {
  return {
    ...(values.appliesTo === "calendar"
      ? { resourceId: values.calendarId }
      : { branchId: values.branchId }),
    kind: values.kind,
    startsAt: toBranchDateTime(
      values.startDate,
      values.allDay ? "00:00" : values.startTime
    ),
    endsAt: values.allDay
      ? toEndOfBranchDay(values.endDate)
      : toBranchDateTime(values.endDate, values.endTime),
    ...(values.reason && { reason: values.reason }),
  };
}

export type AppointmentTypeRequest = {
  name: string;
  durationMinutes: number;
  newPatientDurationMinutes: number | null;
  bufferMinutes: number;
  priceKobo: number | null;
  modality: Modality;
  capacity: number;
  minLeadMinutes: number;
  maxAdvanceDays: number;
  dailyCap: number | null;
  overbookPercent: number;
  prepNotes: string | null;
  resourceIds: string[];
};

function optionalNumber(text: string): number | null {
  return text === "" ? null : Number(text);
}

export function toAppointmentTypeRequest(
  values: AppointmentTypeFormValues
): AppointmentTypeRequest {
  return {
    name: values.name,
    durationMinutes: Number(values.durationMinutes),
    newPatientDurationMinutes: optionalNumber(values.newPatientDurationMinutes),
    bufferMinutes: Number(values.bufferMinutes),
    priceKobo: nairaTextToKobo(values.priceNaira),
    modality: values.modality,
    capacity: Number(values.capacity),
    minLeadMinutes: Number(values.minimumNoticeHours) * 60,
    maxAdvanceDays: Number(values.advanceBookingDays),
    dailyCap: optionalNumber(values.dailyLimit),
    overbookPercent: Number(values.overbookingPercent),
    prepNotes: values.preparationNotes || null,
    resourceIds: values.calendarIds,
  };
}

/** Form values for editing an appointment type, or the defaults for a new one. */
export function toAppointmentTypeFormValues(
  appointmentType: AppointmentType | null
): AppointmentTypeFormValues {
  if (!appointmentType) {
    return {
      name: "",
      durationMinutes: APPOINTMENT_TYPE_DEFAULTS.durationMinutes,
      newPatientDurationMinutes: "",
      bufferMinutes: APPOINTMENT_TYPE_DEFAULTS.bufferMinutes,
      priceNaira: "",
      modality: APPOINTMENT_TYPE_DEFAULTS.modality,
      capacity: APPOINTMENT_TYPE_DEFAULTS.capacity,
      minimumNoticeHours: APPOINTMENT_TYPE_DEFAULTS.minimumNoticeHours,
      advanceBookingDays: APPOINTMENT_TYPE_DEFAULTS.advanceBookingDays,
      dailyLimit: "",
      overbookingPercent: APPOINTMENT_TYPE_DEFAULTS.overbookingPercent,
      preparationNotes: "",
      calendarIds: [],
      isActive: true,
    };
  }
  return {
    name: appointmentType.name,
    durationMinutes: String(appointmentType.durationMinutes),
    newPatientDurationMinutes:
      appointmentType.newPatientDurationMinutes === null
        ? ""
        : String(appointmentType.newPatientDurationMinutes),
    bufferMinutes: String(appointmentType.bufferMinutes),
    priceNaira: koboToNairaText(appointmentType.priceKobo),
    modality: appointmentType.modality,
    capacity: String(appointmentType.capacity),
    // Notice is edited in whole hours; the API stores minutes.
    minimumNoticeHours: String(Math.round(appointmentType.minLeadMinutes / 60)),
    advanceBookingDays: String(appointmentType.maxAdvanceDays),
    dailyLimit:
      appointmentType.dailyCap === null ? "" : String(appointmentType.dailyCap),
    overbookingPercent: String(appointmentType.overbookPercent),
    preparationNotes: appointmentType.prepNotes ?? "",
    calendarIds: appointmentType.resourceIds,
    isActive: appointmentType.isActive,
  };
}
