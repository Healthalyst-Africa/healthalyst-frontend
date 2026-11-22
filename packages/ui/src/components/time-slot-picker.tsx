"use client";

import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { HintText } from "@healthalyst/ui/components/hint-text";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { cn } from "@healthalyst/ui/lib/utilities";
import { FieldLegend, FieldSet } from "@healthalyst/ui/primitives/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@healthalyst/ui/primitives/radio-group";

type TimeSlotDay = {
  /** Such as `2026-11-23`. */
  value: string;
  /** Such as "Mon 23 Nov". */
  label: string;
  /** Such as "6 free" or "Full". */
  detail: string;
  disabled?: boolean;
};

type TimeSlotGroup = {
  /** Such as a doctor's or room's name. */
  label: string;
  slots: readonly { value: string; label: string }[];
};

type TimeSlotPickerState =
  | { status: "loading" }
  | { status: "error"; message: string; onRetry: () => void }
  | { status: "ready" };

type PeriodControl = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
};

type TimeSlotPickerProperties = {
  id: string;
  legend: string;
  description?: ReactNode;
  /** The period shown, such as "23 – 29 Nov 2026". */
  periodLabel: string;
  previousPeriod: PeriodControl;
  nextPeriod: PeriodControl;
  days: readonly TimeSlotDay[];
  selectedDay: string;
  onDayChange: (day: string) => void;
  /** The chosen day's free times, grouped by who or what they are with. */
  groups: readonly TimeSlotGroup[];
  value: string;
  onValueChange: (value: string) => void;
  state: TimeSlotPickerState;
  /** Shown when the chosen day has no free times. */
  emptyMessage: ReactNode;
  disabled?: boolean;
};

const CHIP_CLASS_NAME =
  "flex cursor-pointer items-center justify-center rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-ring has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary has-[[data-state=checked]]:text-primary-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:disabled]:hover:border-border";

/**
 * Chooses a free time: a week of days with how many times each has free,
 * then the chosen day's times grouped by calendar. Arrow keys move between
 * days and between times.
 */
export function TimeSlotPicker({
  id,
  legend,
  description,
  periodLabel,
  previousPeriod,
  nextPeriod,
  days,
  selectedDay,
  onDayChange,
  groups,
  value,
  onValueChange,
  state,
  emptyMessage,
  disabled = false,
}: TimeSlotPickerProperties) {
  const descriptionIdentifier = description ? `${id}-description` : undefined;

  return (
    <FieldSet className="gap-4" aria-describedby={descriptionIdentifier}>
      <FieldLegend variant="label" className="mb-0">
        {legend}
      </FieldLegend>
      {description && (
        <HintText id={descriptionIdentifier}>{description}</HintText>
      )}

      <div className="flex items-center justify-between gap-2">
        <ActionButton
          type="button"
          variant="ghost"
          size="icon"
          aria-label={previousPeriod.label}
          disabled={previousPeriod.disabled || disabled}
          onClick={previousPeriod.onSelect}
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </ActionButton>
        <p className="text-sm font-medium" aria-live="polite">
          {periodLabel}
        </p>
        <ActionButton
          type="button"
          variant="ghost"
          size="icon"
          aria-label={nextPeriod.label}
          disabled={nextPeriod.disabled || disabled}
          onClick={nextPeriod.onSelect}
        >
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </ActionButton>
      </div>

      {state.status === "loading" ? (
        <LoadingPlaceholder
          label="Loading free times"
          rows={[{ shape: "field" }, { shape: "card" }]}
        />
      ) : state.status === "error" ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/40 p-4 text-sm"
        >
          <p>{state.message}</p>
          <ActionButton
            type="button"
            variant="outline"
            size="small"
            onClick={state.onRetry}
          >
            Try again
          </ActionButton>
        </div>
      ) : (
        <>
          <RadioGroup
            aria-label="Day"
            value={selectedDay}
            onValueChange={onDayChange}
            disabled={disabled}
            className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2"
          >
            {days.map((day) => (
              <label
                key={day.value}
                htmlFor={`${id}-day-${day.value}`}
                className={cn(
                  CHIP_CLASS_NAME,
                  "flex-col rounded-lg px-2 py-2 text-center"
                )}
              >
                <RadioGroupItem
                  id={`${id}-day-${day.value}`}
                  value={day.value}
                  disabled={day.disabled}
                  className="sr-only"
                />
                <span className="font-medium leading-5">{day.label}</span>
                <span className="text-caption opacity-80">{day.detail}</span>
              </label>
            ))}
          </RadioGroup>

          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              {emptyMessage}
            </p>
          ) : (
            <RadioGroup
              aria-label="Time"
              value={value}
              onValueChange={onValueChange}
              disabled={disabled}
              className="gap-4"
            >
              {groups.map((group) => (
                <div
                  key={group.label}
                  role="group"
                  aria-label={group.label}
                  className="flex flex-col gap-2"
                >
                  <p className="text-sm text-muted-foreground">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.slots.map((slot) => (
                      <label
                        key={slot.value}
                        htmlFor={`${id}-time-${slot.value}`}
                        className={CHIP_CLASS_NAME}
                      >
                        <RadioGroupItem
                          id={`${id}-time-${slot.value}`}
                          value={slot.value}
                          className="sr-only"
                        />
                        {slot.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}
        </>
      )}
    </FieldSet>
  );
}

export type { TimeSlotDay, TimeSlotGroup, TimeSlotPickerState };
