import { describe, expect, it } from "vitest";
import type {
  OpenVisit,
  QueueEntry,
  VisitDetail,
} from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  describeVisitProgress,
  describeVisitStops,
} from "~/features/patient-flow/utilities/visit-progress";

function visit(changes: Partial<OpenVisit>): OpenVisit {
  return {
    visitId: "visit-1",
    token: "A001",
    kind: "WALK_IN",
    patient: {
      id: "patient-1",
      patientNumber: "P000001",
      firstName: "Uche",
      lastName: "Johnson",
      phone: null,
    },
    triageBand: null,
    checkedInAt: "2026-11-21T08:00:00+01:00",
    visitMinutes: 20,
    visitState: "GREEN",
    current: null,
    ...changes,
  };
}

function describeSteps(openVisit: OpenVisit): string[] {
  return describeVisitProgress(openVisit).map(
    (step) =>
      `${step.state}: ${step.label}${step.detail ? ` (${step.detail})` : ""}`
  );
}

describe("visit progress", () => {
  it("shows a new arrival waiting for vital signs", () => {
    expect(
      describeSteps(
        visit({
          current: {
            kind: "TRIAGE",
            departmentName: null,
            resourceName: null,
            status: "WAITING",
            minutes: 12,
            state: "GREEN",
          },
        })
      )
    ).toEqual([
      "done: Checked in",
      "current: Vital signs (waiting 12 min)",
      "upcoming: Finished",
    ]);
  });

  it("marks vital signs done once taken, and names the doctor", () => {
    expect(
      describeSteps(
        visit({
          triageBand: "YELLOW",
          current: {
            kind: "CONSULTATION",
            departmentName: null,
            resourceName: "Chukwudi Okeke",
            status: "IN_SERVICE",
            minutes: 5,
            state: null,
          },
        })
      )
    ).toEqual([
      "done: Checked in",
      "done: Vital signs",
      "current: Doctor (Chukwudi Okeke) (with staff)",
      "upcoming: Finished",
    ]);
  });

  it("does not claim vital signs for a patient sent straight to a department", () => {
    expect(
      describeSteps(
        visit({
          current: {
            kind: "DEPARTMENT",
            departmentName: "Laboratory",
            resourceName: null,
            status: "CALLED",
            minutes: 2,
            state: null,
          },
        })
      )
    ).toEqual([
      "done: Checked in",
      "current: Laboratory (called)",
      "upcoming: Finished",
    ]);
  });

  it("says when a patient is between queues", () => {
    expect(describeSteps(visit({ triageBand: "GREEN" }))).toEqual([
      "done: Checked in",
      "done: Vital signs",
      "current: Between queues",
      "upcoming: Finished",
    ]);
  });
});

function stop(changes: Partial<QueueEntry>): QueueEntry {
  return {
    id: "stop-1",
    visitId: "visit-1",
    token: "A001",
    patient: {
      id: "patient-1",
      patientNumber: "P000001",
      firstName: "Uche",
      lastName: "Johnson",
      phone: null,
    },
    kind: "TRIAGE",
    departmentId: null,
    departmentName: null,
    resourceId: null,
    resourceName: null,
    status: "DONE",
    triageBand: null,
    appointment: null,
    note: null,
    skipCount: 0,
    enqueuedAt: "2026-11-21T08:00:00+01:00",
    waitingMinutes: 0,
    waitTargetMinutes: 30,
    waitState: null,
    visitMinutes: 30,
    visitState: "GREEN",
    ...changes,
  };
}

function describeStops(visitDetail: VisitDetail): string[] {
  return describeVisitStops(visitDetail).map(
    (step) =>
      `${step.state}: ${step.label}${step.detail ? ` (${step.detail})` : ""}`
  );
}

describe("visit stops", () => {
  const visitDetail = (changes: Partial<VisitDetail>): VisitDetail => ({
    id: "visit-1",
    token: "A001",
    status: "OPEN",
    checkedInAt: "2026-11-21T08:00:00+01:00",
    endedAt: null,
    leftReason: null,
    stops: [],
    ...changes,
  });

  it("follows every stop to where the patient is now", () => {
    expect(
      describeStops(
        visitDetail({
          stops: [
            stop({ kind: "TRIAGE", status: "TRANSFERRED" }),
            stop({
              id: "stop-2",
              kind: "CONSULTATION",
              resourceName: "Fatima Abubakar",
              status: "DONE",
            }),
            stop({
              id: "stop-3",
              kind: "DEPARTMENT",
              departmentName: "Laboratory",
              status: "WAITING",
              waitingMinutes: 8,
            }),
          ],
        })
      )
    ).toEqual([
      "done: Checked in",
      "done: Vital signs",
      "done: Doctor (Fatima Abubakar)",
      "current: Laboratory (waiting 8 min)",
      "upcoming: Finished",
    ]);
  });

  it("shows a finished visit as done, and where a patient left", () => {
    expect(
      describeStops(
        visitDetail({ status: "COMPLETED", stops: [stop({ status: "DONE" })] })
      )
    ).toEqual(["done: Checked in", "done: Vital signs", "done: Finished"]);
    expect(
      describeStops(
        visitDetail({ status: "LEFT", stops: [stop({ status: "LEFT" })] })
      )
    ).toEqual(["done: Checked in", "done: Left from Vital signs"]);
  });
});
