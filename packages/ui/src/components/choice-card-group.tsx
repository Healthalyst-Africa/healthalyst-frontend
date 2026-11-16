"use client";

import type { ReactNode } from "react";
import { HintText } from "@healthalyst/ui/components/hint-text";
import {
  FieldError,
  FieldLegend,
  FieldSet,
} from "@healthalyst/ui/primitives/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@healthalyst/ui/primitives/radio-group";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { StatusTone } from "@healthalyst/ui/types/status-tone";

type ChoiceCardOption = {
  value: string;
  label: string;
  description?: ReactNode;
  /** Colours the chosen card's edge, such as `negative` for an emergency. */
  tone?: StatusTone;
  disabled?: boolean;
  /** Shown under the description, such as why the option is unavailable. */
  note?: ReactNode;
};

type ChoiceCardGroupProperties = {
  id: string;
  legend: string;
  description?: ReactNode;
  options: readonly ChoiceCardOption[];
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  /** Cards side by side from tablet width, or always stacked. */
  layout?: "columns" | "stack";
  className?: string;
};

const CHOSEN_TONE_CLASS_NAMES: Record<StatusTone, string> = {
  neutral: "has-[[data-state=checked]]:border-status-neutral",
  information: "has-[[data-state=checked]]:border-status-information",
  warning:
    "has-[[data-state=checked]]:border-status-warning has-[[data-state=checked]]:bg-alert-warning-surface",
  highlight: "has-[[data-state=checked]]:border-status-highlight",
  positive:
    "has-[[data-state=checked]]:border-status-positive has-[[data-state=checked]]:bg-alert-success-surface",
  negative:
    "has-[[data-state=checked]]:border-status-negative has-[[data-state=checked]]:bg-alert-error-surface",
};

/**
 * One choice from a few options shown as cards with a label and description,
 * such as a priority. Arrow keys move between the options.
 */
export function ChoiceCardGroup({
  id,
  legend,
  description,
  options,
  value,
  onValueChange,
  error,
  layout = "columns",
  className,
}: ChoiceCardGroupProperties) {
  const descriptionIdentifier = description ? `${id}-description` : "";
  const errorIdentifier = error ? `${id}-error` : "";

  return (
    <FieldSet className={cn("gap-3", className)} data-invalid={Boolean(error)}>
      <FieldLegend variant="label" className="mb-0">
        {legend}
      </FieldLegend>
      {description && (
        <HintText id={descriptionIdentifier}>{description}</HintText>
      )}
      <RadioGroup
        id={id}
        value={value}
        onValueChange={onValueChange}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={
          [descriptionIdentifier, errorIdentifier].filter(Boolean).join(" ") ||
          undefined
        }
        className={cn(
          "gap-3",
          layout === "columns" &&
            "sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]"
        )}
      >
        {options.map((option) => {
          const optionIdentifier = `${id}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionIdentifier}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-ring has-[[data-state=checked]]:border-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2",
                CHOSEN_TONE_CLASS_NAMES[option.tone ?? "information"],
                option.disabled &&
                  "cursor-not-allowed opacity-60 hover:border-border"
              )}
            >
              <RadioGroupItem
                id={optionIdentifier}
                value={option.value}
                disabled={option.disabled}
                className="mt-0.5"
              />
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-medium leading-5">
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-caption text-muted-foreground">
                    {option.description}
                  </span>
                )}
                {option.note && (
                  <span className="text-caption text-muted-foreground">
                    {option.note}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </RadioGroup>
      {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
    </FieldSet>
  );
}

export type { ChoiceCardOption };
