import { describe, expect, it } from "vitest";
import {
  buildSetupSteps,
  countPatients,
  countWaiting,
} from "~/features/product-access/utilities/todays-work";

describe("today's work", () => {
  it("counts the patients waiting in each kind of queue", () => {
    const queues = [
      { kind: "TRIAGE", waiting: 2 },
      { kind: "CONSULTATION", waiting: 1 },
      { kind: "CONSULTATION", waiting: 3 },
    ] as const;
    expect(countWaiting(queues, "TRIAGE")).toBe(2);
    expect(countWaiting(queues, "CONSULTATION")).toBe(4);
    expect(countWaiting(queues, "DEPARTMENT")).toBe(0);
    expect(countWaiting(undefined, "TRIAGE")).toBe(0);
  });

  it("names one patient and several patients", () => {
    expect(countPatients(1)).toBe("1 patient");
    expect(countPatients(3)).toBe("3 patients");
  });
});

describe("setup checklist", () => {
  const withHours = {
    name: "Chukwudi Okeke",
    isActive: true,
    availability: [{}],
  };

  it("asks for calendars and appointment types in a new organisation", () => {
    const steps = buildSetupSteps({ calendars: [], appointmentTypes: [] });
    expect(steps.map((step) => step.isComplete)).toEqual([false, false]);
    expect(steps[0]?.action?.label).toBe("Add calendars");
  });

  it("names the one calendar still without hours", () => {
    const steps = buildSetupSteps({
      calendars: [
        withHours,
        { name: "Zainab Lawal", isActive: true, availability: [] },
        { name: "Old room", isActive: false, availability: [] },
      ],
      appointmentTypes: [{ isActive: true }],
    });
    expect(steps[0]).toMatchObject({
      isComplete: false,
      description: "Zainab Lawal has no hours yet, so cannot be booked.",
    });
    expect(steps[1]?.isComplete).toBe(true);
  });

  it("is complete when every active calendar has hours and something can be booked", () => {
    const steps = buildSetupSteps({
      calendars: [withHours],
      appointmentTypes: [{ isActive: false }, { isActive: true }],
    });
    expect(steps.every((step) => step.isComplete)).toBe(true);
    expect(steps[1]?.description).toBe("1 appointment type can be booked.");
  });
});
