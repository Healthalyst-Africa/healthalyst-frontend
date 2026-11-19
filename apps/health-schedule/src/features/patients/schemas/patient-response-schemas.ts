import { z } from "zod";

const sexSchema = z.enum(["male", "female", "other", "unknown"]);
const allergyCategorySchema = z.enum(["DRUG", "FOOD", "ENVIRONMENT", "OTHER"]);
const allergySeveritySchema = z.enum([
  "MILD",
  "MODERATE",
  "SEVERE",
  "LIFE_THREATENING",
]);
const allergyStatusSchema = z.enum(["UNKNOWN", "NONE_KNOWN", "RECORDED"]);
const missingFieldSchema = z.enum(["dateOfBirth", "phone"]);

/** One patient's insurance or scheme cover. */
export const patientCoverageSchema = z.object({
  id: z.string(),
  payerType: z.enum(["HMO", "NHIA", "STATE_SCHEME", "EMPLOYER", "OTHER"]),
  payerName: z.string(),
  planName: z.string().nullable(),
  memberNumber: z.string(),
  relationship: z.enum(["SELF", "SPOUSE", "CHILD", "OTHER"]),
  principalName: z.string().nullable(),
  employerName: z.string().nullable(),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
  isExpired: z.boolean(),
  isPrimary: z.boolean(),
  status: z.enum(["ACTIVE", "ENDED"]),
  eligibility: z.enum(["UNVERIFIED", "VERIFIED", "PENDING", "NOT_COVERED"]),
  eligibilityCheckedAt: z.string().nullable(),
  eligibilityReference: z.string().nullable(),
  eligibilityNote: z.string().nullable(),
  version: z.number().int(),
});

export const patientCoverageListSchema = z.object({
  data: z.array(patientCoverageSchema),
});

/** A patient's registration record (`POST /v1/patients` and `PATCH`). */
export const patientSchema = z.object({
  id: z.string(),
  patientNumber: z.string(),
  folderNumber: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().nullable(),
  sex: sexSchema,
  dateOfBirth: z.string().nullable(),
  dateOfBirthEstimated: z.boolean(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  stateCode: z.string().nullable(),
  preferredLanguage: z.string().nullable(),
  contactChannel: z.string().nullable(),
  missingFields: z.array(missingFieldSchema),
  nin: z.string().nullable(),
  hasNin: z.boolean(),
  isTemporary: z.boolean(),
  temporaryLabel: z.string().nullable(),
  status: z.enum(["ACTIVE", "MERGED"]),
  mergedIntoId: z.string().nullable(),
  version: z.number().int(),
  createdAt: z.string(),
});

/** `GET /v1/patients/{id}`: the record and everything the banner needs. */
export const patientDetailSchema = patientSchema.extend({
  allergyStatus: allergyStatusSchema,
  allergies: z.array(
    z.object({
      id: z.string(),
      substance: z.string(),
      category: allergyCategorySchema,
      severity: allergySeveritySchema.nullable(),
    })
  ),
  primaryCoverage: patientCoverageSchema.nullable(),
  /** The latest photo, opened through the document link. */
  photoDocumentId: z.string().nullable().default(null),
  restricted: z.boolean(),
  messaging: z.object({
    remindersConsent: z.boolean(),
    channel: z.string(),
    language: z.string(),
    canMessage: z.boolean(),
  }),
});

/** A search hit or a duplicate candidate. */
export const patientMatchSchema = patientSchema.pick({
  id: true,
  patientNumber: true,
  folderNumber: true,
  firstName: true,
  lastName: true,
  middleName: true,
  sex: true,
  dateOfBirth: true,
  dateOfBirthEstimated: true,
  phone: true,
  missingFields: true,
  isTemporary: true,
  temporaryLabel: true,
});

export const patientMatchListSchema = z.object({
  data: z.array(patientMatchSchema),
});

export const duplicateCandidatesSchema = z.object({
  data: z.array(
    z.object({
      patient: patientMatchSchema,
      score: z.number(),
      reasons: z.array(z.string()),
    })
  ),
});

const patientAllergySchema = z.object({
  id: z.string(),
  kind: z.enum(["ALLERGY", "NO_KNOWN_ALLERGIES"]),
  substance: z.string().nullable(),
  category: allergyCategorySchema.nullable(),
  reaction: z.string().nullable(),
  severity: allergySeveritySchema.nullable(),
  note: z.string().nullable(),
  status: z.enum(["ACTIVE", "RESOLVED", "ENTERED_IN_ERROR"]),
  recordedAt: z.string(),
  endedAt: z.string().nullable(),
  endReason: z.string().nullable(),
});

export const patientAllergiesSchema = z.object({
  status: allergyStatusSchema,
  active: z.array(patientAllergySchema),
  history: z.array(patientAllergySchema),
});

const relationshipTypeSchema = z.enum([
  "MOTHER",
  "FATHER",
  "PARENT",
  "CHILD",
  "SPOUSE",
  "SIBLING",
  "GUARDIAN",
  "NEXT_OF_KIN",
  "OTHER",
]);

/**
 * A family member, guardian or contact, from this patient's point of view. A
 * link recorded on the other patient is turned round (WARD, RELATED).
 */
export const patientRelationshipSchema = z.object({
  id: z.string(),
  type: z.union([relationshipTypeSchema, z.enum(["WARD", "RELATED"])]),
  relatedPatient: z
    .object({
      id: z.string(),
      patientNumber: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullable(),
  contact: z
    .object({ name: z.string(), phone: z.string().nullable() })
    .nullable(),
  isGuardian: z.boolean(),
  isEmergencyContact: z.boolean(),
  /** Recorded on the other patient's record, turned round here. */
  inverse: z.boolean(),
  createdAt: z.string(),
});

export const patientRelationshipListSchema = z.object({
  data: z.array(patientRelationshipSchema),
});

const consentTypeSchema = z.enum([
  "TREATMENT",
  "DATA_SHARING",
  "MARKETING",
  "RESEARCH",
  "REMINDERS",
]);

const patientConsentSchema = z.object({
  id: z.string(),
  type: consentTypeSchema,
  method: z.enum(["VERBAL", "WRITTEN", "ELECTRONIC_SIGNATURE"]),
  language: z.string(),
  signedBy: z.enum(["PATIENT", "GUARDIAN"]),
  guardianRelationshipId: z.string().nullable(),
  signerName: z.string().nullable(),
  witnessName: z.string().nullable(),
  notes: z.string().nullable(),
  givenAt: z.string(),
  revokedAt: z.string().nullable(),
  revokeReason: z.string().nullable(),
});

export const patientConsentsSchema = z.object({
  current: z.object({
    TREATMENT: z.boolean(),
    DATA_SHARING: z.boolean(),
    MARKETING: z.boolean(),
    RESEARCH: z.boolean(),
    REMINDERS: z.boolean(),
  }),
  history: z.array(patientConsentSchema),
});

const documentCategorySchema = z.enum([
  "PHOTO",
  "ID_DOCUMENT",
  "HMO_CARD",
  "CONSENT_FORM",
  "REFERRAL_LETTER",
  "EXTERNAL_RESULT",
  "OTHER",
]);

const documentContentTypeSchema = z.enum([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export const patientDocumentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  category: documentCategorySchema,
  title: z.string().nullable(),
  coverageId: z.string().nullable(),
  contentType: documentContentTypeSchema,
  sizeBytes: z.number().int(),
  status: z.enum([
    "PENDING_UPLOAD",
    "CLEAN",
    "REJECTED",
    "INFECTED",
    "REMOVED",
  ]),
  /** Referral letters and results from elsewhere: clinical staff only. */
  clinical: z.boolean(),
  /** A clinical document of a sensitive record: the title is hidden. */
  restricted: z.boolean(),
  createdAt: z.string(),
  checkedAt: z.string().nullable(),
  removedAt: z.string().nullable(),
  removedReason: z.string().nullable(),
});

export const patientDocumentListSchema = z.object({
  data: z.array(patientDocumentSchema),
});

/** Step one of an upload: where to send the file, and with which headers. */
export const documentUploadStartedSchema = z.object({
  document: patientDocumentSchema,
  upload: z.object({
    method: z.literal("PUT"),
    url: z.string(),
    headers: z.object({
      "Content-Type": z.string(),
      "Content-Length": z.string(),
    }),
    expiresAt: z.string(),
  }),
});

/** A five-minute link to open a document; never stored. */
export const documentLinkSchema = z.object({
  url: z.string(),
  expiresAt: z.string(),
});

const mergeFieldSchema = z.enum([
  "firstName",
  "lastName",
  "middleName",
  "sex",
  "dateOfBirth",
  "phone",
  "email",
  "addressLine",
  "city",
  "stateCode",
  "nin",
  "folderNumber",
  "preferredLanguage",
  "contactChannel",
]);

/** Two records side by side and the fields whose values differ. */
export const mergePreviewSchema = z.object({
  survivor: patientSchema,
  merged: patientSchema,
  differences: z.array(mergeFieldSchema),
});

const patientMergeSchema = z.object({
  id: z.string(),
  survivorId: z.string(),
  mergedId: z.string(),
  fieldsTaken: z.array(mergeFieldSchema),
  reason: z.string(),
  mergedById: z.string(),
  mergedAt: z.string(),
  /** Undo is possible until then (30 days), unless undone already. */
  undoUntil: z.string(),
  undoneAt: z.string().nullable(),
  undoReason: z.string().nullable(),
});

export const patientMergeResultSchema = z.object({
  merge: patientMergeSchema,
  survivor: patientSchema,
});

export const patientMergeListSchema = z.object({
  data: z.array(patientMergeSchema),
});

export type Patient = z.infer<typeof patientSchema>;
export type PatientDetail = z.infer<typeof patientDetailSchema>;
export type PatientMatch = z.infer<typeof patientMatchSchema>;
export type DuplicateCandidate = z.infer<
  typeof duplicateCandidatesSchema
>["data"][number];
export type PatientCoverage = z.infer<typeof patientCoverageSchema>;
export type PatientAllergy = z.infer<typeof patientAllergySchema>;
export type PatientAllergies = z.infer<typeof patientAllergiesSchema>;
export type AllergyStatus = z.infer<typeof allergyStatusSchema>;
export type PatientRelationship = z.infer<typeof patientRelationshipSchema>;
export type RelationshipType = z.infer<typeof relationshipTypeSchema>;
export type PatientConsents = z.infer<typeof patientConsentsSchema>;
export type PatientConsent = PatientConsents["history"][number];
export type ConsentType = z.infer<typeof consentTypeSchema>;
export type PatientDocument = z.infer<typeof patientDocumentSchema>;
export type DocumentCategory = z.infer<typeof documentCategorySchema>;
export type DocumentContentType = z.infer<typeof documentContentTypeSchema>;
export type DocumentUploadStarted = z.infer<typeof documentUploadStartedSchema>;
export type MergePreview = z.infer<typeof mergePreviewSchema>;
export type MergeField = z.infer<typeof mergeFieldSchema>;
export type PatientMerge = z.infer<typeof patientMergeSchema>;
