import { z } from "zod";

/**
 * Form values by name. A name that appears more than once, such as a group of
 * checkboxes, becomes an array of its values; other names keep a single value.
 */
function formDataToRecord(
  formData: FormData
): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const record: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const fieldName of new Set(formData.keys())) {
    const values = formData.getAll(fieldName);
    record[fieldName] = values.length > 1 ? values : (values[0] ?? "");
  }
  return record;
}

export function parseFormData<Schema extends z.ZodType>(
  schema: Schema,
  formData: FormData
):
  | { success: true; data: z.output<Schema> }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(formDataToRecord(formData));
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const fieldName = issue.path[0];
    if (typeof fieldName === "string" && !errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  }

  return { success: false, errors };
}

export function focusFirstInvalidField(
  form: HTMLFormElement,
  errors: Record<string, string>
): void {
  const firstFieldName = Object.keys(errors)[0];
  if (!firstFieldName) return;

  const visibleControl = Array.from(
    form.querySelectorAll<HTMLElement>("[id]")
  ).find(
    (element) =>
      element.id === firstFieldName || element.id.endsWith(`-${firstFieldName}`)
  );
  visibleControl?.focus();
}

export function clearFieldError(
  errors: Record<string, string>,
  fieldName: string
): Record<string, string> {
  const updatedErrors = { ...errors };
  delete updatedErrors[fieldName];
  return updatedErrors;
}

/** The errors that belong to `fieldNames`, keeping their original order. */
export function pickFieldErrors(
  errors: Readonly<Record<string, string>>,
  fieldNames: readonly string[]
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).filter(([fieldName]) =>
      fieldNames.includes(fieldName)
    )
  );
}
