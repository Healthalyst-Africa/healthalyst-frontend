import type {
  DayBoard,
  DayBoardAppointment,
  DayBoardCalendar,
} from "~/features/appointments/schemas/appointment-response-schemas";
import { sortDayAppointments } from "~/features/appointments/utilities/appointment-presentation";

/** The "With" filter's value for every calendar. */
export const EVERY_CALENDAR = "every-calendar";

const CALENDAR_GROUP_NAMES = {
  PRACTITIONER: "Doctors and nurses",
  ROOM: "Rooms and equipment",
  EQUIPMENT: "Rooms and equipment",
} as const;

/** People first, then rooms and machines, each in name order. */
function compareCalendars(first: DayBoardCalendar, second: DayBoardCalendar) {
  const firstIsPerson = first.kind === "PRACTITIONER" ? 0 : 1;
  const secondIsPerson = second.kind === "PRACTITIONER" ? 0 : 1;
  return (
    firstIsPerson - secondIsPerson || first.name.localeCompare(second.name)
  );
}

/** "Everyone", then each doctor or nurse, then each room or machine. */
export function buildCalendarFilterOptions(
  dayBoard: DayBoard | undefined
): { value: string; label: string; group?: string }[] {
  return [
    { value: EVERY_CALENDAR, label: "Everyone" },
    ...[...(dayBoard?.calendars ?? [])]
      .sort(compareCalendars)
      .map((calendar) => ({
        value: calendar.resourceId,
        label: calendar.name,
        group: CALENDAR_GROUP_NAMES[calendar.kind],
      })),
  ];
}

/** Who or what an appointment is with, as staff would say it. */
export function describeWith(
  calendar: Pick<DayBoardCalendar, "kind" | "name">
): string {
  return calendar.kind === "PRACTITIONER"
    ? `with ${calendar.name}`
    : calendar.kind === "ROOM"
      ? `in ${calendar.name}`
      : `using ${calendar.name}`;
}

export type DaySheetAppointment = DayBoardAppointment & {
  calendar: DayBoardCalendar;
};

/**
 * The day's appointments as one list in time order, across every calendar
 * or for the one chosen. Same-time appointments keep people before rooms.
 */
export function listDayAppointments(
  dayBoard: DayBoard,
  calendarChoice: string
): DaySheetAppointment[] {
  const calendars = [...dayBoard.calendars]
    .sort(compareCalendars)
    .filter(
      (calendar) =>
        calendarChoice === EVERY_CALENDAR ||
        calendar.resourceId === calendarChoice
    );
  const appointments = calendars.flatMap((calendar) =>
    sortDayAppointments(calendar.appointments).map((appointment) => ({
      ...appointment,
      calendar,
    }))
  );
  // A stable sort keeps the calendar order for appointments at the same time.
  return appointments.sort((first, second) =>
    first.startsAt.localeCompare(second.startsAt)
  );
}

/** The chosen calendar, when the filter names one. */
export function findChosenCalendar(
  dayBoard: DayBoard | undefined,
  calendarChoice: string
): DayBoardCalendar | undefined {
  return dayBoard?.calendars.find(
    (calendar) => calendar.resourceId === calendarChoice
  );
}
