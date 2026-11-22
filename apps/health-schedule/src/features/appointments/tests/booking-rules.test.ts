import { describe, expect, it } from "vitest";
import type {
  Appointment,
  Slot,
} from "~/features/appointments/schemas/appointment-response-schemas";
import {
  canRecordNoShow,
  describeAppointmentStatus,
  describeBookingError,
  describeCalendarDay,
  listPastAppointments,
  listUpcomingAppointments,
  needsFreshSlots,
  sortDayAppointments,
} from "~/features/appointments/utilities/appointment-presentation";
import { withoutBlankNotes } from "~/features/appointments/utilities/appointment-requests";
import {
  decodeSlot,
  describeCountdown,
  describeSlotDays,
  describeWeek,
  encodeSlot,
  firstDayWithSlots,
  groupSlotsByCalendar,
  listWeekDates,
  secondsUntil,
  slotDate,
} from "~/features/appointments/utilities/slot-choices";

const DOCTOR = "calendar-doctor";
const NURSE = "calendar-nurse";

function slot(resourceId: string, startsAt: string, available = 1): Slot {
  return { resourceId, startsAt, endsAt: startsAt, available };
}

function appointment(changes: Partial<Appointment>): Appointment {
  return {
    id: "appointment-1",
    status: "BOOKED",
    branchId: "branch-1",
    resourceId: DOCTOR,
    resourceName: "Dr Bello",
    appointmentTypeId: "type-1",
    appointmentTypeName: "General consultation",
    patient: null,
    startsAt: "2026-11-23T09:00:00+01:00",
    endsAt: "2026-11-23T09:20:00+01:00",
    holdExpiresAt: null,
    isNewPatient: false,
    isOverride: false,
    notes: null,
    source: "STAFF",
    rescheduleCount: 0,
    cancelReason: null,
    cancelledBy: null,
    bookedAt: "2026-11-20T10:00:00+01:00",
    version: 1,
    ...changes,
  };
}

const SLOTS = [
  slot(DOCTOR, "2026-11-23T10:00:00+01:00"),
  slot(DOCTOR, "2026-11-23T09:00:00+01:00"),
  slot(NURSE, "2026-11-23T09:30:00+01:00"),
  slot(DOCTOR, "2026-11-24T09:00:00+01:00", 0),
  slot(NURSE, "2026-11-25T08:00:00+01:00"),
];
const WEEK = listWeekDates("2026-11-23", 7);

describe("free times", () => {
  it("lists the seven dates of a week", () => {
    expect(WEEK).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
      "2026-11-29",
    ]);
    expect(describeWeek(WEEK)).toBe("23 – 29 Nov 2026");
    expect(describeWeek(listWeekDates("2026-11-28", 7))).toBe(
      "28 Nov – 4 Dec 2026"
    );
  });

  it("reads a time's date at the branch, not in UTC", () => {
    expect(slotDate("2026-11-23T23:30:00Z")).toBe("2026-11-24");
  });

  it("counts free times per day, leaving out full ones", () => {
    const days = describeSlotDays({
      dates: WEEK,
      slots: SLOTS,
      resourceId: null,
    });
    expect(days.slice(0, 3)).toEqual([
      {
        value: "2026-11-23",
        label: "Mon 23 Nov",
        detail: "3 free",
        disabled: false,
      },
      {
        value: "2026-11-24",
        label: "Tue 24 Nov",
        detail: "None free",
        disabled: true,
      },
      {
        value: "2026-11-25",
        label: "Wed 25 Nov",
        detail: "1 free",
        disabled: false,
      },
    ]);
  });

  it("narrows to one calendar when the desk chooses who", () => {
    expect(
      firstDayWithSlots({ dates: WEEK, slots: SLOTS, resourceId: NURSE })
    ).toBe("2026-11-23");
    expect(
      describeSlotDays({ dates: WEEK, slots: SLOTS, resourceId: NURSE })[0]
        ?.detail
    ).toBe("1 free");
    expect(
      firstDayWithSlots({ dates: WEEK, slots: [], resourceId: null })
    ).toBeNull();
  });

  it("groups a day's times by calendar, in time order", () => {
    const groups = groupSlotsByCalendar({
      date: "2026-11-23",
      slots: SLOTS,
      resourceId: null,
      calendarNames: new Map([
        [DOCTOR, "Dr Bello"],
        [NURSE, "Antenatal nurse"],
      ]),
    });
    expect(
      groups.map((group) => [
        group.label,
        group.slots.map((choice) => choice.label),
      ])
    ).toEqual([
      ["Antenatal nurse", ["9:30 am"]],
      ["Dr Bello", ["9:00 am", "10:00 am"]],
    ]);
  });

  it("encodes a time as one value and reads it back", () => {
    const value = encodeSlot({
      resourceId: DOCTOR,
      startsAt: "2026-11-23T10:00:00+01:00",
    });
    expect(decodeSlot(value)).toEqual({
      resourceId: DOCTOR,
      startsAt: "2026-11-23T10:00:00+01:00",
    });
    expect(decodeSlot("not a slot")).toBeNull();
  });

  it("counts a hold down without going below zero", () => {
    const now = new Date("2026-11-23T08:00:00Z");
    expect(secondsUntil("2026-11-23T08:04:05Z", now)).toBe(245);
    expect(secondsUntil("2026-11-23T07:59:00Z", now)).toBe(0);
    expect(describeCountdown(245)).toBe("4:05");
    expect(describeCountdown(0)).toBe("0:00");
  });
});

describe("appointments", () => {
  const now = new Date("2026-11-23T08:30:00Z");

  it("splits coming bookings from past and finished ones", () => {
    const appointments = [
      appointment({
        id: "later",
        startsAt: "2026-11-30T09:00:00+01:00",
        endsAt: "2026-11-30T09:20:00+01:00",
      }),
      appointment({
        id: "soon",
        startsAt: "2026-11-23T10:00:00+01:00",
        endsAt: "2026-11-23T10:20:00+01:00",
      }),
      appointment({
        id: "cancelled",
        status: "CANCELLED",
        startsAt: "2026-11-25T09:00:00+01:00",
      }),
      appointment({
        id: "seen",
        status: "COMPLETED",
        startsAt: "2026-11-02T09:00:00+01:00",
      }),
      appointment({ id: "held", status: "HELD" }),
    ];
    expect(
      listUpcomingAppointments(appointments, now).map((item) => item.id)
    ).toEqual(["soon", "later"]);
    expect(
      listPastAppointments(appointments, now).map((item) => item.id)
    ).toEqual(["cancelled", "seen"]);
  });

  it("leaves holds out of the day and keeps it in time order", () => {
    expect(
      sortDayAppointments([
        appointment({ id: "ten", startsAt: "2026-11-23T10:00:00+01:00" }),
        appointment({ id: "held", status: "HELD" }),
        appointment({ id: "nine", startsAt: "2026-11-23T09:00:00+01:00" }),
      ]).map((item) => item.id)
    ).toEqual(["nine", "ten"]);
  });

  it("allows 'did not come' only once the appointment has started", () => {
    expect(
      canRecordNoShow(
        appointment({ startsAt: "2026-11-23T09:00:00+01:00" }),
        now
      )
    ).toBe(true);
    expect(
      canRecordNoShow(
        appointment({ startsAt: "2026-11-23T10:00:00+01:00" }),
        now
      )
    ).toBe(false);
    expect(
      canRecordNoShow(
        appointment({
          status: "ARRIVED",
          startsAt: "2026-11-23T09:00:00+01:00",
        }),
        now
      )
    ).toBe(false);
  });

  it("says when a booking ended without being checked in or missed", () => {
    expect(
      describeAppointmentStatus(
        appointment({ endsAt: "2026-11-23T09:20:00+01:00" }),
        now
      )
    ).toEqual({ label: "Not checked in", tone: "neutral" });
    expect(
      describeAppointmentStatus(
        appointment({ endsAt: "2026-11-23T10:20:00+01:00" }),
        now
      ).label
    ).toBe("Booked");
  });

  it("describes a calendar's day, including leave", () => {
    expect(
      describeCalendarDay({
        hours: [{ startTime: "08:00", endTime: "16:00" }],
        closures: [],
      })
    ).toBe("Open 8:00 am – 4:00 pm");
    expect(
      describeCalendarDay({
        hours: [{ startTime: "08:00", endTime: "12:00" }],
        closures: [
          {
            kind: "LEAVE",
            startsAt: "2026-11-23T00:00:00+01:00",
            endsAt: "2026-11-24T00:00:00+01:00",
            reason: "annual leave",
          },
        ],
      })
    ).toBe("On leave: annual leave (usually 8:00 am – 12:00 pm)");
    expect(describeCalendarDay({ hours: [], closures: [] })).toBe(
      "No hours this day"
    );
  });

  it("explains refusals the desk can act on, and when to reload times", () => {
    expect(describeBookingError("SLOT_TAKEN", "fallback")).toBe(
      "Someone else just booked that time. Choose another time."
    );
    expect(describeBookingError("SOMETHING_ELSE", "fallback")).toBe("fallback");
    expect(describeBookingError(null, "fallback")).toBe("fallback");
    expect(needsFreshSlots("HOLD_EXPIRED")).toBe(true);
    expect(needsFreshSlots("VERSION_CONFLICT")).toBe(false);
    expect(needsFreshSlots(null)).toBe(false);
  });

  it("does not send blank notes", () => {
    expect(withoutBlankNotes({ id: "a", notes: "   " }).notes).toBeUndefined();
    expect(withoutBlankNotes({ id: "a", notes: " Bring results " }).notes).toBe(
      "Bring results"
    );
  });
});
