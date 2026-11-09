import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";

/**
 * Shows the API's validation messages beside their fields. Returns whether
 * any field received one, so the form can skip its general message.
 */
export function applyFieldErrors<FormValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<FormValues>,
  fieldNames: readonly Path<FormValues>[]
): boolean {
  if (!(error instanceof PlatformApiError)) return false;
  let applied = false;
  for (const fieldName of fieldNames) {
    const message = error.fieldErrors[fieldName];
    if (message) {
      setError(
        fieldName,
        { type: "server", message },
        { shouldFocus: !applied }
      );
      applied = true;
    }
  }
  return applied;
}
