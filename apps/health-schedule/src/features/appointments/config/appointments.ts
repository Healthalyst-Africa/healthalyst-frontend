import type { StatusPresentation } from "@healthalyst/ui/types/status-tone";
import {
  ArrivedIcon,
  CancelAppointmentIcon,
  CompletedIcon,
  DatesPassedIcon,
  ExpectedArrivalsIcon,
  HeldTimeIcon,
  NeedsMovingIcon,
  NoShowIcon,
  NotCheckedInIcon,
  ReleasedTimeIcon,
  WaitlistIcon,
} from "@healthalyst/icons";

/** HealthSchedule API paths for free times, bookings and the waitlist. */
export const APPOINTMENT_ENDPOINTS = {
  slots: "/v1/schedule/slots",
  holds: "/v1/appointments/holds",
  hold: (holdId: string) =>
    `/v1/appointments/holds/${encodeURIComponent(holdId)}`,
  appointments: "/v1/appointments",
  appointment: (appointmentId: string) =>
    `/v1/appointments/${encodeURIComponent(appointmentId)}`,
  reschedule: (appointmentId: string) =>
    `/v1/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
  cancel: (appointmentId: string) =>
    `/v1/appointments/${encodeURIComponent(appointmentId)}/cancel`,
  noShow: (appointmentId: string) =>
    `/v1/appointments/${encodeURIComponent(appointmentId)}/no-show`,
  dayBoard: "/v1/appointments/day-board",
  waitlist: "/v1/waitlist",
  bookFromWaitlist: (entryId: string) =>
    `/v1/waitlist/${encodeURIComponent(entryId)}/book`,
  removeFromWaitlist: (entryId: string) =>
    `/v1/waitlist/${encodeURIComponent(entryId)}/remove`,
} as const;

export const APPOINTMENT_PERMISSIONS = {
  read: "appointment:read",
  book: "appointment:book",
  override: "appointment:override",
  /** Free times and appointment types are part of the schedule. */
  readSchedule: "schedule:read",
} as const;

/** Booking needs the schedule's free times as well as the right to book. */
export const BOOKING_PERMISSIONS = [
  APPOINTMENT_PERMISSIONS.book,
  APPOINTMENT_PERMISSIONS.readSchedule,
] as const;

/**
 * Free times are shown a week at a time; the API allows up to 31 days per
 * request.
 */
export const SLOT_SEARCH_DAYS = 7;

/** The API keeps a held time for five minutes. */
export const HOLD_MINUTES = 5;

/** How far ahead the patient record lists appointments. */
export const UPCOMING_APPOINTMENT_DAYS = 90;

export const APPOINTMENT_STATUS_PRESENTATION = {
  HELD: { label: "Being booked", tone: "neutral", icon: HeldTimeIcon },
  BOOKED: { label: "Booked", tone: "information", icon: ExpectedArrivalsIcon },
  ARRIVED: { label: "Arrived", tone: "positive", icon: ArrivedIcon },
  COMPLETED: { label: "Seen", tone: "positive", icon: CompletedIcon },
  CANCELLED: {
    label: "Cancelled",
    tone: "neutral",
    icon: CancelAppointmentIcon,
  },
  NO_SHOW: { label: "Did not come", tone: "warning", icon: NoShowIcon },
  RELEASED: { label: "Not booked", tone: "neutral", icon: ReleasedTimeIcon },
} as const satisfies Record<string, StatusPresentation>;

/** Tags for a booking's day and for the waitlist. */
export const BOOKING_TAGS = {
  notCheckedIn: {
    label: "Not checked in",
    tone: "neutral",
    icon: NotCheckedInIcon,
  },
  needsMoving: {
    label: "Needs moving",
    tone: "warning",
    icon: NeedsMovingIcon,
  },
  waiting: { label: "Waiting", tone: "information", icon: WaitlistIcon },
  datesPassed: {
    label: "Dates passed",
    tone: "warning",
    icon: DatesPassedIcon,
  },
} as const satisfies Record<string, StatusPresentation>;

export const CANCELLED_BY_OPTIONS = [
  {
    value: "PATIENT",
    label: "The patient",
    description: "They asked to cancel or cannot come.",
  },
  {
    value: "FACILITY",
    label: "The facility",
    description: "For example, the doctor is away.",
  },
] as const;

export const TIME_OF_DAY_OPTIONS = [
  { value: "ANY", label: "Any time" },
  { value: "MORNING", label: "Mornings" },
  { value: "AFTERNOON", label: "Afternoons" },
] as const;

export const APPOINTMENT_TEXT_LIMITS = {
  notesMaximum: 500,
  reasonMinimum: 3,
  reasonMaximum: 500,
} as const;
