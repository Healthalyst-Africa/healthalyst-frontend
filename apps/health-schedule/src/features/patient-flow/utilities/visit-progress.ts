import type { VisitProgressStep } from "@healthalyst/ui/types/visit-progress";
import { QUEUE_ENTRY_STATUS_PRESENTATION } from "~/features/patient-flow/config/patient-flow";
import type {
  OpenVisit,
  QueueEntry,
  VisitDetail,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import { describeWait } from "~/features/patient-flow/utilities/front-desk";

/** The current stop in words, such as "Doctor (Chukwudi Okeke)" or "Laboratory". */
function describeStop(current: NonNullable<OpenVisit["current"]>): string {
  if (current.kind === "TRIAGE") return "Vital signs";
  if (current.kind === "DEPARTMENT")
    return current.departmentName ?? "Department";
  return current.resourceName ? `Doctor (${current.resourceName})` : "Doctor";
}

/** How the patient is doing at the current stop, such as "Waiting 12 min". */
function describeStopStatus(
  current: NonNullable<OpenVisit["current"]>
): string {
  return current.status === "WAITING"
    ? `waiting ${describeWait(current.minutes, current.state)}`
    : QUEUE_ENTRY_STATUS_PRESENTATION[current.status].label.toLowerCase();
}

/**
 * A visit as steps: checked in, vital signs when taken or under way, where
 * the patient is now, then finished. Only what the visit board shows is
 * marked done; nothing is assumed.
 */
export function describeVisitProgress(visit: OpenVisit): VisitProgressStep[] {
  const steps: VisitProgressStep[] = [{ label: "Checked in", state: "done" }];
  const current = visit.current;

  if (current?.kind === "TRIAGE") {
    steps.push({
      label: "Vital signs",
      state: "current",
      detail: describeStopStatus(current),
    });
  } else {
    if (visit.triageBand !== null) {
      steps.push({ label: "Vital signs", state: "done" });
    }
    steps.push(
      current
        ? {
            label: describeStop(current),
            state: "current",
            detail: describeStopStatus(current),
          }
        : { label: "Between queues", state: "current" }
    );
  }

  steps.push({ label: "Finished", state: "upcoming" });
  return steps;
}

const LIVE_STOP_STATUSES = new Set(["WAITING", "CALLED", "IN_SERVICE"]);

/** A queue stop in words, such as "Vital signs" or "Doctor (Chukwudi Okeke)". */
function describeQueueStop(stop: QueueEntry): string {
  if (stop.kind === "TRIAGE") return "Vital signs";
  if (stop.kind === "DEPARTMENT") return stop.departmentName ?? "Department";
  return stop.resourceName ? `Doctor (${stop.resourceName})` : "Doctor";
}

/**
 * A visit's real path from its stops, oldest first: each stop done or under
 * way, then how the visit ended, or "Finished" still to come.
 */
export function describeVisitStops(visit: VisitDetail): VisitProgressStep[] {
  const steps: VisitProgressStep[] = [{ label: "Checked in", state: "done" }];
  for (const stop of visit.stops) {
    if (LIVE_STOP_STATUSES.has(stop.status)) {
      steps.push({
        label: describeQueueStop(stop),
        state: "current",
        detail:
          stop.status === "WAITING"
            ? `waiting ${describeWait(stop.waitingMinutes, stop.waitState)}`
            : stop.status === "CALLED"
              ? "called"
              : "with staff",
      });
    } else if (stop.status === "LEFT") {
      steps.push({
        label: `Left from ${describeQueueStop(stop)}`,
        state: "done",
      });
    } else {
      steps.push({ label: describeQueueStop(stop), state: "done" });
    }
  }
  if (visit.status === "COMPLETED") {
    steps.push({ label: "Finished", state: "done" });
  } else if (visit.status === "OPEN") {
    steps.push({ label: "Finished", state: "upcoming" });
  }
  return steps;
}
