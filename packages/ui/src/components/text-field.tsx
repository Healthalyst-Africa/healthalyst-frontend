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
import { FieldStatusMessage } from "@healthalyst/ui/components/forms/field-status-message";
import { isFocusLeaving } from "@healthalyst/ui/lib/focus";
import { cn } from "@healthalyst/ui/lib/utilities";
import type { FieldStatus } from "@healthalyst/ui/types/field-status";

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
  /** Live feedback, such as a password's length, shown while there is no error. */
  status?: FieldStatus;
  /** Runs when focus leaves the whole field, not when it moves within it. */
  onFieldLeave?: () => void;
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
      status,
      onFieldLeave,
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
    const visibleStatus = error ? undefined : status;
    const statusIdentifier = visibleStatus ? `${id}-status` : "";
    const describedBy =
      [
        additionalDescribedBy,
        descriptionIdentifier,
        errorIdentifier,
        statusIdentifier,
      ]
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
        onBlur={(focusEvent) => {
          if (onFieldLeave && isFocusLeaving(focusEvent)) onFieldLeave();
        }}
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
        {visibleStatus && (
          <FieldStatusMessage
            identifier={statusIdentifier}
            status={visibleStatus}
          />
        )}
      </Field>
    );
  }
);

TextField.displayName = "TextField";

export { TextField };
export type { TextFieldProperties };
