import type { FieldErrors, FieldValues } from "react-hook-form";

/**
 * Focuses the first field with an error, in the order the fields appear.
 * Shared selects and date pickers do not pass element references to the
 * form library, so fields are found by their element identifiers.
 */
export function focusFirstInvalidField<FormValues extends FieldValues>(
  errors: FieldErrors<FormValues>,
  fieldIdentifiers: Readonly<Partial<Record<keyof FormValues, string>>>
) {
  const firstInvalidField = Object.keys(fieldIdentifiers).find(
    (fieldName) => errors[fieldName]
  );
  if (!firstInvalidField) return;
  const elementIdentifier = fieldIdentifiers[firstInvalidField];
  if (elementIdentifier) document.getElementById(elementIdentifier)?.focus();
}
