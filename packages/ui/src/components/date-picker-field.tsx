"use client";

import { useState, type ReactNode } from "react";
import { format, isValid, parse } from "date-fns";
import { DateIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { HintText } from "@healthalyst/ui/components/hint-text";
import { Calendar } from "@healthalyst/ui/primitives/calendar";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/primitives/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@healthalyst/ui/primitives/popover";
import { cn } from "@healthalyst/ui/lib/utilities";

/** Values are calendar dates written as `yyyy-MM-dd`, without a time zone. */
const DATE_VALUE_FORMAT = "yyyy-MM-dd";
const DATE_DISPLAY_FORMAT = "EEE d MMM yyyy";

function readDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, DATE_VALUE_FORMAT, new Date());
  return isValid(date) ? date : undefined;
}

type DatePickerFieldProperties = {
  id: string;
  label: string;
  /** The chosen date as `yyyy-MM-dd`, or an empty string. */
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  description?: ReactNode;
  /** Validation message shown below the control and linked to it. */
  error?: string;
  /** The earliest date that can be chosen, as `yyyy-MM-dd`. */
  earliestDate?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * A labelled date chosen from a calendar. The calendar supports the keyboard:
 * arrow keys move between days, Page Up and Page Down change month.
 */
export function DatePickerField({
  id,
  label,
  value,
  onValueChange,
  placeholder = "Choose a date",
  description,
  error,
  earliestDate,
  disabled,
  className,
}: DatePickerFieldProperties) {
  const [open, setOpen] = useState(false);
  const selectedDate = readDateValue(value);
  const earliest = earliestDate ? readDateValue(earliestDate) : undefined;
  const descriptionIdentifier = description ? `${id}-description` : "";
  const errorIdentifier = error ? `${id}-error` : "";
  const labelIdentifier = `${id}-label`;
  const describedBy =
    [descriptionIdentifier, errorIdentifier].filter(Boolean).join(" ") ||
    undefined;

  return (
    <Field
      className={cn("gap-1.5", className)}
      data-invalid={Boolean(error)}
      data-disabled={disabled || undefined}
    >
      <FieldLabel id={labelIdentifier} htmlFor={id}>
        {label}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <ActionButton
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-labelledby={`${labelIdentifier} ${id}`}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error) || undefined}
            className={cn(
              "h-11 w-full justify-between rounded-md bg-card px-3 font-normal",
              !selectedDate && "text-muted-foreground",
              error && "border-destructive"
            )}
          >
            {selectedDate
              ? format(selectedDate, DATE_DISPLAY_FORMAT)
              : placeholder}
            <DateIcon aria-hidden="true" className="size-4 opacity-60" />
          </ActionButton>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate ?? earliest}
            weekStartsOn={1}
            disabled={earliest ? { before: earliest } : undefined}
            onSelect={(date) => {
              onValueChange(date ? format(date, DATE_VALUE_FORMAT) : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {description && (
        <HintText id={descriptionIdentifier}>{description}</HintText>
      )}
      {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
    </Field>
  );
}
