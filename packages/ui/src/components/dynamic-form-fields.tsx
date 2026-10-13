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
import { Input } from "@healthalyst/ui/components/input";
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
  errors?: Readonly<Record<string, string>>;
  disabled?: boolean;
  onFieldChange?: (fieldName: string) => void;
};

function DynamicFormField({
  definition,
  field,
  error,
  disabled,
  onFieldChange,
}: {
  definition: FormDefinition;
  field: FormFieldDefinition;
  error?: string;
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
        {field.label}
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
                className="mb-0 font-serif text-xl font-semibold leading-tight"
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
