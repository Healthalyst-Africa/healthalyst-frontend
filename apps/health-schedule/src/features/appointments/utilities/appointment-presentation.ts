import type { StatusTone } from "@healthalyst/ui/types/status-tone";
import { APPOINTMENT_STATUS_PRESENTATION } from "~/features/appointments/config/appointments";
import type {
  Appointment,
  DayBoardCalendar,
} from "~/features/appointments/schemas/appointment-response-schemas";
import {
  describeBranchClockTime,
  describeTimeOfDay,
} from "~/shared/time/branch-time";

/** Plain words for the refusals the desk can do something about. */
const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: "Someone else just booked that time. Choose another time.",
  SLOT_NOT_OPEN: "That time is no longer free. Choose another time.",
  SLOT_IN_PAST: "That time has already passed. Choose a later time.",
  OUTSIDE_BOOKING_WINDOW:
    "That time is too soon or too far ahead for this appointment type. Choose another time.",
  DAILY_CAP_REACHED:
    "This appointment type is fully booked that day. Choose another day.",
  TYPE_NOT_OFFERED:
    "That calendar does not offer this appointment type. Choose another time.",
  HOLD_EXPIRED:
    "The five minutes ran out and the time was given back. Choose a time again.",
  HOLD_NOT_FOUND: "The time was given back. Choose a time again.",
  PATIENT_MERGED:
    "This record was merged into another one. Open the patient again and book from there.",
  VERSION_CONFLICT:
    "Someone changed this appointment since you opened it. Close this and open it again.",
  APPOINTMENT_NOT_BOOKED:
    "This appointment is no longer booked, so it cannot be changed.",
  INVALID_STATUS_TRANSITION: "This appointment cannot be changed any more.",
  WAITLIST_EXISTS:
    "The patient is already on the waitlist for this appointment type.",
  WAITLIST_NOT_WAITING: "The patient is no longer waiting.",
  WAITLIST_SLOT_MISMATCH:
    "That time does not match what the patient is waiting for. Choose another time.",
};

/** Codes after which the free times must be loaded again. */
const SLOT_REFRESH_CODES = new Set([
  "SLOT_TAKEN",
  "SLOT_NOT_OPEN",
  "SLOT_IN_PAST",
  "DAILY_CAP_REACHED",
  "HOLD_EXPIRED",
  "HOLD_NOT_FOUND",
]);

export function describeBookingError(
  code: string | null,
  fallbackMessage: string
): string {
  return (code && BOOKING_ERROR_MESSAGES[code]) || fallbackMessage;
}

export function needsFreshSlots(code: string | null): boolean {
  return code !== null && SLOT_REFRESH_CODES.has(code);
}

/**
 * A booking's status. One still marked booked after it ended was never
 * checked in or recorded as missed. That is common on past days, so it is
 * said plainly without a warning colour.
 */
export function describeAppointmentStatus(
  appointment: Pick<Appointment, "status" | "endsAt">,
  now: Date = new Date()
): { label: string; tone: StatusTone } {
  if (
    appointment.status === "BOOKED" &&
    new Date(appointment.endsAt).getTime() <= now.getTime()
  ) {
    return { label: "Not checked in", tone: "neutral" };
  }
  return APPOINTMENT_STATUS_PRESENTATION[appointment.status];
}

/** Such as "9:30 – 9:50 am". */
export function describeAppointmentPeriod(
  appointment: Pick<Appointment, "startsAt" | "endsAt">
): string {
  return `${describeBranchClockTime(appointment.startsAt)} – ${describeBranchClockTime(appointment.endsAt)}`;
}

/** A calendar's day, such as "Open 8:00 am – 4:00 pm" or "Closed today". */
export function describeCalendarDay(
  calendar: Pick<DayBoardCalendar, "hours" | "closures">
): string {
  const wholeDayClosure = calendar.closures.find(
    (closure) => closure.kind === "LEAVE" || closure.kind === "HOLIDAY"
  );
  if (calendar.hours.length === 0) {
    return wholeDayClosure
      ? describeClosure(wholeDayClosure)
      : "No hours this day";
  }
  const hours = calendar.hours
    .map(
      (period) =>
        `${describeTimeOfDay(period.startTime)} – ${describeTimeOfDay(period.endTime)}`
    )
    .join(", ");
  return wholeDayClosure
    ? `${describeClosure(wholeDayClosure)} (usually ${hours})`
    : `Open ${hours}`;
}

const CLOSURE_LABELS = {
  LEAVE: "On leave",
  HOLIDAY: "Holiday",
  BREAK: "Break",
  BLOCK: "Blocked",
} as const;

function describeClosure(closure: DayBoardCalendar["closures"][number]) {
  const label = CLOSURE_LABELS[closure.kind];
  return closure.reason ? `${label}: ${closure.reason}` : label;
}

/** Bookings first in time order; cancelled ones stay, faded, for the record. */
export function sortDayAppointments<
  AppointmentType extends Pick<Appointment, "startsAt" | "status">,
>(appointments: readonly AppointmentType[]): AppointmentType[] {
  return [...appointments]
    .filter(
      (appointment) =>
        appointment.status !== "HELD" && appointment.status !== "RELEASED"
    )
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

/** Booked and still to come, soonest first: what can still be changed. */
export function listUpcomingAppointments(
  appointments: readonly Appointment[],
  now: Date = new Date()
): Appointment[] {
  return appointments
    .filter(
      (appointment) =>
        appointment.status === "BOOKED" &&
        new Date(appointment.endsAt).getTime() > now.getTime()
    )
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

/** Past or finished appointments, most recent first. */
export function listPastAppointments(
  appointments: readonly Appointment[],
  now: Date = new Date()
): Appointment[] {
  const upcoming = new Set(
    listUpcomingAppointments(appointments, now).map(
      (appointment) => appointment.id
    )
  );
  return appointments
    .filter(
      (appointment) =>
        !upcoming.has(appointment.id) &&
        appointment.status !== "HELD" &&
        appointment.status !== "RELEASED"
    )
    .sort((first, second) => second.startsAt.localeCompare(first.startsAt));
}

/** "Did not come" can be recorded only once the appointment has started. */
export function canRecordNoShow(
  appointment: Pick<Appointment, "status" | "startsAt">,
  now: Date = new Date()
): boolean {
  return (
    appointment.status === "BOOKED" &&
    new Date(appointment.startsAt).getTime() <= now.getTime()
  );
}
