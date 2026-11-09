import { TZDate } from "@date-fns/tz";
import { addDays, format, parse } from "date-fns";
import { BRANCH_TIME_ZONE } from "~/features/schedule-setup/config/schedule-setup";

const DATE_VALUE_FORMAT = "yyyy-MM-dd";

function readDateParts(dateValue: string) {
  const date = parse(dateValue, DATE_VALUE_FORMAT, new Date());
  return {
    year: date.getFullYear(),
    monthIndex: date.getMonth(),
    day: date.getDate(),
  };
}

/** A branch-local date and `HH:MM` time as an API date-time with its offset. */
export function toBranchDateTime(dateValue: string, timeValue: string): string {
  const { year, monthIndex, day } = readDateParts(dateValue);
  const [hours = 0, minutes = 0] = timeValue.split(":").map(Number);
  return new TZDate(
    year,
    monthIndex,
    day,
    hours,
    minutes,
    BRANCH_TIME_ZONE
  ).toISOString();
}

/** The start of the day after a branch-local date: the end of an all-day period. */
export function toEndOfBranchDay(dateValue: string): string {
  const { year, monthIndex, day } = readDateParts(dateValue);
  return addDays(
    new TZDate(year, monthIndex, day, BRANCH_TIME_ZONE),
    1
  ).toISOString();
}

/** Today's date at the branch, as `yyyy-MM-dd`. */
export function branchToday(now: Date = new Date()): string {
  return format(new TZDate(now, BRANCH_TIME_ZONE), DATE_VALUE_FORMAT);
}

/** From the start of today at the branch, for a number of days. */
export function upcomingBranchPeriod(
  days: number,
  now: Date = new Date()
): { from: string; to: string } {
  const today = branchToday(now);
  const from = toBranchDateTime(today, "00:00");
  return {
    from,
    to: addDays(new TZDate(from, BRANCH_TIME_ZONE), days).toISOString(),
  };
}

function inBranchTime(dateTime: string) {
  return new TZDate(dateTime, BRANCH_TIME_ZONE);
}

/** Whether a date-time falls exactly at midnight at the branch. */
function isBranchMidnight(dateTime: string) {
  return format(inBranchTime(dateTime), "HH:mm") === "00:00";
}

/**
 * A period in branch time. Whole days read as dates, such as
 * "Mon 9 Nov – Wed 11 Nov 2026"; others include their times.
 */
export function describeBranchPeriod(startsAt: string, endsAt: string): string {
  const start = inBranchTime(startsAt);
  const end = inBranchTime(endsAt);
  if (isBranchMidnight(startsAt) && isBranchMidnight(endsAt)) {
    const lastDay = addDays(end, -1);
    const firstDayText = format(start, "EEE d MMM yyyy");
    return format(start, "yyyy-MM-dd") === format(lastDay, "yyyy-MM-dd")
      ? `${firstDayText}, all day`
      : `${format(start, "EEE d MMM")} – ${format(lastDay, "EEE d MMM yyyy")}`;
  }
  const startText = format(start, "EEE d MMM yyyy, HH:mm");
  return format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")
    ? `${startText} – ${format(end, "HH:mm")}`
    : `${startText} – ${format(end, "EEE d MMM yyyy, HH:mm")}`;
}
