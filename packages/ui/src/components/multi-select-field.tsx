"use client";

import type { ReactNode } from "react";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/primitives/field";
import { HintText } from "@healthalyst/ui/components/hint-text";
import { MultiSelect } from "@healthalyst/ui/components/multi-select";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { FormOption } from "@healthalyst/ui/types/form-definition";

type MultiSelectFieldProperties = {
  id: string;
  label: string;
  /** Each chosen value is submitted with the surrounding form under this name. */
  name: string;
  options: readonly FormOption[];
  placeholder: string;
  defaultValues?: readonly string[];
  description?: ReactNode;
  /** Validation message shown below the control and linked to it. */
  error?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maximumSelections?: number;
  disabled?: boolean;
  className?: string;
  onValueChange?: (values: string[]) => void;
};

/**
 * A labelled control for choosing several options, with its description and
 * validation message. The choices are submitted as repeated form values.
 */
export function MultiSelectField({
  id,
  label,
  name,
  options,
  placeholder,
  defaultValues,
  description,
  error,
  searchPlaceholder,
  emptyMessage,
  maximumSelections,
  disabled = false,
  className,
  onValueChange,
}: MultiSelectFieldProperties) {
  const descriptionIdentifier = description ? `${id}-description` : "";
  const errorIdentifier = error ? `${id}-error` : "";
  const describedBy =
    [descriptionIdentifier, errorIdentifier].filter(Boolean).join(" ") ||
    undefined;

  return (
    <Field
      className={cn("gap-1.5", className)}
      data-invalid={Boolean(error)}
      data-disabled={disabled || undefined}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <MultiSelect
        identifier={id}
        name={name}
        options={options}
        placeholder={placeholder}
        defaultValues={defaultValues}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        maximumSelections={maximumSelections}
        disabled={disabled}
        invalid={Boolean(error)}
        describedBy={describedBy}
        onValueChange={onValueChange}
      />
      {description && (
        <HintText id={descriptionIdentifier}>{description}</HintText>
      )}
      {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
    </Field>
  );
}
