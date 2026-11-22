import type {
  AllergyFormValues,
  ConsentFormValues,
  CoverageFormValues,
  DocumentUploadFormValues,
  EligibilityFormValues,
  EndAllergyFormValues,
  PatientFormValues,
  RelationshipFormValues,
} from "~/features/patients/schemas/patient-form-schemas";
import type {
  Patient,
  PatientCoverage,
} from "~/features/patients/schemas/patient-response-schemas";
import { toInternationalPhoneNumber } from "~/shared/contact/phone-number";

/** Empty text as undefined, so optional fields are left out. */
function readText(text: string): string | undefined {
  const trimmedText = text.trim();
  return trimmedText === "" ? undefined : trimmedText;
}

function readPhone(phone: string): string | undefined {
  return toInternationalPhoneNumber(phone) ?? undefined;
}

function readBirth(values: {
  birthKnown: "date" | "age";
  dateOfBirth: string;
  ageYears: string;
}): { dateOfBirth: string } | { ageYears: number } | Record<string, never> {
  if (values.birthKnown === "date") {
    return values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {};
  }
  return values.ageYears.trim()
    ? { ageYears: Number(values.ageYears.trim()) }
    : {};
}

/** Only the fields with a value, so the API applies its own defaults. */
function compact(request: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(request).filter(([, value]) => value !== undefined)
  );
}

export type RegistrationRequest = Record<string, unknown> & {
  id: string;
  firstName: string;
  lastName: string;
  sex: string;
  phone: string;
};

/**
 * A full or quick registration. NIN and reminder consent are sent only by
 * staff allowed to record them.
 */
export function toRegistrationRequest(
  values: PatientFormValues,
  {
    registrationIdentifier,
    canRecordNin,
    canRecordConsent,
  }: {
    registrationIdentifier: string;
    canRecordNin: boolean;
    canRecordConsent: boolean;
  }
): { kind: "full" | "quick"; request: RegistrationRequest } {
  const phone = readPhone(values.phone);
  if (!phone) throw new Error("Enter a phone number such as 0803 123 4567.");
  const request: RegistrationRequest = {
    id: registrationIdentifier,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    sex: values.sex,
    phone,
    ...compact({
      middleName: readText(values.middleName),
      email: readText(values.email),
      addressLine: readText(values.addressLine),
      city: readText(values.city),
      stateCode: readText(values.stateCode),
      folderNumber: readText(values.folderNumber),
      nin: canRecordNin ? readText(values.nin) : undefined,
      preferredLanguage: readText(values.preferredLanguage),
      contactChannel: readText(values.contactChannel),
      remindersConsent:
        canRecordConsent && values.remindersConsent
          ? { method: "VERBAL" }
          : undefined,
    }),
    ...(values.detailsLater ? {} : readBirth(values)),
  };
  return { kind: values.detailsLater ? "quick" : "full", request };
}

/** What the duplicate check needs: name, plus anything else typed so far. */
export function toDuplicateCheckRequest(
  values: Pick<
    PatientFormValues,
    | "firstName"
    | "lastName"
    | "sex"
    | "birthKnown"
    | "dateOfBirth"
    | "ageYears"
    | "phone"
  >
): Record<string, unknown> | null {
  const firstName = readText(values.firstName);
  const lastName = readText(values.lastName);
  if (!firstName || !lastName) return null;
  const birth = readBirth(values);
  const hasUsableBirth =
    "dateOfBirth" in birth ||
    ("ageYears" in birth && Number.isInteger(birth.ageYears));
  return {
    firstName,
    lastName,
    ...compact({
      sex: readText(values.sex),
      phone: readPhone(values.phone),
    }),
    ...(hasUsableBirth ? birth : {}),
  };
}

/** A patient's record as the details form shows it. */
export function toPatientFormValues(patient: Patient): PatientFormValues {
  return {
    firstName: patient.firstName,
    middleName: patient.middleName ?? "",
    lastName: patient.lastName,
    sex: patient.sex,
    birthKnown:
      patient.dateOfBirth && patient.dateOfBirthEstimated ? "age" : "date",
    dateOfBirth:
      patient.dateOfBirth && !patient.dateOfBirthEstimated
        ? patient.dateOfBirth
        : "",
    ageYears: "",
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    addressLine: patient.addressLine ?? "",
    city: patient.city ?? "",
    stateCode: patient.stateCode ?? "",
    folderNumber: patient.folderNumber ?? "",
    nin: patient.nin ?? "",
    preferredLanguage: patient.preferredLanguage ?? "",
    contactChannel: patient.contactChannel ?? "",
    detailsLater: false,
    remindersConsent: false,
  };
}

const OPTIONAL_TEXT_FIELDS = [
  "middleName",
  "email",
  "addressLine",
  "city",
  "stateCode",
  "folderNumber",
  "preferredLanguage",
  "contactChannel",
] as const;

/**
 * Only what changed, for `PATCH /v1/patients/{id}`. A cleared optional field
 * is sent as null. The age is sent only when typed, since the record keeps
 * an estimated date of birth rather than the age.
 */
export function toPatientChanges(
  patient: Patient,
  values: PatientFormValues,
  { canRecordNin }: { canRecordNin: boolean }
): Record<string, unknown> {
  const changes: Record<string, unknown> = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  if (firstName !== patient.firstName) changes.firstName = firstName;
  if (lastName !== patient.lastName) changes.lastName = lastName;
  if (values.sex !== patient.sex) changes.sex = values.sex;
  for (const field of OPTIONAL_TEXT_FIELDS) {
    const value = readText(values[field]) ?? null;
    if (value !== patient[field]) changes[field] = value;
  }
  const phone = readPhone(values.phone);
  if (phone && phone !== patient.phone) changes.phone = phone;
  if (canRecordNin) {
    const nin = readText(values.nin) ?? null;
    if (nin !== patient.nin) changes.nin = nin;
  }
  const birth = readBirth(values);
  if ("dateOfBirth" in birth) {
    if (
      birth.dateOfBirth !== patient.dateOfBirth ||
      patient.dateOfBirthEstimated
    ) {
      changes.dateOfBirth = birth.dateOfBirth;
    }
  } else if ("ageYears" in birth) {
    changes.ageYears = birth.ageYears;
  }
  return changes;
}

export function toAllergyRequest(values: AllergyFormValues) {
  return {
    substance: values.substance.trim(),
    category: values.category,
    ...compact({
      reaction: readText(values.reaction),
      severity: readText(values.severity),
      note: readText(values.note),
    }),
  };
}

export function toEndAllergyRequest(values: EndAllergyFormValues) {
  return { status: values.status, reason: values.reason.trim() };
}

/** The cover form, empty or filled from a saved cover. */
export function toCoverageFormValues(
  coverage: PatientCoverage | null
): CoverageFormValues {
  return {
    payerType: coverage?.payerType ?? "",
    payerName: coverage?.payerName ?? "",
    planName: coverage?.planName ?? "",
    memberNumber: coverage?.memberNumber ?? "",
    relationship: coverage?.relationship ?? "SELF",
    principalName: coverage?.principalName ?? "",
    employerName: coverage?.employerName ?? "",
    validFrom: coverage?.validFrom ?? "",
    validUntil: coverage?.validUntil ?? "",
    isPrimary: coverage?.isPrimary ?? false,
  };
}

/** A new cover. Without "primary" ticked, the API makes the first cover primary. */
export function toCoverageRequest(values: CoverageFormValues) {
  return {
    payerType: values.payerType,
    payerName: values.payerName.trim(),
    memberNumber: values.memberNumber.trim(),
    relationship: values.relationship,
    ...compact({
      planName: readText(values.planName),
      principalName:
        values.relationship === "SELF"
          ? undefined
          : readText(values.principalName),
      employerName: readText(values.employerName),
      validFrom: readText(values.validFrom),
      validUntil: readText(values.validUntil),
      isPrimary: values.isPrimary || undefined,
    }),
  };
}

const COVERAGE_FIELDS = [
  "payerType",
  "payerName",
  "memberNumber",
  "relationship",
  "planName",
  "principalName",
  "employerName",
  "validFrom",
  "validUntil",
  "isPrimary",
] as const;

/** Only what changed on a saved cover; cleared optional fields become null. */
export function toCoverageChanges(
  coverage: PatientCoverage,
  values: CoverageFormValues
): Record<string, unknown> {
  const next: Record<(typeof COVERAGE_FIELDS)[number], unknown> = {
    payerType: values.payerType,
    payerName: values.payerName.trim(),
    memberNumber: values.memberNumber.trim(),
    relationship: values.relationship,
    planName: readText(values.planName) ?? null,
    principalName:
      values.relationship === "SELF"
        ? null
        : (readText(values.principalName) ?? null),
    employerName: readText(values.employerName) ?? null,
    validFrom: readText(values.validFrom) ?? null,
    validUntil: readText(values.validUntil) ?? null,
    isPrimary: values.isPrimary,
  };
  const changes: Record<string, unknown> = {};
  for (const field of COVERAGE_FIELDS) {
    if (next[field] !== coverage[field]) changes[field] = next[field];
  }
  return changes;
}

export function toEligibilityRequest(values: EligibilityFormValues) {
  return {
    result: values.result,
    ...compact({
      reference: readText(values.reference),
      note: readText(values.note),
    }),
  };
}

/** Either another patient (`relatedPatientId`) or a contact, never both. */
export function toRelationshipRequest(values: RelationshipFormValues) {
  const flags = {
    type: values.type,
    isGuardian: values.isGuardian,
    isEmergencyContact: values.isEmergencyContact,
  };
  if (values.linkTo === "patient") {
    return { ...flags, relatedPatientId: values.relatedPatientId };
  }
  return {
    ...flags,
    contact: compact({
      name: values.contactName.trim(),
      phone: readPhone(values.contactPhone),
    }),
  };
}

/** A guardian's consent names the guardian relationship, and only then. */
export function toConsentRequest(type: string, values: ConsentFormValues) {
  return compact({
    type,
    method: values.method,
    language: values.language,
    signedBy: values.signedBy,
    guardianRelationshipId:
      values.signedBy === "GUARDIAN"
        ? values.guardianRelationshipId
        : undefined,
    signerName: readText(values.signerName),
    witnessName: readText(values.witnessName),
    notes: readText(values.notes),
  });
}

/** Step one of an upload: what the file is, before it is sent. */
export function toDocumentUploadRequest(
  values: DocumentUploadFormValues,
  file: File,
  coverageId?: string
) {
  return compact({
    category: values.category,
    title: readText(values.title),
    contentType: file.type,
    sizeBytes: file.size,
    coverageId,
  });
}
