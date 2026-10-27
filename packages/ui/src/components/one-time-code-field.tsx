"use client";

import { forwardRef } from "react";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/primitives/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@healthalyst/ui/primitives/input-otp";
import { cn } from "@healthalyst/ui/lib/utilities";

type OneTimeCodeFieldProperties = {
  id: string;
  label: string;
  name?: string;
  /** Number of digits in the code. */
  length?: number;
  value?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  onChange?: (code: string) => void;
  /**
   * Called once every digit has been entered. Without it, the field submits
   * the form it belongs to, so nobody has to press the button afterwards.
   */
  onComplete?: (code: string) => void;
};

function removeCodeSeparators(pastedCode: string) {
  return pastedCode.replace(/[\s-]/g, "");
}

/**
 * A numeric one-time code entered in separate boxes. It is one real input,
 * so typing, pasting, autofill and assistive technology treat it as a
 * single field.
 */
const OneTimeCodeField = forwardRef<
  HTMLInputElement,
  OneTimeCodeFieldProperties
>(
  (
    {
      id,
      label,
      name,
      length = 6,
      value,
      error,
      disabled,
      required,
      autoFocus,
      className,
      onChange,
      onComplete,
    },
    elementReference
  ) => {
    const errorIdentifier = `${id}-error`;

    function handleComplete(code: string) {
      if (onComplete) {
        onComplete(code);
        return;
      }
      // Wait for the form's own state to hold the full code, then submit it.
      window.setTimeout(() => {
        const codeInput = document.getElementById(id);
        if (codeInput instanceof HTMLInputElement) {
          codeInput.form?.requestSubmit();
        }
      }, 0);
    }
    const firstGroupLength = Math.ceil(length / 2);
    const slotIndices = Array.from(
      { length },
      (_unusedValue, slotIndex) => slotIndex
    );
    const slotGroups = [
      slotIndices.slice(0, firstGroupLength),
      slotIndices.slice(firstGroupLength),
    ];

    return (
      <Field
        className={cn("items-center gap-3", className)}
        data-invalid={Boolean(error)}
        data-disabled={disabled || undefined}
      >
        <FieldLabel className="justify-center" htmlFor={id}>
          {label}
        </FieldLabel>
        <InputOTP
          ref={elementReference}
          id={id}
          name={name}
          maxLength={length}
          inputMode="numeric"
          pattern="^[0-9]*$"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          required={required}
          value={value}
          disabled={disabled}
          pasteTransformer={removeCodeSeparators}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorIdentifier : undefined}
          onChange={onChange}
          onComplete={handleComplete}
          containerClassName="justify-center gap-3"
        >
          {slotGroups.map((slotGroup) => (
            <InputOTPGroup key={slotGroup.join("-")}>
              {slotGroup.map((slotIndex) => (
                <InputOTPSlot
                  key={slotIndex}
                  index={slotIndex}
                  className="h-12 w-9 bg-card text-lg font-medium tabular-nums sm:w-11"
                />
              ))}
            </InputOTPGroup>
          ))}
        </InputOTP>
        {error && (
          <FieldError id={errorIdentifier} className="text-center">
            {error}
          </FieldError>
        )}
      </Field>
    );
  }
);

OneTimeCodeField.displayName = "OneTimeCodeField";

export { OneTimeCodeField };
export type { OneTimeCodeFieldProperties };
