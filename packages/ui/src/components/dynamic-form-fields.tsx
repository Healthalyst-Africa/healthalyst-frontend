"use client";

import type {
  FormFieldDefinition,
  FormDefinition,
} from "@healthalyst/ui/lib/form-definition";
import { cn } from "@healthalyst/ui/lib/utilities";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
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

type DynamicFormFieldsProperties = {
  definition: FormDefinition;
  /** Choices already made in multi-select fields, by field name. */
  defaultSelections?: Readonly<Record<string, readonly string[]>>;
  errors?: Readonly<Record<string, string>>;
  disabled?: boolean;
  onFieldChange?: (fieldName: string) => void;
};

/**
 * A field's label text, followed by an asterisk when the field is required.
 * Controls with a native `required` state already announce it, so the
 * asterisk stays visual for them; others pass `announceRequired` to have
 * "required" read with their label.
 */
function FieldLabelText({
  label,
  required = false,
  announceRequired = false,
}: {
  label: string;
  required?: boolean;
  announceRequired?: boolean;
}) {
  return (
    <span>
      {label}
      {required && (
        <>
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
          {announceRequired && <span className="sr-only"> (required)</span>}
        </>
      )}
    </span>
  );
}

function DynamicFormField({
  definition,
  field,
  error,
  defaultSelection,
  disabled,
  onFieldChange,
}: {
  definition: FormDefinition;
  field: FormFieldDefinition;
  error?: string;
  defaultSelection?: readonly string[];
  disabled: boolean;
  onFieldChange?: (fieldName: string) => void;
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
                <FieldLabel className="font-light" htmlFor={optionIdentifier}>
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
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": describedBy,
    onChange: () => onFieldChange?.(field.name),
  };

  return (
    <Field
      className={cn("gap-1.5", field.columnSpan === 2 && "sm:col-span-2")}
      data-invalid={Boolean(error)}
      data-disabled={disabled}
    >
      <FieldLabel
        className={field.hideLabel ? "sr-only" : undefined}
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
          onValueChange={() => onFieldChange?.(field.name)}
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

export function DynamicFormFields({
  definition,
  defaultSelections = {},
  errors = {},
  disabled = false,
  onFieldChange,
}: DynamicFormFieldsProperties) {
  return (
    <div className="flex flex-col gap-5">
      {definition.sections.map((section) => {
        const fields = (
          <FieldGroup
            className={cn(
              "gap-y-5",
              section.columns === 2 &&
                "grid sm:grid-cols-2 sm:gap-x-2 sm:gap-y-5"
            )}
          >
            {section.fields.map((field) => (
              <DynamicFormField
                key={field.name}
                definition={definition}
                field={field}
                error={errors[field.name]}
                defaultSelection={defaultSelections[field.name]}
                disabled={disabled}
                onFieldChange={onFieldChange}
              />
            ))}
          </FieldGroup>
        );

        return section.title ? (
          <div
            key={section.identifier}
            className={cn(
              section.separated &&
                "rounded-xl border border-border bg-muted/60 p-5 sm:p-6"
            )}
          >
            <FieldSet className="gap-0">
              <FieldLegend
                className="mb-0 font-serif text-xl font-normal leading-tight"
                variant="label"
              >
                {section.title}
              </FieldLegend>
              {section.description && (
                <div className="mt-1">
                  <FieldDescription>{section.description}</FieldDescription>
                </div>
              )}
              <div className="mt-4">{fields}</div>
            </FieldSet>
          </div>
        ) : (
          <div
            key={section.identifier}
            className={cn(section.separated && "border-t border-border pt-5")}
          >
            {section.description && (
              <FieldDescription>{section.description}</FieldDescription>
            )}
            {fields}
          </div>
        );
      })}
    </div>
  );
}
