export type FormOption = {
  value: string;
  label: string;
};

type FormFieldBase = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  columnSpan?: 1 | 2;
  hideLabel?: boolean;
  borderless?: boolean;
};

export type FormFieldDefinition =
  | (FormFieldBase & {
      kind: "text" | "email" | "password" | "tel" | "textarea";
      autoComplete?: string;
      placeholder?: string;
      minLength?: number;
      maxLength?: number;
      maxByteLength?: number;
      rows?: number;
    })
  | (FormFieldBase & {
      kind: "select";
      placeholder: string;
      options: readonly FormOption[];
    });

export type FormSectionDefinition = {
  identifier: string;
  title?: string;
  description?: string;
  columns?: 1 | 2;
  separated?: boolean;
  fields: readonly FormFieldDefinition[];
};

export type FormDefinition = {
  identifier: string;
  sections: readonly FormSectionDefinition[];
};

type FormFieldName<Definition extends FormDefinition> =
  Definition["sections"][number]["fields"][number]["name"];

export type FormValidationResult<FieldName extends string = string> =
  | { valid: true; values: Record<FieldName, string> }
  | { valid: false; errors: Record<string, string> };

export function validateFormData<const Definition extends FormDefinition>(
  definition: Definition,
  formData: FormData
): FormValidationResult<FormFieldName<Definition>> {
  const values: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const section of definition.sections) {
    for (const field of section.fields) {
      const submittedValues = formData.getAll(field.name);
      const submittedValue = submittedValues[0];
      if (
        submittedValues.length > 1 ||
        (submittedValue !== undefined && typeof submittedValue !== "string")
      ) {
        errors[field.name] = `Enter a valid ${field.label.toLowerCase()}.`;
        continue;
      }

      const value =
        field.kind === "password"
          ? (submittedValue ?? "")
          : (submittedValue ?? "").trim();
      values[field.name] = value;

      if (field.required && value.trim().length === 0) {
        errors[field.name] = `${field.label} is required.`;
        continue;
      }

      if (!value) {
        continue;
      }

      if (field.kind === "select") {
        if (!field.options.some((option) => option.value === value)) {
          errors[field.name] = `Select a valid ${field.label.toLowerCase()}.`;
        }
        continue;
      }

      if (field.minLength !== undefined && value.length < field.minLength) {
        errors[field.name] =
          `${field.label} must be at least ${field.minLength} characters.`;
      } else if (
        field.maxLength !== undefined &&
        value.length > field.maxLength
      ) {
        errors[field.name] =
          `${field.label} must be no more than ${field.maxLength} characters.`;
      } else if (
        field.maxByteLength !== undefined &&
        new TextEncoder().encode(value).length > field.maxByteLength
      ) {
        errors[field.name] =
          `${field.label} must be no more than ${field.maxByteLength} UTF-8 bytes.`;
      } else if (field.kind === "email" && !/^[^\s@]+@[^\s@]+$/.test(value)) {
        errors[field.name] = "Enter a valid email address.";
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  // Every defined field receives a string value before the valid result is returned.
  return {
    valid: true,
    values: values as Record<FormFieldName<Definition>, string>,
  };
}
