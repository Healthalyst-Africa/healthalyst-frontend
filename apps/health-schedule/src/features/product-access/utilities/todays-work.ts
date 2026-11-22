import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";

type QueueCount = {
  kind: "TRIAGE" | "CONSULTATION" | "DEPARTMENT";
  waiting: number;
};

/** How many patients wait in every queue of one kind. */
export function countWaiting(
  queues: readonly QueueCount[] | undefined,
  kind: QueueCount["kind"]
): number {
  return (queues ?? [])
    .filter((queue) => queue.kind === kind)
    .reduce((total, queue) => total + queue.waiting, 0);
}

/** "1 patient" or "3 patients": the count with its noun. */
export function countPatients(count: number): string {
  return `${count} ${count === 1 ? "patient" : "patients"}`;
}

type CalendarForSetup = {
  name: string;
  isActive: boolean;
  availability: readonly unknown[];
};

type AppointmentTypeForSetup = { isActive: boolean };

export type SetupProgressStep = {
  title: string;
  description: string;
  isComplete: boolean;
  action?: { label: string; href: string };
};

/**
 * What a new organisation needs before patients can be booked, each step
 * ticked from what is actually set up.
 */
export function buildSetupSteps({
  calendars,
  appointmentTypes,
}: {
  calendars: readonly CalendarForSetup[];
  appointmentTypes: readonly AppointmentTypeForSetup[];
}): SetupProgressStep[] {
  const activeCalendars = calendars.filter((calendar) => calendar.isActive);
  const calendarsWithoutHours = activeCalendars.filter(
    (calendar) => calendar.availability.length === 0
  );
  const bookableTypes = appointmentTypes.filter((type) => type.isActive);

  return [
    {
      title: "Set weekly hours for doctors and rooms",
      description:
        activeCalendars.length === 0
          ? "Add a calendar for each doctor, room or machine that patients book, with the hours it is open."
          : calendarsWithoutHours.length === 1
            ? `${calendarsWithoutHours[0]?.name} has no hours yet, so cannot be booked.`
            : calendarsWithoutHours.length > 1
              ? `${calendarsWithoutHours.length} calendars have no hours yet, so cannot be booked.`
              : `All ${activeCalendars.length} calendars have weekly hours.`,
      isComplete:
        activeCalendars.length > 0 && calendarsWithoutHours.length === 0,
      action: {
        label: activeCalendars.length === 0 ? "Add calendars" : "Set hours",
        href: HEALTH_SCHEDULE_ROUTES.scheduleCalendars,
      },
    },
    {
      title: "Choose what patients can book",
      description:
        bookableTypes.length === 0
          ? "Add appointment types, such as a general consultation, with their length and price."
          : `${bookableTypes.length} appointment ${bookableTypes.length === 1 ? "type" : "types"} can be booked.`,
      isComplete: bookableTypes.length > 0,
      action: {
        label: "Add appointment types",
        href: HEALTH_SCHEDULE_ROUTES.scheduleAppointmentTypes,
      },
    },
  ];
}
