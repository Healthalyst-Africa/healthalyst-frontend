import type {
  CheckInFormValues,
  TransferFormValues,
  UnknownPatientFormValues,
} from "~/features/patient-flow/schemas/patient-flow-form-schemas";
import {
  decodeQueueTarget,
  type QueueTarget,
} from "~/features/patient-flow/utilities/queue-targets";

export type UnknownPatientRequest = {
  sex: string;
  ageYears?: number;
  label: string;
};

/** Who is checking in: a booked appointment, or a walk-in patient. */
export type CheckInArrival =
  | { kind: "appointment"; appointmentId: string }
  | { kind: "walk-in"; patientId: string };

export type CheckInRequest = {
  /** Chosen here, so a retried check-in returns the same visit. */
  id: string;
  branchId: string;
  appointmentId?: string;
  patientId?: string;
  queue: QueueTarget;
  note?: string;
};

export type TransferRequest = { to: QueueTarget; note?: string };

function readQueueTarget(value: string): QueueTarget {
  const target = decodeQueueTarget(value);
  if (!target) throw new Error("Choose where the patient goes.");
  return target;
}

function readNote(note: string): string | undefined {
  const trimmedNote = note.trim();
  return trimmedNote === "" ? undefined : trimmedNote;
}

export function toUnknownPatientRequest(
  values: UnknownPatientFormValues
): UnknownPatientRequest {
  const approximateAge = values.approximateAge.trim();
  return {
    sex: values.sex,
    label: values.label.trim(),
    ...(approximateAge === "" ? {} : { ageYears: Number(approximateAge) }),
  };
}

export function toCheckInRequest({
  checkInIdentifier,
  branchId,
  arrival,
  values,
}: {
  checkInIdentifier: string;
  branchId: string;
  arrival: CheckInArrival;
  values: CheckInFormValues;
}): CheckInRequest {
  const note = readNote(values.note);
  return {
    id: checkInIdentifier,
    branchId,
    ...(arrival.kind === "appointment"
      ? { appointmentId: arrival.appointmentId }
      : { patientId: arrival.patientId }),
    queue: readQueueTarget(values.queueTarget),
    ...(note ? { note } : {}),
  };
}

export function toTransferRequest(values: TransferFormValues): TransferRequest {
  const note = readNote(values.note);
  return {
    to: readQueueTarget(values.queueTarget),
    ...(note ? { note } : {}),
  };
}
