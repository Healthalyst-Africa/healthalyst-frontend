import type { TimeOfDay } from "~/features/appointments/schemas/appointment-response-schemas";

/** The free times of one appointment type at a branch. */
export type SlotSearch = {
  appointmentTypeId: string;
  branchId: string;
  /** Branch-local dates, `yyyy-MM-dd`. */
  from: string;
  to: string;
  newPatient?: boolean;
};

/** A time held for five minutes while the desk confirms the booking. */
export type HoldRequest = {
  id: string;
  appointmentTypeId: string;
  branchId: string;
  resourceId: string;
  startsAt: string;
  newPatient?: boolean;
};

export type BookingRequest = {
  id: string;
  holdId: string;
  patientId: string;
  notes?: string;
};

export type RescheduleRequest = {
  appointmentId: string;
  version: number;
  startsAt: string;
  resourceId: string;
  holdId: string;
};

export type CancelRequest = {
  appointmentId: string;
  reason: string;
  cancelledBy: "PATIENT" | "FACILITY";
};

export type WaitlistRequest = {
  id: string;
  patientId: string;
  appointmentTypeId: string;
  branchId: string;
  resourceId?: string;
  /** Branch-local dates, `yyyy-MM-dd`. */
  fromDate: string;
  toDate: string;
  timeOfDay: TimeOfDay;
  notes?: string;
};

/**
 * Trims notes and leaves blank ones out: an undefined value is not sent, so
 * the API does not store an empty note.
 */
export function withoutBlankNotes<RequestType extends { notes?: string }>(
  request: RequestType
): RequestType {
  return { ...request, notes: request.notes?.trim() || undefined };
}
