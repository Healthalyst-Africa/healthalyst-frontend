import {
  differenceInMonths,
  differenceInYears,
  format,
  parseISO,
} from "date-fns";
import {
  DUPLICATE_REASON_LABELS,
  MISSING_FIELD_LABELS,
  PATIENT_SEX_LABELS,
  PAYER_TYPE_OPTIONS,
} from "~/features/patients/config/patients";
import type {
  Patient,
  PatientCoverage,
} from "~/features/patients/schemas/patient-response-schemas";

/** The name staff use, or the description of an unidentified patient. */
export function describePatientFullName(
  patient: Pick<
    Patient,
    "firstName" | "middleName" | "lastName" | "isTemporary" | "temporaryLabel"
  >
): string {
  if (patient.isTemporary && patient.temporaryLabel) {
    return patient.temporaryLabel;
  }
  return [patient.firstName, patient.middleName, patient.lastName]
    .filter(Boolean)
    .join(" ");
}

/**
 * The age from a date of birth: months for babies, years after that,
 * "about" when the date was worked out from an age.
 */
export function describeAge(
  dateOfBirth: string | null,
  isEstimated: boolean,
  now: Date = new Date()
): string | null {
  if (!dateOfBirth) return null;
  const birth = parseISO(dateOfBirth);
  const years = differenceInYears(now, birth);
  if (years < 2) {
    const months = differenceInMonths(now, birth);
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  return `${isEstimated ? "about " : ""}${years} years`;
}

/** A calendar date as "12 May 1986". */
export function describeDate(dateValue: string): string {
  return format(parseISO(dateValue), "d MMM yyyy");
}

/** Sex, age and numbers: "Female · 34 years · P000123 · Folder OPD/2019/0412". */
export function describePatientFacts(
  patient: Pick<
    Patient,
    | "sex"
    | "dateOfBirth"
    | "dateOfBirthEstimated"
    | "patientNumber"
    | "folderNumber"
  >,
  now: Date = new Date()
): string[] {
  return [
    PATIENT_SEX_LABELS[patient.sex],
    describeAge(patient.dateOfBirth, patient.dateOfBirthEstimated, now),
    patient.patientNumber,
    patient.folderNumber ? `Folder ${patient.folderNumber}` : null,
  ].filter((fact): fact is string => fact !== null);
}

/** "date of birth or age and phone number". */
export function describeMissingFields(
  missingFields: readonly (keyof typeof MISSING_FIELD_LABELS)[]
): string {
  return missingFields
    .map((field) => MISSING_FIELD_LABELS[field])
    .join(" and ");
}

const DUPLICATE_REASON_WORDS = new Map<string, string>(
  Object.entries(DUPLICATE_REASON_LABELS)
);

/** Why a record looks like the same person: "Same phone number, Similar name". */
export function describeDuplicateReasons(reasons: readonly string[]): string {
  return reasons
    .map((reason) => DUPLICATE_REASON_WORDS.get(reason) ?? reason)
    .join(", ");
}

/** "Reliance HMO, Gold plan" or "NHIA". */
export function describeCoverage(
  coverage: Pick<PatientCoverage, "payerType" | "payerName" | "planName">
): string {
  const payer =
    coverage.payerName ||
    PAYER_TYPE_OPTIONS.find((option) => option.value === coverage.payerType)
      ?.label ||
    "Cover";
  return coverage.planName ? `${payer}, ${coverage.planName}` : payer;
}

/** The version a record was read at, as the API's `If-Match` value. */
export function toEntityTag(version: number): string {
  return `"${version}"`;
}
