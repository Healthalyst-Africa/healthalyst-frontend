import { describe, expect, it } from "vitest";
import {
  appointmentTypeFormSchema,
  createCalendarFormSchema,
  timeOffFormSchema,
  type TimeOffFormValues,
} from "~/features/schedule-setup/schemas/schedule-form-schemas";
import {
  branchToday,
  describeBranchPeriod,
  upcomingBranchPeriod,
} from "~/features/schedule-setup/utilities/branch-time";
import {
  formatNaira,
  koboToNairaText,
  nairaTextToKobo,
} from "~/features/schedule-setup/utilities/naira-amount";
import {
  toAppointmentTypeFormValues,
  toAppointmentTypeRequest,
  toCreateTimeOffRequest,
} from "~/features/schedule-setup/utilities/schedule-requests";

const CALENDAR = "2b3c4d5e-6f70-4b8c-9d0e-1f2a3b4c5d6e";

function timeOffValues(
  changes: Partial<TimeOffFormValues> = {}
): TimeOffFormValues {
  return {
    appliesTo: "calendar",
    calendarId: CALENDAR,
    branchId: "",
    kind: "LEAVE",
    allDay: true,
    startDate: "2026-12-24",
    startTime: "09:00",
    endDate: "2026-12-26",
    endTime: "17:00",
    reason: "",
    ...changes,
  };
}

describe("branch time", () => {
  it("writes whole days of leave in Lagos time, ending the morning after", () => {
    expect(toCreateTimeOffRequest(timeOffValues())).toEqual({
      resourceId: CALENDAR,
      kind: "LEAVE",
      startsAt: "2026-12-24T00:00:00.000+01:00",
      endsAt: "2026-12-27T00:00:00.000+01:00",
    });
  });

  it("writes timed periods and a whole-branch holiday", () => {
    expect(
      toCreateTimeOffRequest(
        timeOffValues({
          appliesTo: "branch",
          branchId: "branch-identifier",
          kind: "HOLIDAY",
          allDay: false,
          endDate: "2026-12-24",
          reason: "Staff party",
        })
      )
    ).toEqual({
      branchId: "branch-identifier",
      kind: "HOLIDAY",
      startsAt: "2026-12-24T09:00:00.000+01:00",
      endsAt: "2026-12-24T17:00:00.000+01:00",
      reason: "Staff party",
    });
  });

  it("describes whole days as dates and other periods with times", () => {
    expect(
      describeBranchPeriod(
        "2026-12-24T00:00:00.000+01:00",
        "2026-12-27T00:00:00.000+01:00"
      )
    ).toBe("Thu 24 Dec – Sat 26 Dec 2026");
    expect(
      describeBranchPeriod(
        "2026-12-25T00:00:00.000+01:00",
        "2026-12-26T00:00:00.000+01:00"
      )
    ).toBe("Fri 25 Dec 2026, all day");
    expect(
      describeBranchPeriod(
        "2026-12-24T09:00:00.000+01:00",
        "2026-12-24T17:00:00.000+01:00"
      )
    ).toBe("Thu 24 Dec 2026, 09:00 – 17:00");
  });

  it("uses the branch's date, not the device's, for today", () => {
    // 23:30 UTC on 9 November is already 10 November in Lagos.
    expect(branchToday(new Date("2026-11-09T23:30:00Z"))).toBe("2026-11-10");
    expect(upcomingBranchPeriod(30, new Date("2026-11-09T23:30:00Z"))).toEqual({
      from: "2026-11-10T00:00:00.000+01:00",
      to: "2026-12-10T00:00:00.000+01:00",
    });
  });
});

describe("time off form", () => {
  it("refuses a holiday on a single calendar", () => {
    const result = timeOffFormSchema.safeParse(
      timeOffValues({ kind: "HOLIDAY" })
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["kind"]);
  });

  it("refuses an end before the start", () => {
    const result = timeOffFormSchema.safeParse(
      timeOffValues({
        allDay: false,
        endDate: "2026-12-24",
        startTime: "15:00",
        endTime: "10:00",
      })
    );
    expect(result.error?.issues[0]).toMatchObject({
      path: ["endTime"],
      message: "End after the start.",
    });
  });
});

describe("calendar form", () => {
  it("needs a staff member for a practitioner, and a name and branch for a room", () => {
    expect(
      createCalendarFormSchema
        .safeParse({
          kind: "PRACTITIONER",
          memberId: "",
          branchId: "",
          name: "",
        })
        .error?.issues.map((issue) => issue.path[0])
    ).toEqual(["memberId"]);
    expect(
      createCalendarFormSchema
        .safeParse({ kind: "ROOM", memberId: "", branchId: "", name: "" })
        .error?.issues.map((issue) => issue.path[0])
    ).toEqual(["name", "branchId"]);
  });
});

describe("naira amounts", () => {
  it.each([
    ["15000", 1_500_000],
    ["15,000.5", 1_500_050],
    ["0.05", 5],
    ["", null],
  ])("converts %s naira to kobo", (nairaText, kobo) => {
    expect(nairaTextToKobo(nairaText)).toBe(kobo);
  });

  it("shows kobo as editable naira and as a price", () => {
    expect(koboToNairaText(1_500_050)).toBe("15000.50");
    expect(koboToNairaText(1_500_000)).toBe("15000");
    expect(koboToNairaText(null)).toBe("");
    expect(formatNaira(1_500_000)).toContain("15,000.00");
  });
});

describe("appointment type form", () => {
  it("round-trips a saved type through the form", () => {
    const savedType = {
      id: "3c4d5e6f-7081-4c9d-8e0f-1a2b3c4d5e6f",
      name: "Antenatal visit",
      durationMinutes: 30,
      newPatientDurationMinutes: 45,
      bufferMinutes: 5,
      priceKobo: 1_500_000,
      modality: "IN_PERSON" as const,
      capacity: 1,
      minLeadMinutes: 120,
      maxAdvanceDays: 60,
      dailyCap: null,
      overbookPercent: 10,
      prepNotes: null,
      isActive: true,
      resourceIds: [CALENDAR],
      version: 3,
    };
    const formValues = toAppointmentTypeFormValues(savedType);
    expect(formValues.minimumNoticeHours).toBe("2");
    expect(appointmentTypeFormSchema.safeParse(formValues).success).toBe(true);
    expect(toAppointmentTypeRequest(formValues)).toEqual({
      name: "Antenatal visit",
      durationMinutes: 30,
      newPatientDurationMinutes: 45,
      bufferMinutes: 5,
      priceKobo: 1_500_000,
      modality: "IN_PERSON",
      capacity: 1,
      minLeadMinutes: 120,
      maxAdvanceDays: 60,
      dailyCap: null,
      overbookPercent: 10,
      prepNotes: null,
      resourceIds: [CALENDAR],
    });
  });

  it("explains a length outside the API's range", () => {
    const result = appointmentTypeFormSchema.safeParse({
      ...toAppointmentTypeFormValues(null),
      name: "Quick check",
      durationMinutes: "2",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Length must be a whole number from 5 to 480."
    );
  });
});
