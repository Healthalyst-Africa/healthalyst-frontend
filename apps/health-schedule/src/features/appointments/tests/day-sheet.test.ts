import { describe, expect, it } from "vitest";
import type {
  DayBoard,
  DayBoardCalendar,
} from "~/features/appointments/schemas/appointment-response-schemas";
import {
  buildCalendarFilterOptions,
  describeWith,
  EVERY_CALENDAR,
  listDayAppointments,
} from "~/features/appointments/utilities/day-sheet";

function booking(identifier: string, startsAt: string) {
  return {
    id: identifier,
    status: "BOOKED" as const,
    branchId: "branch-1",
    resourceId: "calendar",
    resourceName: "Calendar",
    appointmentTypeId: "type-1",
    appointmentTypeName: "General consultation",
    patient: null,
    startsAt,
    endsAt: startsAt,
    holdExpiresAt: null,
    isNewPatient: false,
    isOverride: false,
    notes: null,
    source: "STAFF" as const,
    rescheduleCount: 0,
    cancelReason: null,
    cancelledBy: null,
    bookedAt: null,
    version: 1,
    issue: null,
  };
}

function calendar(changes: Partial<DayBoardCalendar>): DayBoardCalendar {
  return {
    resourceId: "calendar",
    name: "Calendar",
    kind: "PRACTITIONER",
    hours: [],
    closures: [],
    appointments: [],
    ...changes,
  };
}

const DAY: DayBoard = {
  date: "2026-11-23",
  timeZone: "Africa/Lagos",
  branchId: "branch-1",
  summary: {
    booked: 3,
    arrived: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    needsAttention: 0,
    waiting: 0,
  },
  calendars: [
    calendar({
      resourceId: "scan",
      name: "Ultrasound room",
      kind: "ROOM",
      appointments: [booking("scan-eight", "2026-11-23T08:00:00+01:00")],
    }),
    calendar({
      resourceId: "okeke",
      name: "Chukwudi Okeke",
      appointments: [
        booking("okeke-nine", "2026-11-23T09:00:00+01:00"),
        booking("okeke-eight", "2026-11-23T08:00:00+01:00"),
      ],
    }),
    calendar({ resourceId: "adeleke", name: "Olumide Adeleke" }),
  ],
};

describe("the day sheet", () => {
  it("lists every booking in time order, people before rooms at the same time", () => {
    expect(
      listDayAppointments(DAY, EVERY_CALENDAR).map((item) => item.id)
    ).toEqual(["okeke-eight", "scan-eight", "okeke-nine"]);
  });

  it("narrows to the chosen calendar", () => {
    expect(listDayAppointments(DAY, "scan").map((item) => item.id)).toEqual([
      "scan-eight",
    ]);
  });

  it("offers everyone, then people, then rooms, each in name order", () => {
    expect(
      buildCalendarFilterOptions(DAY).map(
        (option) => `${option.group ?? ""}: ${option.label}`
      )
    ).toEqual([
      ": Everyone",
      "Doctors and nurses: Chukwudi Okeke",
      "Doctors and nurses: Olumide Adeleke",
      "Rooms and equipment: Ultrasound room",
    ]);
  });

  it("says who or what a booking is with", () => {
    expect(describeWith({ kind: "PRACTITIONER", name: "Dr Bello" })).toBe(
      "with Dr Bello"
    );
    expect(describeWith({ kind: "ROOM", name: "Ultrasound room" })).toBe(
      "in Ultrasound room"
    );
    expect(describeWith({ kind: "EQUIPMENT", name: "X-ray machine" })).toBe(
      "using X-ray machine"
    );
  });
});
