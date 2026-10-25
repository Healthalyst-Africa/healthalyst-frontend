"use client";

import type { ReactNode } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/primitives/field";
import { Checkbox } from "@healthalyst/ui/primitives/checkbox";
import { cn } from "@healthalyst/ui/lib/utilities";

type CheckboxFieldProperties = {
  id: string;
  label: ReactNode;
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  required?: boolean;
  disabled?: boolean;
  description?: ReactNode;
  error?: string;
  className?: string;
  onCheckedChange?: (checked: boolean) => void;
};

/** A checkbox with its label beside it and an optional description and error. */
export function CheckboxField({
  id,
  label,
  name,
  value,
  checked,
  defaultChecked,
  required,
  disabled,
  description,
  error,
  className,
  onCheckedChange,
}: CheckboxFieldProperties) {
  const descriptionIdentifier = description ? `${id}-description` : "";
  const errorIdentifier = error ? `${id}-error` : "";

  return (
    <Field
      className={cn("gap-1.5", className)}
      data-invalid={Boolean(error)}
      data-disabled={disabled || undefined}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-0.5"
          id={id}
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={
            [descriptionIdentifier, errorIdentifier]
              .filter(Boolean)
              .join(" ") || undefined
          }
          onCheckedChange={(checkedState) =>
            onCheckedChange?.(checkedState === true)
          }
        />
        <FieldLabel htmlFor={id} className="font-normal leading-5">
          {label}
        </FieldLabel>
      </div>
      {description && (
        <FieldDescription id={descriptionIdentifier}>
          {description}
        </FieldDescription>
      )}
      {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
    </Field>
  );
}
