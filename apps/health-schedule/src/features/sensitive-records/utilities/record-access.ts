import {
  SENSITIVE_RECORD_PERMISSIONS,
  SENSITIVITY_CATEGORY_OPTIONS,
} from "~/features/sensitive-records/config/sensitive-records";
import type {
  RecordSensitivity,
  SensitivityCategory,
} from "~/features/sensitive-records/schemas/sensitive-record-response-schemas";

/**
 * What the reader may see of a record's clinical history:
 * - `open`: the record is not restricted.
 * - `care-team`: restricted, but the reader is in the care team.
 * - `emergency-access`: opened with emergency access until `until`.
 * - `locked-can-open`: restricted; the reader may open it in an emergency.
 * - `locked`: restricted, and the reader's role cannot open it.
 */
export type RecordAccess =
  | { state: "open" }
  | { state: "care-team" }
  | { state: "emergency-access"; until: string | null }
  | { state: "locked-can-open" }
  | { state: "locked" };

export function resolveRecordAccess(
  sensitivity: RecordSensitivity,
  permissions: readonly string[]
): RecordAccess {
  if (!sensitivity.restricted || sensitivity.access === "NOT_RESTRICTED") {
    return { state: "open" };
  }
  if (sensitivity.access === "CARE_TEAM") return { state: "care-team" };
  if (sensitivity.access === "BREAK_GLASS") {
    return { state: "emergency-access", until: sensitivity.accessUntil };
  }
  return permissions.includes(SENSITIVE_RECORD_PERMISSIONS.emergencyAccess)
    ? { state: "locked-can-open" }
    : { state: "locked" };
}

/** Whether the reader may see notes, problems and clinical documents. */
export function canSeeClinicalHistory(access: RecordAccess): boolean {
  return (
    access.state === "open" ||
    access.state === "care-team" ||
    access.state === "emergency-access"
  );
}

export function describeSensitivityCategory(
  category: SensitivityCategory
): string {
  return (
    SENSITIVITY_CATEGORY_OPTIONS.find((option) => option.value === category)
      ?.label ?? category
  );
}
