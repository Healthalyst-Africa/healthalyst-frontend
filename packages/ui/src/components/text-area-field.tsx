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
import { Textarea } from "@healthalyst/ui/primitives/textarea";
import { cn } from "@healthalyst/ui/lib/utilities";

type TextAreaFieldProperties = Omit<
  ComponentPropsWithoutRef<"textarea">,
  "id" | "className"
> & {
  id: string;
  label: string;
  description?: ReactNode;
  /** Validation message shown below the control and linked to it. */
  error?: string;
  className?: string;
};

/** A labelled multi-line input with its description and validation message. */
const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProperties>(
  (
    { id, label, description, error, disabled, className, ...properties },
    elementReference
  ) => {
    const descriptionIdentifier = description ? `${id}-description` : "";
    const errorIdentifier = error ? `${id}-error` : "";

    return (
      <Field
        className={cn("gap-1.5", className)}
        data-invalid={Boolean(error)}
        data-disabled={disabled || undefined}
      >
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <Textarea
          {...properties}
          ref={elementReference}
          id={id}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={
            [descriptionIdentifier, errorIdentifier]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
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

TextAreaField.displayName = "TextAreaField";

export { TextAreaField };
export type { TextAreaFieldProperties };
