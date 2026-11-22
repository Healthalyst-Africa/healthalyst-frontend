import type {
  Appointment,
  WaitlistEntry,
} from "~/features/appointments/schemas/appointment-response-schemas";

/** Who an appointment is for, as the booking screens show them. */
export type BookingPatient = { id: string; name: string; details?: string };

/** A new booking, moving an existing one, or booking a waiting patient. */
export type BookingMode =
  | { kind: "book"; patient: BookingPatient | null }
  | { kind: "reschedule"; appointment: Appointment }
  | { kind: "waitlist"; entry: WaitlistEntry };
