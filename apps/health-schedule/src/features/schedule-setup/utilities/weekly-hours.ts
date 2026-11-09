import type { WeeklyHoursDay } from "@healthalyst/ui/components/weekly-hours-editor";
import { WEEKDAY_NAMES } from "~/features/schedule-setup/config/schedule-setup";
import type { AvailabilityRule } from "~/features/schedule-setup/schemas/schedule-response-schemas";

/** The request body's rule shape; dates are left out when not limited. */
export type AvailabilityRuleRequest = {
  branchId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  validFrom?: string;
  validUntil?: string;
};

/** Date limits on a period, kept when the hours are saved again. */
export type WorkingPeriodDateLimits = Record<
  string,
  { validFrom: string | null; validUntil: string | null }
>;

const SHORT_WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function compareStartTimes(
  firstRule: { startTime: string },
  secondRule: { startTime: string }
) {
  return firstRule.startTime.localeCompare(secondRule.startTime);
}

/** One branch's rules as editor days, Monday first. */
export function toWeeklyHoursDays(
  rules: readonly AvailabilityRule[],
  branchId: string,
  createKey: () => string
): { days: WeeklyHoursDay[]; dateLimits: WorkingPeriodDateLimits } {
  const dateLimits: WorkingPeriodDateLimits = {};
  const days = WEEKDAY_NAMES.map((weekdayName, weekdayIndex) => ({
    weekday: weekdayIndex + 1,
    label: weekdayName,
    periods: rules
      .filter(
        (rule) =>
          rule.branchId === branchId && rule.weekday === weekdayIndex + 1
      )
      .sort(compareStartTimes)
      .map((rule) => {
        const key = createKey();
        if (rule.validFrom || rule.validUntil) {
          dateLimits[key] = {
            validFrom: rule.validFrom,
            validUntil: rule.validUntil,
          };
        }
        return { key, startTime: rule.startTime, endTime: rule.endTime };
      }),
  }));
  return { days, dateLimits };
}

function toRuleRequest(
  rule: Omit<AvailabilityRuleRequest, "validFrom" | "validUntil"> & {
    validFrom?: string | null;
    validUntil?: string | null;
  }
): AvailabilityRuleRequest {
  return {
    branchId: rule.branchId,
    weekday: rule.weekday,
    startTime: rule.startTime,
    endTime: rule.endTime,
    ...(rule.validFrom && { validFrom: rule.validFrom }),
    ...(rule.validUntil && { validUntil: rule.validUntil }),
  };
}

/**
 * The full rule list to save: the edited branch's days, plus every other
 * branch's rules unchanged, since the API replaces the whole list.
 */
export function toAvailabilityRules(
  days: readonly WeeklyHoursDay[],
  branchId: string,
  existingRules: readonly AvailabilityRule[],
  dateLimits: WorkingPeriodDateLimits
): AvailabilityRuleRequest[] {
  const otherBranchRules = existingRules
    .filter((rule) => rule.branchId !== branchId)
    .map(toRuleRequest);
  const editedRules = days.flatMap((day) =>
    day.periods.map((period) =>
      toRuleRequest({
        branchId,
        weekday: day.weekday,
        startTime: period.startTime,
        endTime: period.endTime,
        ...dateLimits[period.key],
      })
    )
  );
  return [...otherBranchRules, ...editedRules];
}

/**
 * Problems with single periods, keyed by period key: a missing time, an end
 * that is not after the start, or an overlap on the same day.
 */
export function findWorkingPeriodProblems(
  days: readonly WeeklyHoursDay[]
): Record<string, string> {
  const problems: Record<string, string> = {};
  for (const day of days) {
    const sortedPeriods = [...day.periods].sort(compareStartTimes);
    sortedPeriods.forEach((period, periodIndex) => {
      if (!period.startTime || !period.endTime) {
        problems[period.key] = "Enter a start and an end time.";
        return;
      }
      if (period.endTime <= period.startTime) {
        problems[period.key] = "End after the start time.";
        return;
      }
      const previousPeriod = sortedPeriods[periodIndex - 1];
      if (previousPeriod && period.startTime < previousPeriod.endTime) {
        problems[period.key] = `This overlaps another period on ${day.label}.`;
      }
    });
  }
  return problems;
}

/**
 * Short hours for a list, such as "Mon–Fri 08:00–16:00, Sat 09:00–13:00".
 * With a branch, only that branch's hours count.
 */
export function summarizeWeeklyHours(
  rules: readonly AvailabilityRule[],
  branchId?: string
): string {
  const relevantRules = branchId
    ? rules.filter((rule) => rule.branchId === branchId)
    : rules;
  const patterns = SHORT_WEEKDAY_NAMES.map((_, weekdayIndex) =>
    relevantRules
      .filter((rule) => rule.weekday === weekdayIndex + 1)
      .sort(compareStartTimes)
      .map((rule) => `${rule.startTime}–${rule.endTime}`)
      .join(", ")
  );
  const groups: { first: number; last: number; pattern: string }[] = [];
  patterns.forEach((pattern, weekdayIndex) => {
    if (!pattern) return;
    const previousGroup = groups.at(-1);
    if (
      previousGroup &&
      previousGroup.pattern === pattern &&
      previousGroup.last === weekdayIndex - 1
    ) {
      previousGroup.last = weekdayIndex;
    } else {
      groups.push({ first: weekdayIndex, last: weekdayIndex, pattern });
    }
  });
  if (groups.length === 0) return "No hours set";
  return groups
    .map((group) => {
      const firstName = SHORT_WEEKDAY_NAMES[group.first];
      const days =
        group.first === group.last
          ? firstName
          : `${firstName}–${SHORT_WEEKDAY_NAMES[group.last]}`;
      return `${days} ${group.pattern}`;
    })
    .join("; ");
}
