"use client";

import { AddIcon, DeleteIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { Input } from "@healthalyst/ui/primitives/input";
import { cn } from "@healthalyst/ui/lib/utilities";

type WeeklyHoursPeriod = {
  /** Stable within the editor, so rows keep focus while times change. */
  key: string;
  startTime: string;
  endTime: string;
};

type WeeklyHoursDay = {
  /** 1 is Monday and 7 is Sunday. */
  weekday: number;
  label: string;
  periods: readonly WeeklyHoursPeriod[];
};

type WeeklyHoursEditorProperties = {
  id: string;
  /** Names the group, such as "Weekly hours at Head office". */
  legend: string;
  /** Hides the legend visually when a nearby heading already says it. */
  hideLegend?: boolean;
  days: readonly WeeklyHoursDay[];
  onDaysChange: (days: WeeklyHoursDay[]) => void;
  /** The times a new period starts with. */
  newPeriod: { startTime: string; endTime: string };
  /** Messages for single periods, keyed by period key. */
  periodErrors?: Readonly<Record<string, string>>;
  /** A message for the editor as a whole. */
  error?: string;
  disabled?: boolean;
  className?: string;
};

function createPeriodKey() {
  return globalThis.crypto.randomUUID();
}

/**
 * Opening hours for each day of the week. A day can have several periods,
 * such as a morning and an afternoon session, or none, which shows it as
 * closed. Times use the browser's time control.
 */
export function WeeklyHoursEditor({
  id,
  legend,
  hideLegend = false,
  days,
  onDaysChange,
  newPeriod,
  periodErrors = {},
  error,
  disabled,
  className,
}: WeeklyHoursEditorProperties) {
  const errorIdentifier = error ? `${id}-error` : undefined;

  function updateDay(
    weekday: number,
    changePeriods: (
      periods: readonly WeeklyHoursPeriod[]
    ) => WeeklyHoursPeriod[]
  ) {
    onDaysChange(
      days.map((day) =>
        day.weekday === weekday
          ? { ...day, periods: changePeriods(day.periods) }
          : day
      )
    );
  }

  return (
    <fieldset
      id={id}
      className={cn("flex min-w-0 flex-col gap-1", className)}
      aria-describedby={errorIdentifier}
      disabled={disabled}
    >
      <legend
        className={cn("mb-2 text-sm font-medium", hideLegend && "sr-only")}
      >
        {legend}
      </legend>
      <div className="divide-y divide-border rounded-lg border border-border">
        {days.map((day) => (
          <div
            key={day.weekday}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-4"
          >
            <p className="w-28 shrink-0 pt-2.5 text-sm font-medium">
              {day.label}
            </p>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {day.periods.length === 0 && (
                <p className="pt-2.5 text-sm text-muted-foreground">Closed</p>
              )}
              {day.periods.map((period, periodIndex) => {
                const periodName = `${day.label} period ${periodIndex + 1}`;
                const periodError = periodErrors[period.key];
                const periodErrorIdentifier = periodError
                  ? `${id}-${period.key}-error`
                  : undefined;
                return (
                  <div key={period.key} className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        aria-label={`${periodName} starts`}
                        aria-invalid={Boolean(periodError) || undefined}
                        aria-describedby={periodErrorIdentifier}
                        value={period.startTime}
                        onChange={(changeEvent) =>
                          updateDay(day.weekday, (periods) =>
                            periods.map((candidate) =>
                              candidate.key === period.key
                                ? {
                                    ...candidate,
                                    startTime: changeEvent.target.value,
                                  }
                                : candidate
                            )
                          )
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <Input
                        type="time"
                        aria-label={`${periodName} ends`}
                        aria-invalid={Boolean(periodError) || undefined}
                        aria-describedby={periodErrorIdentifier}
                        value={period.endTime}
                        onChange={(changeEvent) =>
                          updateDay(day.weekday, (periods) =>
                            periods.map((candidate) =>
                              candidate.key === period.key
                                ? {
                                    ...candidate,
                                    endTime: changeEvent.target.value,
                                  }
                                : candidate
                            )
                          )
                        }
                        className="w-32"
                      />
                      <ActionButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${periodName}`}
                        onClick={() =>
                          updateDay(day.weekday, (periods) =>
                            periods.filter(
                              (candidate) => candidate.key !== period.key
                            )
                          )
                        }
                      >
                        <DeleteIcon aria-hidden="true" className="size-4" />
                      </ActionButton>
                    </div>
                    {periodError && (
                      <p
                        id={periodErrorIdentifier}
                        className="text-sm text-destructive"
                      >
                        {periodError}
                      </p>
                    )}
                  </div>
                );
              })}
              <ActionButton
                type="button"
                variant="ghost"
                className="self-start"
                leadingIcon={<AddIcon className="size-4" />}
                aria-label={`Add hours on ${day.label}`}
                onClick={() =>
                  updateDay(day.weekday, (periods) => [
                    ...periods,
                    { key: createPeriodKey(), ...newPeriod },
                  ])
                }
              >
                Add hours
              </ActionButton>
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p
          id={errorIdentifier}
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}

export type { WeeklyHoursDay, WeeklyHoursPeriod };
