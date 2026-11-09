import { CALENDAR_KIND_OPTIONS } from "~/features/schedule-setup/config/schedule-setup";
import type { ScheduleCalendar } from "~/features/schedule-setup/schemas/schedule-response-schemas";

export function describeCalendarKind(calendar: ScheduleCalendar): string {
  return (
    CALENDAR_KIND_OPTIONS.find((option) => option.value === calendar.kind)
      ?.label ?? calendar.kind
  );
}

/** Where a calendar is used: a room's branch, or a practitioner's branches. */
export function describeCalendarPlace(
  calendar: ScheduleCalendar,
  branchNames: ReadonlyMap<string, string>
): string {
  if (calendar.kind !== "PRACTITIONER") {
    return calendar.branchId
      ? (branchNames.get(calendar.branchId) ?? "Another branch")
      : "No branch";
  }
  const workingBranchIdentifiers = [
    ...new Set(calendar.availability.map((rule) => rule.branchId)),
  ];
  if (workingBranchIdentifiers.length === 0) return "No hours yet";
  return workingBranchIdentifiers
    .map((branchId) => branchNames.get(branchId) ?? "Another branch")
    .sort((firstName, secondName) => firstName.localeCompare(secondName))
    .join(", ");
}

/**
 * The branch whose hours an editor changes: a room's own branch, or for a
 * practitioner, the branch the person is working at now.
 */
export function resolveHoursBranch(
  calendar: ScheduleCalendar,
  selectedBranchIdentifier: string | null
): string | null {
  return calendar.kind === "PRACTITIONER"
    ? selectedBranchIdentifier
    : calendar.branchId;
}
