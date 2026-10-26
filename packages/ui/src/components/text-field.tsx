"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/primitives/field";
import { Input } from "@healthalyst/ui/primitives/input";
import { PasswordInput } from "@healthalyst/ui/components/password-input";
import { cn } from "@healthalyst/ui/lib/utilities";

type TextFieldProperties = Omit<
  ComponentPropsWithoutRef<"input">,
  "id" | "className"
> & {
  id: string;
  label: string;
  hideLabel?: boolean;
  description?: ReactNode;
  /** Validation message shown below the control and linked to it. */
  error?: string;
  className?: string;
  inputClassName?: string;
};

/**
 * A labelled single-line input with its description and validation message.
 * `type="password"` adds a control to show and hide the value.
 */
const TextField = forwardRef<HTMLInputElement, TextFieldProperties>(
  (
    {
      id,
      label,
      hideLabel = false,
      description,
      error,
      type = "text",
      disabled,
      className,
      inputClassName,
      "aria-describedby": additionalDescribedBy,
      ...properties
    },
    elementReference
  ) => {
    const descriptionIdentifier = description ? `${id}-description` : "";
    const errorIdentifier = error ? `${id}-error` : "";
    const describedBy =
      [additionalDescribedBy, descriptionIdentifier, errorIdentifier]
        .filter(Boolean)
        .join(" ") || undefined;
    const controlProperties = {
      ...properties,
      ref: elementReference,
      id,
      disabled,
      className: inputClassName,
      "aria-invalid": Boolean(error) || undefined,
      "aria-describedby": describedBy,
    };

    return (
      <Field
        className={cn("gap-1.5", className)}
        data-invalid={Boolean(error)}
        data-disabled={disabled || undefined}
      >
        <FieldLabel className={cn(hideLabel && "sr-only")} htmlFor={id}>
          {label}
        </FieldLabel>
        {type === "password" ? (
          <PasswordInput {...controlProperties} visibilityLabel={label} />
        ) : (
          <Input {...controlProperties} type={type} />
        )}
        {description && (
          <FieldDescription id={descriptionIdentifier}>
            {description}
          </FieldDescription>
        )}
        {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
      </Field>
    );
  }
);

TextField.displayName = "TextField";

export { TextField };
export type { TextFieldProperties };
