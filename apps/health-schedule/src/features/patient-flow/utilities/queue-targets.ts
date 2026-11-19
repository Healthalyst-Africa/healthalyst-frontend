import type { WorkspaceDepartment } from "~/features/branch-selection/schemas/branch-schema";
import type {
  DayBoard,
  QueueKind,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";

/** Where a patient can be sent, as the API's `queue` and `to` fields. */
export type QueueTarget =
  | { kind: "TRIAGE" }
  | { kind: "CONSULTATION"; resourceId?: string }
  | { kind: "DEPARTMENT"; departmentId: string };

export type QueueTargetOption = { value: string; label: string };

export type QueueTargetChoices = {
  practitioners: readonly { resourceId: string; name: string }[];
  departments: readonly { id: string; name: string }[];
};

const TRIAGE_VALUE = "TRIAGE";
const ANY_DOCTOR_VALUE = "CONSULTATION";

/** A target as a single select value, such as `DEPARTMENT:<id>`. */
export function encodeQueueTarget(target: QueueTarget): string {
  switch (target.kind) {
    case "TRIAGE":
      return TRIAGE_VALUE;
    case "CONSULTATION":
      return target.resourceId
        ? `${ANY_DOCTOR_VALUE}:${target.resourceId}`
        : ANY_DOCTOR_VALUE;
    case "DEPARTMENT":
      return `DEPARTMENT:${target.departmentId}`;
  }
}

/** The target a select value stands for, or null for an unknown value. */
export function decodeQueueTarget(value: string): QueueTarget | null {
  const [kind, identifier, ...rest] = value.split(":");
  if (rest.length > 0) return null;
  if (kind === TRIAGE_VALUE && identifier === undefined) {
    return { kind: "TRIAGE" };
  }
  if (kind === ANY_DOCTOR_VALUE) {
    return identifier
      ? { kind: "CONSULTATION", resourceId: identifier }
      : { kind: "CONSULTATION" };
  }
  if (kind === "DEPARTMENT" && identifier) {
    return { kind: "DEPARTMENT", departmentId: identifier };
  }
  return null;
}

/** The doctors and departments a patient can be sent to today. */
export function readQueueTargetChoices(
  dayBoard: DayBoard | undefined,
  departments: readonly WorkspaceDepartment[]
): QueueTargetChoices {
  return {
    practitioners: (dayBoard?.calendars ?? [])
      .filter((calendar) => calendar.kind === "PRACTITIONER")
      .map((calendar) => ({
        resourceId: calendar.resourceId,
        name: calendar.name,
      }))
      .sort((first, second) => first.name.localeCompare(second.name)),
    departments: departments
      .filter((department) => department.isActive)
      .map((department) => ({ id: department.id, name: department.name }))
      .sort((first, second) => first.name.localeCompare(second.name)),
  };
}

/**
 * Triage first, then the doctors' shared queue, each doctor working today
 * and the branch's departments.
 */
export function buildQueueTargetOptions(
  choices: QueueTargetChoices
): QueueTargetOption[] {
  return [
    { value: TRIAGE_VALUE, label: "Triage (vitals first)" },
    { value: ANY_DOCTOR_VALUE, label: "Next free doctor" },
    ...choices.practitioners.map((practitioner) => ({
      value: encodeQueueTarget({
        kind: "CONSULTATION",
        resourceId: practitioner.resourceId,
      }),
      label: practitioner.name,
    })),
    ...choices.departments.map((department) => ({
      value: encodeQueueTarget({
        kind: "DEPARTMENT",
        departmentId: department.id,
      }),
      label: department.name,
    })),
  ];
}

/** Where a patient is, such as "Triage", "Dr Bello" or "Laboratory". */
export function describeQueue(queue: {
  kind: QueueKind;
  departmentName: string | null;
  resourceName: string | null;
}): string {
  if (queue.kind === "TRIAGE") return "Triage";
  if (queue.kind === "DEPARTMENT") return queue.departmentName ?? "Department";
  return queue.resourceName ?? "Next free doctor";
}

type QueueCount = {
  kind: QueueKind;
  departmentId: string | null;
  resourceId: string | null;
  waiting: number;
};

function countWaiting(
  summaries: readonly QueueCount[],
  matches: (summary: QueueCount) => boolean
): number {
  return summaries
    .filter(matches)
    .reduce((total, summary) => total + summary.waiting, 0);
}

function withWaitingCount(label: string, waiting: number): string {
  return waiting === 0 ? label : `${label} · ${waiting} waiting`;
}

/**
 * The queues a member of staff can work from: triage, all doctors, each
 * doctor working today (with patients for the next free doctor) and each
 * department, with how many are waiting in each.
 */
export function buildQueueBoardOptions(
  choices: QueueTargetChoices,
  summaries: readonly QueueCount[]
): QueueTargetOption[] {
  return [
    {
      value: encodeQueueTarget({ kind: "TRIAGE" }),
      label: withWaitingCount(
        "Triage",
        countWaiting(summaries, (summary) => summary.kind === "TRIAGE")
      ),
    },
    {
      value: encodeQueueTarget({ kind: "CONSULTATION" }),
      label: withWaitingCount(
        "All doctors",
        countWaiting(summaries, (summary) => summary.kind === "CONSULTATION")
      ),
    },
    ...choices.practitioners.map((practitioner) => ({
      value: encodeQueueTarget({
        kind: "CONSULTATION",
        resourceId: practitioner.resourceId,
      }),
      label: withWaitingCount(
        practitioner.name,
        countWaiting(
          summaries,
          (summary) =>
            summary.kind === "CONSULTATION" &&
            (summary.resourceId === practitioner.resourceId ||
              summary.resourceId === null)
        )
      ),
    })),
    ...choices.departments.map((department) => ({
      value: encodeQueueTarget({
        kind: "DEPARTMENT",
        departmentId: department.id,
      }),
      label: withWaitingCount(
        department.name,
        countWaiting(
          summaries,
          (summary) =>
            summary.kind === "DEPARTMENT" &&
            summary.departmentId === department.id
        )
      ),
    })),
  ];
}
