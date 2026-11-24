import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import type { HealthSchedulePage } from "~/features/guided-tours/config/page-guides";

const PAGES_BY_PATH: Record<string, HealthSchedulePage> = {
  [HEALTH_SCHEDULE_ROUTES.overview]: "workspace",
  [HEALTH_SCHEDULE_ROUTES.frontDesk]: "frontDesk",
  [HEALTH_SCHEDULE_ROUTES.appointments]: "appointments",
  [HEALTH_SCHEDULE_ROUTES.triage]: "triage",
  [HEALTH_SCHEDULE_ROUTES.queues]: "queues",
  [HEALTH_SCHEDULE_ROUTES.consultation]: "consultation",
  [HEALTH_SCHEDULE_ROUTES.patients]: "patients",
  [HEALTH_SCHEDULE_ROUTES.accessReviews]: "accessReviews",
  [HEALTH_SCHEDULE_ROUTES.scheduleCalendars]: "scheduleCalendars",
  [HEALTH_SCHEDULE_ROUTES.scheduleTimeOff]: "scheduleTimeOff",
  [HEALTH_SCHEDULE_ROUTES.scheduleAppointmentTypes]: "scheduleAppointmentTypes",
  [HEALTH_SCHEDULE_ROUTES.scheduleNoteTemplates]: "scheduleNoteTemplates",
  [HEALTH_SCHEDULE_ROUTES.scheduleTestsAndScans]: "scheduleTestsAndScans",
  [HEALTH_SCHEDULE_ROUTES.results]: "results",
};

/** The HealthSchedule page at an address, for its help and tour. */
export function findPage(pathname: string): HealthSchedulePage | null {
  const page = PAGES_BY_PATH[pathname];
  if (page) return page;
  return pathname.startsWith(`${HEALTH_SCHEDULE_ROUTES.patients}/`)
    ? "patientRecord"
    : null;
}
