import { describe, expect, it } from "vitest";
import type { AvailabilityRule } from "~/features/schedule-setup/schemas/schedule-response-schemas";
import {
  findWorkingPeriodProblems,
  summarizeWeeklyHours,
  toAvailabilityRules,
  toWeeklyHoursDays,
} from "~/features/schedule-setup/utilities/weekly-hours";

const HEAD_OFFICE = "0f6b4c2a-1d3e-4f5a-8b7c-9d0e1f2a3b4c";
const ABUJA = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";

function rule(
  weekday: number,
  startTime: string,
  endTime: string,
  branchId = HEAD_OFFICE,
  validity: Partial<Pick<AvailabilityRule, "validFrom" | "validUntil">> = {}
): AvailabilityRule {
  return {
    branchId,
    weekday,
    startTime,
    endTime,
    validFrom: validity.validFrom ?? null,
    validUntil: validity.validUntil ?? null,
  };
}

function sequentialKeys() {
  let keyNumber = 0;
  return () => `period-${++keyNumber}`;
}

describe("weekly hours for the editor", () => {
  it("lists every weekday, Monday first, with one branch's periods in order", () => {
    const { days } = toWeeklyHoursDays(
      [
        rule(1, "14:00", "17:00"),
        rule(1, "08:00", "12:00"),
        rule(2, "09:00", "13:00", ABUJA),
      ],
      HEAD_OFFICE,
      sequentialKeys()
    );
    expect(days.map((day) => day.label)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(days[0]?.periods.map((period) => period.startTime)).toEqual([
      "08:00",
      "14:00",
    ]);
    expect(days[1]?.periods).toEqual([]);
  });

  it("keeps other branches' rules and period dates when saving", () => {
    const existingRules = [
      rule(1, "08:00", "12:00", HEAD_OFFICE, { validFrom: "2026-12-01" }),
      rule(2, "09:00", "13:00", ABUJA),
    ];
    const { days, dateLimits } = toWeeklyHoursDays(
      existingRules,
      HEAD_OFFICE,
      sequentialKeys()
    );
    expect(
      toAvailabilityRules(days, HEAD_OFFICE, existingRules, dateLimits)
    ).toEqual([
      { branchId: ABUJA, weekday: 2, startTime: "09:00", endTime: "13:00" },
      {
        branchId: HEAD_OFFICE,
        weekday: 1,
        startTime: "08:00",
        endTime: "12:00",
        validFrom: "2026-12-01",
      },
    ]);
  });
});

describe("working period problems", () => {
  const day = (
    periods: { key: string; startTime: string; endTime: string }[]
  ) => [{ weekday: 1, label: "Monday", periods }];

  it("asks for an end after the start", () => {
    expect(
      findWorkingPeriodProblems(
        day([{ key: "first", startTime: "12:00", endTime: "09:00" }])
      )
    ).toEqual({ first: "End after the start time." });
  });

  it("finds an overlap on the same day, whatever order the periods are in", () => {
    expect(
      findWorkingPeriodProblems(
        day([
          { key: "late", startTime: "11:00", endTime: "15:00" },
          { key: "early", startTime: "08:00", endTime: "12:00" },
        ])
      )
    ).toEqual({ late: "This overlaps another period on Monday." });
  });

  it("allows one period to end as the next begins", () => {
    expect(
      findWorkingPeriodProblems(
        day([
          { key: "morning", startTime: "08:00", endTime: "12:00" },
          { key: "afternoon", startTime: "12:00", endTime: "16:00" },
        ])
      )
    ).toEqual({});
  });

  it("asks for both times", () => {
    expect(
      findWorkingPeriodProblems(
        day([{ key: "first", startTime: "", endTime: "16:00" }])
      )
    ).toEqual({ first: "Enter a start and an end time." });
  });
});

describe("weekly hours summary", () => {
  it("groups consecutive days with the same hours", () => {
    const weekdays = [1, 2, 3, 4, 5].map((weekday) =>
      rule(weekday, "08:00", "16:00")
    );
    expect(summarizeWeeklyHours([...weekdays, rule(6, "09:00", "13:00")])).toBe(
      "Mon–Fri 08:00–16:00; Sat 09:00–13:00"
    );
  });

  it("counts only the chosen branch", () => {
    expect(
      summarizeWeeklyHours(
        [rule(1, "08:00", "16:00"), rule(3, "09:00", "12:00", ABUJA)],
        ABUJA
      )
    ).toBe("Wed 09:00–12:00");
  });

  it("says when there are no hours", () => {
    expect(summarizeWeeklyHours([])).toBe("No hours set");
  });
});
