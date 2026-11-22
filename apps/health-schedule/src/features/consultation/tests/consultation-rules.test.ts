import { describe, expect, it } from "vitest";
import {
  describeVitalSigns,
  findOwnCalendar,
} from "~/features/consultation/utilities/consultation-rules";

describe("the doctor's own queue", () => {
  const calendars = [
    { id: "room", kind: "ROOM", memberId: null, isActive: true },
    {
      id: "paused",
      kind: "PRACTITIONER",
      memberId: "member-1",
      isActive: false,
    },
    { id: "mine", kind: "PRACTITIONER", memberId: "member-1", isActive: true },
    {
      id: "colleague",
      kind: "PRACTITIONER",
      memberId: "member-2",
      isActive: true,
    },
  ];

  it("finds the active practitioner calendar of the signed-in member", () => {
    expect(findOwnCalendar(calendars, "member-1")?.id).toBe("mine");
  });

  it("finds nothing without a calendar or a membership", () => {
    expect(findOwnCalendar(calendars, "member-3")).toBeUndefined();
    expect(findOwnCalendar(calendars, null)).toBeUndefined();
  });
});

describe("vital signs", () => {
  it("lists what was taken, in plain units, and leaves out the rest", () => {
    expect(
      describeVitalSigns({
        id: "triage",
        visitId: "visit",
        band: "YELLOW",
        suggestedBand: "YELLOW",
        dangerSigns: [],
        recordedAt: "2026-11-20T09:00:00Z",
        complaint: "Fever",
        temperatureC: 38.4,
        heartRate: 98,
        respiratoryRate: 22,
        systolicBp: 104,
        diastolicBp: 68,
        spo2: 94,
        consciousness: "ALERT",
        glucoseMmolL: null,
        painScore: null,
        notes: null,
        overrideReason: null,
      })
    ).toEqual([
      { term: "Temperature", description: "38.4 °C" },
      { term: "Pulse", description: "98 a minute" },
      { term: "Breathing", description: "22 a minute" },
      { term: "Blood pressure", description: "104/68 mmHg" },
      { term: "Oxygen", description: "94%" },
      { term: "Consciousness", description: "Alert" },
    ]);
  });
});
