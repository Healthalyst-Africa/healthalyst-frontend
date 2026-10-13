import { z } from "zod";

export function parseFormData<Schema extends z.ZodType>(
  schema: Schema,
  formData: FormData
):
  | { success: true; data: z.output<Schema> }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(Object.fromEntries(formData));
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
