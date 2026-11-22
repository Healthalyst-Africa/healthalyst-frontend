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
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@healthalyst/ui/primitives/select";
import { FieldLabelText } from "@healthalyst/ui/components/forms/field-label-text";
import { HintText } from "@healthalyst/ui/components/hint-text";
import { cn } from "@healthalyst/ui/lib/utilities";

type SelectFieldOption = {
  value: string;
  label: string;
  /** Options sharing a group are listed together under its name. */
  group?: string;
};

/** Consecutive options of the same group, keeping their order. */
function groupOptions(options: readonly SelectFieldOption[]) {
  const groups: { name: string | undefined; options: SelectFieldOption[] }[] =
    [];
  for (const option of options) {
    const lastGroup = groups.at(-1);
    if (lastGroup && lastGroup.name === option.group) {
      lastGroup.options.push(option);
    } else {
      groups.push({ name: option.group, options: [option] });
    }
  }
  return groups;
}

type SelectFieldProperties = {
  id: string;
  label: string;
  /** A short explanation under the field, such as why it matters. */
  description?: string;
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
  description,
  hideLabel = false,
  options,
  placeholder,
  name,
  value,
  defaultValue,
  required = false,
  disabled,
  error,
  className,
  presentation = "listbox",
  controlSize = "default",
  onValueChange,
}: SelectFieldProperties) {
  const errorIdentifier = error ? `${id}-error` : undefined;
  const descriptionIdentifier = description ? `${id}-description` : undefined;
  const describedBy =
    [descriptionIdentifier, errorIdentifier].filter(Boolean).join(" ") ||
    undefined;
  const controlSizeClassName = controlSize === "compact" && "h-10";

  return (
    <Field
      className={cn("gap-1.5", className)}
      data-invalid={Boolean(error)}
      data-disabled={disabled || undefined}
    >
      <FieldLabel className={cn(hideLabel && "sr-only")} htmlFor={id}>
        <FieldLabelText label={label} required={required} />
      </FieldLabel>
      {presentation === "native" ? (
        <NativeSelect
          id={id}
          className={cn(controlSizeClassName)}
          name={name}
          value={value}
          defaultValue={value === undefined ? (defaultValue ?? "") : undefined}
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
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
          disabled={disabled}
          onValueChange={onValueChange}
        >
          <SelectTrigger
            id={id}
            className={cn(controlSizeClassName)}
            aria-invalid={Boolean(error) || undefined}
            aria-required={required || undefined}
            aria-describedby={describedBy}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {groupOptions(options).map((group, groupIndex) => (
              <SelectGroup key={group.name ?? `group-${groupIndex}`}>
                {group.name && (
                  <SelectLabel className="text-xs font-medium text-muted-foreground">
                    {group.name}
                  </SelectLabel>
                )}
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      )}
      {description && (
        <HintText id={descriptionIdentifier}>{description}</HintText>
      )}
      {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
    </Field>
  );
}

export type { SelectFieldOption };
