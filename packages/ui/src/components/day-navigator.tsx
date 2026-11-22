"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DatePickerField } from "@healthalyst/ui/components/date-picker-field";

/**
 * Moves through days one at a time, jumps to a date, or back to today, such
 * as for a day of appointments.
 */
export function DayNavigator({
  id,
  value,
  today,
  onValueChange,
  shiftDay,
}: {
  id: string;
  /** The day shown, `yyyy-MM-dd`. */
  value: string;
  /** Today where the work happens, `yyyy-MM-dd`. */
  today: string;
  onValueChange: (value: string) => void;
  /** The day a number of days before or after another. */
  shiftDay: (value: string, days: number) => string;
}) {
  return (
    <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-2 sm:flex sm:w-auto">
      <ActionButton
        type="button"
        variant="outline"
        size="icon"
        className="size-11"
        aria-label="Earlier day"
        onClick={() => onValueChange(shiftDay(value, -1))}
      >
        <ChevronLeftIcon aria-hidden="true" className="size-4" />
      </ActionButton>
      <DatePickerField
        id={id}
        label="Day"
        value={value}
        onValueChange={onValueChange}
        className="sm:w-48"
      />
      <ActionButton
        type="button"
        variant="outline"
        size="icon"
        className="size-11"
        aria-label="Later day"
        onClick={() => onValueChange(shiftDay(value, 1))}
      >
        <ChevronRightIcon aria-hidden="true" className="size-4" />
      </ActionButton>
      <ActionButton
        type="button"
        variant="ghost"
        className="col-span-3 h-11 justify-self-start sm:col-auto"
        disabled={value === today}
        onClick={() => onValueChange(today)}
      >
        Today
      </ActionButton>
    </div>
  );
}
