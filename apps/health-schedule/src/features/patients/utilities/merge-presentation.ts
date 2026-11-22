import {
  CONTACT_CHANNEL_OPTIONS,
  CONTACT_LANGUAGE_OPTIONS,
  MERGE_FIELD_LABELS,
  PATIENT_SEX_LABELS,
  STATE_OPTIONS,
} from "~/features/patients/config/patients";
import type {
  MergeField,
  MergePreview,
  Patient,
  PatientMerge,
} from "~/features/patients/schemas/patient-response-schemas";
import { describeDate } from "~/features/patients/utilities/patient-presentation";

const BLANK = "Blank";

function labelOf(
  options: readonly { value: string; label: string }[],
  value: string
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** A record's value for a field that differs, in words. */
export function describeMergeValue(
  field: MergeField,
  patient: Patient
): string {
  const value = patient[field];
  if (value === null || value === "") return BLANK;
  switch (field) {
    case "sex":
      return PATIENT_SEX_LABELS[patient.sex];
    case "dateOfBirth":
      return `${describeDate(String(value))}${patient.dateOfBirthEstimated ? " (estimated)" : ""}`;
    case "stateCode":
      return labelOf(STATE_OPTIONS, String(value));
    case "preferredLanguage":
      return labelOf(CONTACT_LANGUAGE_OPTIONS, String(value));
    case "contactChannel":
      return labelOf(CONTACT_CHANNEL_OPTIONS, String(value));
    default:
      return String(value);
  }
}

export function describeMergeField(field: MergeField): string {
  return MERGE_FIELD_LABELS[field];
}

/**
 * Fields to take from the duplicate unless someone decides otherwise: those
 * the record that stays has left blank.
 */
export function readDefaultTakenFields(preview: MergePreview): MergeField[] {
  return preview.differences.filter((field) => {
    const survivorValue = preview.survivor[field];
    const mergedValue = preview.merged[field];
    const isBlank = (value: unknown) => value === null || value === "";
    return isBlank(survivorValue) && !isBlank(mergedValue);
  });
}

/** Undo is possible for 30 days, unless it has been undone already. */
export function canUndoMerge(merge: PatientMerge, now: Date): boolean {
  return merge.undoneAt === null && new Date(merge.undoUntil) > now;
}

export function describeMergeState(
  merge: PatientMerge,
  now: Date
): { label: string; tone: "neutral" | "information" } {
  if (merge.undoneAt) return { label: "Undone", tone: "neutral" };
  if (canUndoMerge(merge, now)) {
    return {
      label: `Can undo until ${describeDate(merge.undoUntil)}`,
      tone: "information",
    };
  }
  return { label: "Final", tone: "neutral" };
}
