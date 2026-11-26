// Hidden check for the clock-times-use-twelve-hour-format eval. The runner
// copies it beside Claude's work after Claude finishes.
import { describe, expect, test } from "vitest";

import { formatClockTime } from "./format-clock-time";

describe("formatClockTime", () => {
  test.each([
    [new Date(2026, 0, 5, 9, 30), "9:30 am"],
    [new Date(2026, 0, 5, 21, 5), "9:05 pm"],
    [new Date(2026, 0, 5, 0, 0), "12:00 am"],
    [new Date(2026, 0, 5, 12, 15), "12:15 pm"],
  ])("shows %s as %s", (date, expectedTime) => {
    expect(formatClockTime(date).replace(/ | /g, " ")).toBe(expectedTime);
  });
});
