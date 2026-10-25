"use client";

import type { ChangeEvent } from "react";
import type {
  FormFieldDefinition,
  FormDefinition,
} from "@healthalyst/ui/types/form-definition";
import { cn } from "@healthalyst/ui/lib/utilities";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@healthalyst/ui/components/field";
import { Checkbox } from "@healthalyst/ui/components/checkbox";
import { Input } from "@healthalyst/ui/components/input";
import { MultiSelect } from "@healthalyst/ui/components/multi-select";
import { PasswordInput } from "@healthalyst/ui/components/password-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@healthalyst/ui/components/select";
import { Textarea } from "@healthalyst/ui/components/textarea";
import { FieldLabelText } from "./field-label-text";

export function DynamicFormField({
  definition,
  field,
  error,
  defaultSelection,
  disabled,
  onFieldChange,
  value,
  onValueChange,
}: {
  definition: FormDefinition;
  field: FormFieldDefinition;
  error?: string;
  defaultSelection?: readonly string[];
  disabled: boolean;
  onFieldChange?: (fieldName: string) => void;
  value?: string;
  onValueChange?: (fieldName: string, value: string) => void;
}) {
  const fieldIdentifier = `${definition.identifier}-${field.name}`;
  const descriptionIdentifier = field.description
    ? `${fieldIdentifier}-description`
    : undefined;
  const errorIdentifier = error ? `${fieldIdentifier}-error` : undefined;
  const describedBy =
    [descriptionIdentifier, errorIdentifier].filter(Boolean).join(" ") ||
    undefined;

  if (field.kind === "checkbox") {
    return (
      <Field
        className={cn("gap-1.5", field.columnSpan === 2 && "sm:col-span-2")}
        data-invalid={Boolean(error)}
        data-disabled={disabled}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            className="mt-0.5"
            id={fieldIdentifier}
            name={field.name}
            value={field.value ?? "on"}
            required={field.required}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            onCheckedChange={() => onFieldChange?.(field.name)}
          />
          <FieldLabel
            className="text-xs font-normal leading-5"
            htmlFor={fieldIdentifier}
          >
            <FieldLabelText label={field.label} required={field.required} />
          </FieldLabel>
        </div>
        {field.description && (
          <FieldDescription id={descriptionIdentifier}>
            {field.description}
          </FieldDescription>
        )}
        {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
      </Field>
    );
  }

  if (field.kind === "checkbox-group") {
    return (
      <FieldSet
        className={cn("gap-2", field.columnSpan === 2 && "sm:col-span-2")}
        id={fieldIdentifier}
        tabIndex={-1}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        data-invalid={Boolean(error)}
      >
        <FieldLegend
          className={cn("mb-3 text-sm", field.hideLabel && "sr-only")}
          variant="label"
        >
          <FieldLabelText
            label={field.label}
            required={field.required}
            announceRequired
          />
        </FieldLegend>
        {field.description && (
          <FieldDescription id={descriptionIdentifier}>
            {field.description}
          </FieldDescription>
        )}
        <div className="flex flex-col gap-3">
          {field.options.map((option) => {
            const optionIdentifier = `${fieldIdentifier}-${option.value}`;

            return (
              <div key={option.value} className="flex items-center gap-3">
                <Checkbox
                  id={optionIdentifier}
                  name={field.name}
                  value={option.value}
                  disabled={disabled}
                  aria-invalid={Boolean(error) || undefined}
                  onCheckedChange={() => onFieldChange?.(field.name)}
                />
                <FieldLabel className="font-normal" htmlFor={optionIdentifier}>
                  {option.label}
                </FieldLabel>
              </div>
            );
          })}
        </div>
        {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
      </FieldSet>
    );
  }

  const controlProperties = {
    id: fieldIdentifier,
    name: field.name,
    required: field.required,
    disabled,
    value,
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": describedBy,
    onChange: (
      changeEvent: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      onFieldChange?.(field.name);
      onValueChange?.(field.name, changeEvent.currentTarget.value);
    },
  };

  return (
    <Field
      className={cn("gap-1.5", field.columnSpan === 2 && "sm:col-span-2")}
      data-invalid={Boolean(error)}
      data-disabled={disabled}
    >
      <FieldLabel
        className={cn(field.hideLabel && "sr-only")}
        htmlFor={fieldIdentifier}
      >
        <FieldLabelText
          label={field.label}
          required={field.required}
          announceRequired={field.kind === "multi-select"}
        />
      </FieldLabel>
      {field.kind === "select" ? (
        <Select
          name={field.name}
          required={field.required}
          disabled={disabled}
          value={value}
          onValueChange={(selectedValue) => {
            onFieldChange?.(field.name);
            onValueChange?.(field.name, selectedValue);
          }}
        >
          <SelectTrigger
            id={fieldIdentifier}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
          >
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : field.kind === "multi-select" ? (
        <MultiSelect
          identifier={fieldIdentifier}
          name={field.name}
          options={field.options}
          placeholder={field.placeholder}
          defaultValues={defaultSelection}
          maximumSelections={field.maximumSelections}
          disabled={disabled}
          invalid={Boolean(error)}
          describedBy={describedBy}
          onValueChange={() => onFieldChange?.(field.name)}
        />
      ) : field.kind === "textarea" ? (
        <Textarea
          {...controlProperties}
          autoComplete={field.autoComplete}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
          rows={field.rows}
        />
      ) : field.kind === "password" ? (
        <PasswordInput
          {...controlProperties}
          visibilityLabel={field.label}
          borderless={field.borderless}
          autoComplete={field.autoComplete}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
        />
      ) : (
        <Input
          {...controlProperties}
          className={field.borderless ? "border-0" : undefined}
          type={field.kind}
          autoComplete={field.autoComplete}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
        />
      )}
      {field.description && (
        <FieldDescription id={descriptionIdentifier}>
          {field.description}
        </FieldDescription>
      )}
      {error && <FieldError id={errorIdentifier}>{error}</FieldError>}
    </Field>
  );
}
