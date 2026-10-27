"use client";

import type { FormDefinition } from "@healthalyst/ui/types/form-definition";
import { cn } from "@healthalyst/ui/lib/utilities";
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@healthalyst/ui/primitives/field";
import { DynamicFormField } from "./forms/dynamic-form-field";
import type { FieldStatus } from "./forms/field-status-message";

export type { FieldStatus };

type DynamicFormFieldsProperties = {
  definition: FormDefinition;
  /** Choices already made in multi-select fields, by field name. */
  defaultSelections?: Readonly<Record<string, readonly string[]>>;
  errors?: Readonly<Record<string, string>>;
  /** Live feedback by field name, shown while a field has no error. */
  statuses?: Readonly<Record<string, FieldStatus>>;
  disabled?: boolean;
  onFieldChange?: (fieldName: string) => void;
  onFieldBlur?: (fieldName: string) => void;
  values?: Readonly<Record<string, string>>;
  onValueChange?: (fieldName: string, value: string) => void;
  fieldGroupClassName?: string;
  sectionHeadingSize?: "default" | "large";
};

export function DynamicFormFields({
  definition,
  defaultSelections = {},
  errors = {},
  statuses = {},
  disabled = false,
  onFieldChange,
  onFieldBlur,
  values,
  onValueChange,
  fieldGroupClassName,
  sectionHeadingSize = "default",
}: DynamicFormFieldsProperties) {
  return (
    <div
      className={cn(
        "flex flex-col",
        sectionHeadingSize === "large" ? "gap-8 sm:gap-12" : "gap-5"
      )}
    >
      {definition.sections.map((section) => {
        const fields = (
          <FieldGroup
            className={cn(
              "gap-y-4 sm:gap-y-5",
              section.columns === 2 &&
                "grid sm:grid-cols-2 sm:gap-x-2 sm:gap-y-5",
              fieldGroupClassName
            )}
          >
            {section.fields.map((field) => (
              <DynamicFormField
                key={field.name}
                definition={definition}
                field={field}
                error={errors[field.name]}
                status={statuses[field.name]}
                defaultSelection={defaultSelections[field.name]}
                disabled={disabled}
                onFieldChange={onFieldChange}
                onFieldBlur={onFieldBlur}
                value={values?.[field.name]}
                onValueChange={onValueChange}
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
                className="mb-0 font-sans font-semibold leading-tight"
                variant={sectionHeadingSize === "large" ? "legend" : "label"}
              >
                {section.title}
              </FieldLegend>
              {section.description && (
                <div className="mt-1">
                  <FieldDescription>{section.description}</FieldDescription>
                </div>
              )}
              <div
                className={
                  sectionHeadingSize === "large" ? "mt-4 sm:mt-6" : "mt-4"
                }
              >
                {fields}
              </div>
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
