/** HealthSchedule API paths for schedule setup. */
export const SCHEDULE_ENDPOINTS = {
  calendars: "/v1/schedule/resources",
  calendar: (calendarId: string) =>
    `/v1/schedule/resources/${encodeURIComponent(calendarId)}`,
  calendarAvailability: (calendarId: string) =>
    `/v1/schedule/resources/${encodeURIComponent(calendarId)}/availability`,
  timeOff: "/v1/schedule/exceptions",
  timeOffEntry: (timeOffIdentifier: string) =>
    `/v1/schedule/exceptions/${encodeURIComponent(timeOffIdentifier)}`,
  appointmentTypes: "/v1/schedule/appointment-types",
  appointmentType: (appointmentTypeId: string) =>
    `/v1/schedule/appointment-types/${encodeURIComponent(appointmentTypeId)}`,
} as const;

/** Platform API list of the organisation's members, for practitioner calendars. */
export const STAFF_ENDPOINT = "/v1/staff";

export const SCHEDULE_PERMISSIONS = {
  read: "schedule:read",
  manage: "schedule:manage",
  /** Needed to choose the staff member a practitioner calendar belongs to. */
  staffRead: "staff:read",
} as const;

/** Branch times are Lagos time; the API uses it for every branch for now. */
export const BRANCH_TIME_ZONE = "Africa/Lagos";

export const CALENDAR_KIND_OPTIONS = [
  { value: "PRACTITIONER", label: "Practitioner" },
  { value: "ROOM", label: "Room" },
  { value: "EQUIPMENT", label: "Equipment" },
] as const;

/** Weekday names by the API's number, where 1 is Monday and 7 is Sunday. */
export const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/** The times a newly added working period starts with. */
export const NEW_WORKING_PERIOD = { startTime: "08:00", endTime: "16:00" };

export const TIME_OFF_KIND_OPTIONS = [
  { value: "LEAVE", label: "Leave" },
  { value: "BREAK", label: "Break" },
  { value: "HOLIDAY", label: "Public holiday" },
  { value: "BLOCK", label: "Blocked time" },
] as const;

/** Kinds that close one calendar, and kinds that close a whole branch. */
export const CALENDAR_TIME_OFF_KINDS = ["LEAVE", "BREAK", "BLOCK"] as const;
export const BRANCH_TIME_OFF_KINDS = ["HOLIDAY", "BLOCK"] as const;

/** How far ahead the time off list looks, in days. */
export const TIME_OFF_PERIOD_OPTIONS = [
  { value: "30", label: "Next 30 days" },
  { value: "90", label: "Next 90 days" },
  { value: "365", label: "Next 12 months" },
] as const;

export const MODALITY_OPTIONS = [
  { value: "IN_PERSON", label: "In person" },
  { value: "VIDEO", label: "Video call" },
  { value: "AUDIO", label: "Phone call" },
  { value: "HOME", label: "Home visit" },
] as const;

/** Limits the HealthSchedule API applies, so forms can explain them early. */
export const SCHEDULE_FIELD_LIMITS = {
  nameMaximum: 100,
  reasonMaximum: 200,
  preparationNotesMaximum: 1000,
  durationMinimumMinutes: 5,
  durationMaximumMinutes: 480,
  bufferMaximumMinutes: 120,
  capacityMaximum: 100,
  minimumNoticeMaximumHours: 168,
  advanceBookingMaximumDays: 365,
  dailyLimitMaximum: 500,
  overbookingMaximumPercent: 100,
  workingPeriodsMaximum: 100,
  /** The most staff the practitioner picker loads in one request. */
  staffPickerLimit: 100,
} as const;

/** Defaults the API uses for a new appointment type. */
export const APPOINTMENT_TYPE_DEFAULTS = {
  durationMinutes: "30",
  bufferMinutes: "0",
  capacity: "1",
  minimumNoticeHours: "0",
  advanceBookingDays: "90",
  overbookingPercent: "0",
  modality: "IN_PERSON",
} as const;
