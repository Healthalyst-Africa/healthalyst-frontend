import type { StatusTone } from "@healthalyst/ui/types/status-tone";

/** HealthSchedule API paths for check-in, queues and today's appointments. */
export const PATIENT_FLOW_ENDPOINTS = {
  patients: "/v1/patients",
  quickPatient: "/v1/patients/quick",
  temporaryPatient: "/v1/patients/temporary",
  checkIns: "/v1/queue/check-ins",
  queues: "/v1/queues",
  queueEntries: "/v1/queue/entries",
  callNext: "/v1/queue/call-next",
  callEntry: (entryId: string) =>
    `/v1/queue/entries/${encodeURIComponent(entryId)}/call`,
  startEntry: (entryId: string) =>
    `/v1/queue/entries/${encodeURIComponent(entryId)}/start`,
  skipEntry: (entryId: string) =>
    `/v1/queue/entries/${encodeURIComponent(entryId)}/skip`,
  transferEntry: (entryId: string) =>
    `/v1/queue/entries/${encodeURIComponent(entryId)}/transfer`,
  completeVisit: (visitId: string) =>
    `/v1/visits/${encodeURIComponent(visitId)}/complete`,
  visitBoard: "/v1/visits",
  dayBoard: "/v1/appointments/day-board",
} as const;

export const PATIENT_FLOW_PERMISSIONS = {
  checkIn: "queue:check-in",
  readQueues: "queue:read",
  manageQueues: "queue:manage",
  readPatients: "patient:read",
  registerPatients: "patient:create",
  readAppointments: "appointment:read",
} as const;

/**
 * Queues change as other staff work, so open screens check again on their
 * own. The front desk and queue boards refresh every 15 seconds.
 */
export const PATIENT_FLOW_REFRESH_MILLISECONDS = 15_000;

/** Patient search waits for a pause in typing, and needs two characters. */
export const PATIENT_SEARCH_CONFIGURATION = {
  minimumLength: 2,
  delayMilliseconds: 300,
  resultLimit: 10,
} as const;

export const QUEUE_KIND_LABELS = {
  TRIAGE: "Triage",
  CONSULTATION: "Doctor",
  DEPARTMENT: "Department",
} as const;

export const QUEUE_ENTRY_STATUS_PRESENTATION = {
  WAITING: { label: "Waiting", tone: "neutral" },
  CALLED: { label: "Called", tone: "information" },
  IN_SERVICE: { label: "With staff", tone: "positive" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

/** Triage bands, most urgent first. */
export const TRIAGE_BAND_PRESENTATION = {
  RED: { label: "Emergency", tone: "negative" },
  YELLOW: { label: "Urgent", tone: "warning" },
  GREEN: { label: "Routine", tone: "neutral" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

/** Wait and visit clocks against the facility's targets. */
export const CLOCK_STATE_TONES = {
  GREEN: "neutral",
  AMBER: "warning",
  RED: "negative",
} as const satisfies Record<string, StatusTone>;

export const PATIENT_SEX_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "unknown", label: "Not known" },
] as const;

export const PATIENT_NAME_MAXIMUM_LENGTH = 100;
export const CHECK_IN_NOTE_MAXIMUM_LENGTH = 500;
export const UNKNOWN_PATIENT_LABEL_LENGTH = {
  minimum: 3,
  maximum: 100,
} as const;
export const PATIENT_AGE_MAXIMUM_YEARS = 130;

/** Nigerian numbers are typed locally, such as 0803 123 4567. */
export const PHONE_COUNTRY_CODE = "234";
