"use client";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@healthalyst/ui/primitives/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@healthalyst/ui/primitives/native-select";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@healthalyst/ui/primitives/select";
import { cn } from "@healthalyst/ui/lib/utilities";

type SelectFieldOption = {
  value: string;
  label: string;
};

type SelectFieldProperties = {
  id: string;
  label: string;
  hideLabel?: boolean;
  options: readonly SelectFieldOption[];
  placeholder: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  /**
   * `listbox` opens a styled option list; `native` uses the browser's own
   * control, which suits long lists and plain form submission.
   */
  presentation?: "listbox" | "native";
  /**
   * `default` matches the other form fields; `compact` matches the search
   * field, for toolbars such as filter bars.
   */
  controlSize?: "default" | "compact";
  onValueChange?: (value: string) => void;
};

/** A labelled choice of one option from a list, with its validation message. */
export function SelectField({
  id,
  label,
  hideLabel = false,
  options,
  placeholder,
  name,
  value,
  defaultValue,
  required,
  disabled,
  error,
  className,
  presentation = "listbox",
  controlSize = "default",
  onValueChange,
}: SelectFieldProperties) {
  const errorIdentifier = error ? `${id}-error` : undefined;
  const controlSizeClassName = controlSize === "compact" && "h-10";

  return (
    <Field
      className={cn("gap-1.5", className)}
      data-invalid={Boolean(error)}
      data-disabled={disabled || undefined}
    >
      <FieldLabel className={cn(hideLabel && "sr-only")} htmlFor={id}>
        {label}
      </FieldLabel>
      {presentation === "native" ? (
        <NativeSelect
          id={id}
          className={cn(controlSizeClassName)}
          name={name}
          value={value}
          defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorIdentifier}
          onChange={(changeEvent) =>
            onValueChange?.(changeEvent.currentTarget.value)
          }
        >
          <NativeSelectOption value="" disabled>
            {placeholder}
          </NativeSelectOption>
          {options.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : (
        <Select
          name={name}
          value={value}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
          onValueChange={onValueChange}
        >
          <SelectTrigger
            id={id}
            className={cn(controlSizeClassName)}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={errorIdentifier}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
    </Field>
  );
}

export type { SelectFieldOption };
