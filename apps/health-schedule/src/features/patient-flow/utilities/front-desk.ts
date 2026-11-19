import type { DataTableRowEmphasis } from "@healthalyst/ui/types/data-table";
import { differenceInYears, format, parseISO } from "date-fns";
import {
  PATIENT_SEX_OPTIONS,
  QUEUE_ENTRY_STATUS_PRESENTATION,
} from "~/features/patient-flow/config/patient-flow";
import type {
  DayBoard,
  DayBoardAppointment,
  PatientMatch,
  QueueSummary,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";

/** A booked appointment the patient has not arrived for yet. */
export type ExpectedArrival = DayBoardAppointment & {
  patient: NonNullable<DayBoardAppointment["patient"]>;
};

const BOOKED_STATUS = "BOOKED";

/** Today's booked appointments still waiting for the patient, earliest first. */
export function listExpectedArrivals(
  dayBoard: DayBoard | undefined
): ExpectedArrival[] {
  return (dayBoard?.calendars ?? [])
    .flatMap((calendar) => calendar.appointments)
    .filter(
      (appointment): appointment is ExpectedArrival =>
        appointment.status === BOOKED_STATUS && appointment.patient !== null
    )
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
}

/**
 * The booked appointment a searched patient has today, so they are checked
 * in for it rather than as a walk-in.
 */
export function findExpectedArrival(
  expectedArrivals: readonly ExpectedArrival[],
  patientId: string
): ExpectedArrival | undefined {
  return expectedArrivals.find(
    (appointment) => appointment.patient.id === patientId
  );
}

export type FrontDeskFigures = {
  waitingNow: number;
  longestWaitMinutes: number;
  overVisitTarget: number;
  stillToArrive: number;
};

/** The figures at the top of the front desk. */
export function summarizeFrontDesk({
  queues,
  overVisitTarget,
  dayBoard,
}: {
  queues: readonly QueueSummary[];
  overVisitTarget: number;
  dayBoard: DayBoard | undefined;
}): FrontDeskFigures {
  return {
    waitingNow: queues.reduce((total, queue) => total + queue.waiting, 0),
    longestWaitMinutes: Math.max(
      0,
      ...queues.map((queue) => queue.longestWaitMinutes)
    ),
    overVisitTarget,
    stillToArrive: dayBoard?.summary.booked ?? 0,
  };
}

/** Minutes as "45 min" or "1 h 20 min". */
export function describeMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours} h`
    : `${hours} h ${remainingMinutes} min`;
}

export function describePatientName(patient: {
  firstName: string;
  lastName: string;
}): string {
  return `${patient.firstName} ${patient.lastName}`.trim();
}

/**
 * What helps the desk tell people apart: sex, age or birth date and phone,
 * such as "Female · born 12 May 1986 · +2348121232280".
 */
export function describePatientMatch(
  patient: PatientMatch,
  now: Date = new Date()
): string {
  const sexLabel =
    PATIENT_SEX_OPTIONS.find((option) => option.value === patient.sex)?.label ??
    "Sex not recorded";
  const details: string[] = [sexLabel];
  if (patient.dateOfBirth) {
    details.push(
      patient.dateOfBirthEstimated
        ? `about ${differenceInYears(now, parseISO(patient.dateOfBirth))} years old`
        : `born ${format(parseISO(patient.dateOfBirth), "d MMM yyyy")}`
    );
  }
  if (patient.phone) details.push(patient.phone);
  return details.join(" · ");
}

/** A search hit's name, or the description of an unidentified patient. */
export function describePatientMatchName(patient: PatientMatch): string {
  return patient.isTemporary && patient.temporaryLabel
    ? patient.temporaryLabel
    : describePatientName(patient);
}

/** Waiting, called or with staff: still in the queue. */
export function isLiveEntryStatus(
  status: string
): status is keyof typeof QUEUE_ENTRY_STATUS_PRESENTATION {
  return Object.hasOwn(QUEUE_ENTRY_STATUS_PRESENTATION, status);
}

/**
 * Rows staff should look at first: emergencies, then urgent patients and
 * anyone waiting past the target for their queue.
 */
export function readFlowEmphasis({
  triageBand,
  waitState,
}: {
  triageBand: "RED" | "YELLOW" | "GREEN" | null;
  waitState: "GREEN" | "AMBER" | "RED" | null;
}): DataTableRowEmphasis {
  if (triageBand === "RED") return "critical";
  if (triageBand === "YELLOW" || waitState === "RED") return "attention";
  return "none";
}

/** A wait, saying so when it is past the target, such as "42 min, over target". */
export function describeWait(
  minutes: number,
  waitState: "GREEN" | "AMBER" | "RED" | null
): string {
  const wait = describeMinutes(minutes);
  return waitState === "RED" ? `${wait}, over target` : wait;
}

/** Emergencies first, then urgent, then routine; patients not yet triaged last. */
const TRIAGE_ORDER = { RED: 0, YELLOW: 1, GREEN: 2 } as const;
const UNTRIAGED_ORDER = 3;

/**
 * Patients in the building by triage band, most urgent first, and the
 * longest visits first within a band.
 */
export function sortByTriage<
  VisitRow extends {
    triageBand: keyof typeof TRIAGE_ORDER | null;
    visitMinutes: number;
  },
>(visits: readonly VisitRow[]): VisitRow[] {
  return [...visits].sort(
    (first, second) =>
      (first.triageBand ? TRIAGE_ORDER[first.triageBand] : UNTRIAGED_ORDER) -
        (second.triageBand
          ? TRIAGE_ORDER[second.triageBand]
          : UNTRIAGED_ORDER) || second.visitMinutes - first.visitMinutes
  );
}
