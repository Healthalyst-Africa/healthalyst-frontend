import { TZDate } from "@date-fns/tz";
import { addDays, format, parse } from "date-fns";
import type { Slot } from "~/features/appointments/schemas/appointment-response-schemas";
import { BRANCH_TIME_ZONE } from "~/config/branch-time";
import { describeBranchClockTime } from "~/shared/time/branch-time";

const DATE_VALUE_FORMAT = "yyyy-MM-dd";
const SLOT_VALUE_SEPARATOR = "|";

/** A free time as one picker value: its calendar and start. */
export function encodeSlot(slot: Pick<Slot, "resourceId" | "startsAt">) {
  return `${slot.resourceId}${SLOT_VALUE_SEPARATOR}${slot.startsAt}`;
}

export function decodeSlot(
  value: string
): { resourceId: string; startsAt: string } | null {
  const [resourceId, startsAt] = value.split(SLOT_VALUE_SEPARATOR);
  return resourceId && startsAt ? { resourceId, startsAt } : null;
}

/** The branch-local date a free time starts on, `yyyy-MM-dd`. */
export function slotDate(startsAt: string): string {
  return format(new TZDate(startsAt, BRANCH_TIME_ZONE), DATE_VALUE_FORMAT);
}

/** The dates of a week starting on a branch-local date. */
export function listWeekDates(firstDate: string, days: number): string[] {
  const first = parse(firstDate, DATE_VALUE_FORMAT, new Date());
  return [...Array(days).keys()].map((dayIndex) =>
    format(addDays(first, dayIndex), DATE_VALUE_FORMAT)
  );
}

export function shiftDate(dateValue: string, days: number): string {
  return format(
    addDays(parse(dateValue, DATE_VALUE_FORMAT, new Date()), days),
    DATE_VALUE_FORMAT
  );
}

/** Such as "Mon 23 Nov". */
export function describeShortDate(dateValue: string): string {
  return format(parse(dateValue, DATE_VALUE_FORMAT, new Date()), "EEE d MMM");
}

/** Such as "23 – 29 Nov 2026" or "28 Nov – 4 Dec 2026". */
export function describeWeek(dates: readonly string[]): string {
  const first = parse(dates[0] ?? "", DATE_VALUE_FORMAT, new Date());
  const last = parse(dates.at(-1) ?? "", DATE_VALUE_FORMAT, new Date());
  return first.getMonth() === last.getMonth()
    ? `${format(first, "d")} – ${format(last, "d MMM yyyy")}`
    : `${format(first, "d MMM")} – ${format(last, "d MMM yyyy")}`;
}

/** Only free times with at least one place left, from one calendar or any. */
function usableSlots(slots: readonly Slot[], resourceId: string | null) {
  return slots.filter(
    (slot) =>
      slot.available > 0 &&
      (resourceId === null || slot.resourceId === resourceId)
  );
}

/** Each day of the week with how many free times it has. */
export function describeSlotDays({
  dates,
  slots,
  resourceId,
}: {
  dates: readonly string[];
  slots: readonly Slot[];
  resourceId: string | null;
}) {
  const usable = usableSlots(slots, resourceId);
  return dates.map((date) => {
    const count = usable.filter(
      (slot) => slotDate(slot.startsAt) === date
    ).length;
    return {
      value: date,
      label: describeShortDate(date),
      detail:
        count === 0 ? "None free" : count === 1 ? "1 free" : `${count} free`,
      disabled: count === 0,
    };
  });
}

/** The first day of the week with a free time, so the desk sees times at once. */
export function firstDayWithSlots({
  dates,
  slots,
  resourceId,
}: {
  dates: readonly string[];
  slots: readonly Slot[];
  resourceId: string | null;
}): string | null {
  const usable = usableSlots(slots, resourceId);
  return (
    dates.find((date) =>
      usable.some((slot) => slotDate(slot.startsAt) === date)
    ) ?? null
  );
}

/** A day's free times grouped by calendar, each in time order. */
export function groupSlotsByCalendar({
  date,
  slots,
  resourceId,
  calendarNames,
}: {
  date: string;
  slots: readonly Slot[];
  resourceId: string | null;
  calendarNames: ReadonlyMap<string, string>;
}) {
  const daySlots = usableSlots(slots, resourceId)
    .filter((slot) => slotDate(slot.startsAt) === date)
    .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
  const groups = new Map<
    string,
    { label: string; slots: { value: string; label: string }[] }
  >();
  for (const slot of daySlots) {
    const group = groups.get(slot.resourceId) ?? {
      label: calendarNames.get(slot.resourceId) ?? "Another calendar",
      slots: [],
    };
    group.slots.push({
      value: encodeSlot(slot),
      label: describeBranchClockTime(slot.startsAt),
    });
    groups.set(slot.resourceId, group);
  }
  return [...groups.values()].sort((first, second) =>
    first.label.localeCompare(second.label)
  );
}

/** Seconds left on a hold, never below zero. */
export function secondsUntil(dateTime: string, now: Date): number {
  return Math.max(
    0,
    Math.round((new Date(dateTime).getTime() - now.getTime()) / 1000)
  );
}

/** Such as "4:05". */
export function describeCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}
