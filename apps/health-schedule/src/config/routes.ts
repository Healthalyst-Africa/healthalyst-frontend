/** HealthSchedule's own pages. */
export const HEALTH_SCHEDULE_ROUTES = {
  overview: "/",
  frontDesk: "/front-desk",
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
} as const;
