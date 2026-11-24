import type {
  AppointmentType,
  ScheduleCalendar,
} from "~/features/schedule-setup/schemas/schedule-response-schemas";

export type AppointmentTypeFilters = {
  searchText: string;
  /** "active", "inactive", or empty for both. */
  status: string;
  /** A calendar's identifier, or empty for every calendar. */
  calendarId: string;
  /** In person, video, phone or home, or empty for every way. */
  modality: string;
};

/**
 * Appointment types narrowed by name, status, the calendar that offers them
 * and how they happen, in name order.
 */
export function filterAppointmentTypes(
  appointmentTypes: readonly AppointmentType[],
  filters: AppointmentTypeFilters
): AppointmentType[] {
  const query = filters.searchText.trim().toLowerCase();
  return appointmentTypes
    .filter(
      (appointmentType) =>
        (filters.status === "" ||
          (filters.status === "active") === appointmentType.isActive) &&
        (query === "" || appointmentType.name.toLowerCase().includes(query)) &&
        (filters.calendarId === "" ||
          appointmentType.resourceIds.includes(filters.calendarId)) &&
        (filters.modality === "" ||
          appointmentType.modality === filters.modality)
    )
    .sort((first, second) => first.name.localeCompare(second.name));
}

/** The calendars that offer at least one type, by name, as filter choices. */
export function readOfferingCalendarOptions(
  calendars: readonly ScheduleCalendar[],
  appointmentTypes: readonly AppointmentType[]
): { value: string; label: string }[] {
  const offeringIds = new Set(
    appointmentTypes.flatMap((appointmentType) => appointmentType.resourceIds)
  );
  return calendars
    .filter((calendar) => offeringIds.has(calendar.id))
    .sort((first, second) => first.name.localeCompare(second.name))
    .map((calendar) => ({ value: calendar.id, label: calendar.name }));
}
