/** HealthSchedule's own pages. */
export const HEALTH_SCHEDULE_ROUTES = {
  overview: "/",
  frontDesk: "/front-desk",
  triage: "/triage",
  queues: "/queues",
  patients: "/patients",
  patient: (patientId: string) => `/patients/${encodeURIComponent(patientId)}`,
  scheduleCalendars: "/schedule/calendars",
  scheduleTimeOff: "/schedule/time-off",
  scheduleAppointmentTypes: "/schedule/appointment-types",
} as const;
