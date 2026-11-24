/** HealthSchedule's own pages. */
export const HEALTH_SCHEDULE_ROUTES = {
  overview: "/",
  frontDesk: "/front-desk",
  appointments: "/appointments",
  triage: "/triage",
  queues: "/queues",
  consultation: "/consultation",
  patients: "/patients",
  patient: (patientId: string) => `/patients/${encodeURIComponent(patientId)}`,
  accessReviews: "/access-reviews",
  scheduleCalendars: "/schedule/calendars",
  scheduleTimeOff: "/schedule/time-off",
  scheduleAppointmentTypes: "/schedule/appointment-types",
  scheduleNoteTemplates: "/schedule/note-templates",
  scheduleTestsAndScans: "/schedule/tests-and-scans",
  results: "/results",
} as const;
