import type { StatusTone } from "@healthalyst/ui/types/status-tone";

/** HealthSchedule API paths for patient records. */
export const PATIENT_ENDPOINTS = {
  patients: "/v1/patients",
  quickPatient: "/v1/patients/quick",
  duplicateCheck: "/v1/patients/duplicate-check",
  patient: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}`,
  allergies: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/allergies`,
  noKnownAllergies: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/allergies/none`,
  endAllergy: (patientId: string, allergyId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/allergies/${encodeURIComponent(allergyId)}/end`,
  coverage: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/coverage`,
  coverageEntry: (patientId: string, coverageId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/coverage/${encodeURIComponent(coverageId)}`,
  duplicates: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/duplicates`,
  mergePreview: "/v1/patients/merge-preview",
  merges: "/v1/patients/merges",
  undoMerge: (mergeId: string) =>
    `/v1/patients/merges/${encodeURIComponent(mergeId)}/undo`,
  relationships: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/relationships`,
  relationship: (patientId: string, relationshipId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/relationships/${encodeURIComponent(relationshipId)}`,
  consents: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/consents`,
  revokeConsent: (patientId: string, consentId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/consents/${encodeURIComponent(consentId)}/revoke`,
  documents: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/documents`,
  completeDocument: (patientId: string, documentId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/documents/${encodeURIComponent(documentId)}/complete`,
  documentLink: (patientId: string, documentId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/documents/${encodeURIComponent(documentId)}/link`,
  removeDocument: (patientId: string, documentId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/documents/${encodeURIComponent(documentId)}/remove`,
  eligibility: (patientId: string, coverageId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/coverage/${encodeURIComponent(coverageId)}/eligibility`,
} as const;

export const PATIENT_PERMISSIONS = {
  read: "patient:read",
  create: "patient:create",
  update: "patient:update",
  /** See, record and search by NIN. */
  identityNumbers: "patient:id-numbers",
  /** Record consents, including consent to reminders. */
  consent: "patient:consent",
  /** Merge duplicate records and undo a merge (owners and admins). */
  merge: "patient:merge",
  /** Nurses and doctors may record allergies too. */
  recordTriage: "triage:record",
} as const;

export const PATIENT_FIELD_LIMITS = {
  name: 100,
  email: 254,
  addressLine: 200,
  city: 100,
  folderNumber: 40,
  ageYears: 130,
  allergySubstance: { minimum: 2, maximum: 100 },
  allergyReaction: 200,
  allergyNote: 500,
  endReason: { minimum: 3, maximum: 500 },
  payerName: { minimum: 2, maximum: 100 },
  memberNumber: { minimum: 2, maximum: 50 },
  planName: 100,
  principalName: 100,
  employerName: 100,
  eligibilityReference: 50,
  eligibilityNote: 500,
} as const;

/** Duplicate candidates from this score are shown; from the second, likely. */
export const DUPLICATE_SCORES = { shown: 0.5, likely: 0.8 } as const;

/** The duplicate check waits for a pause in typing. */
export const DUPLICATE_CHECK_DELAY_MILLISECONDS = 500;

export const PATIENT_SEX_LABELS = {
  female: "Female",
  male: "Male",
  other: "Other",
  unknown: "Not known",
} as const;

export const CONTACT_LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "pcm", label: "Pidgin" },
  { value: "yo", label: "Yoruba" },
  { value: "ig", label: "Igbo" },
  { value: "ha", label: "Hausa" },
] as const;

export const CONTACT_CHANNEL_OPTIONS = [
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "CALL", label: "Phone call from staff (no automatic messages)" },
] as const;

/** Nigerian states and the Federal Capital Territory, by their two-letter codes. */
export const STATE_OPTIONS = [
  ["AB", "Abia"],
  ["AD", "Adamawa"],
  ["AK", "Akwa Ibom"],
  ["AN", "Anambra"],
  ["BA", "Bauchi"],
  ["BY", "Bayelsa"],
  ["BE", "Benue"],
  ["BO", "Borno"],
  ["CR", "Cross River"],
  ["DE", "Delta"],
  ["EB", "Ebonyi"],
  ["ED", "Edo"],
  ["EK", "Ekiti"],
  ["EN", "Enugu"],
  ["FC", "Federal Capital Territory"],
  ["GO", "Gombe"],
  ["IM", "Imo"],
  ["JI", "Jigawa"],
  ["KD", "Kaduna"],
  ["KN", "Kano"],
  ["KT", "Katsina"],
  ["KE", "Kebbi"],
  ["KO", "Kogi"],
  ["KW", "Kwara"],
  ["LA", "Lagos"],
  ["NA", "Nasarawa"],
  ["NI", "Niger"],
  ["OG", "Ogun"],
  ["ON", "Ondo"],
  ["OS", "Osun"],
  ["OY", "Oyo"],
  ["PL", "Plateau"],
  ["RI", "Rivers"],
  ["SO", "Sokoto"],
  ["TA", "Taraba"],
  ["YO", "Yobe"],
  ["ZA", "Zamfara"],
].map(([value = "", label = ""]) => ({ value, label }));

export const MISSING_FIELD_LABELS = {
  dateOfBirth: "date of birth or age",
  phone: "phone number",
} as const;

export const DUPLICATE_REASON_LABELS = {
  SAME_NIN: "Same NIN",
  SAME_PHONE: "Same phone number",
  SIMILAR_NAME: "Similar name",
  SOUNDS_LIKE: "Name sounds alike",
  SAME_DATE_OF_BIRTH: "Same date of birth",
  SAME_BIRTH_YEAR: "Same birth year",
  DIFFERENT_SEX: "Different sex recorded",
} as const;

export const ALLERGY_CATEGORY_OPTIONS = [
  { value: "DRUG", label: "Medicine" },
  { value: "FOOD", label: "Food" },
  { value: "ENVIRONMENT", label: "Environment (such as pollen or latex)" },
  { value: "OTHER", label: "Other" },
] as const;

export const ALLERGY_SEVERITY_OPTIONS = [
  { value: "MILD", label: "Mild" },
  { value: "MODERATE", label: "Moderate" },
  { value: "SEVERE", label: "Severe" },
  { value: "LIFE_THREATENING", label: "Life-threatening" },
] as const;

export const ALLERGY_END_OPTIONS = [
  {
    value: "RESOLVED",
    label: "No longer allergic",
    description: "For example after testing.",
  },
  {
    value: "ENTERED_IN_ERROR",
    label: "Recorded by mistake",
    description: "It stays in the history, struck through.",
  },
] as const;

export const ALLERGY_STATUS_PRESENTATION = {
  UNKNOWN: { label: "Allergies not asked", tone: "warning" },
  NONE_KNOWN: { label: "No known allergies", tone: "positive" },
  RECORDED: { label: "Allergies recorded", tone: "negative" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

export const PAYER_TYPE_OPTIONS = [
  { value: "HMO", label: "HMO" },
  { value: "NHIA", label: "NHIA" },
  { value: "STATE_SCHEME", label: "State health scheme" },
  { value: "EMPLOYER", label: "Employer" },
  { value: "OTHER", label: "Other" },
] as const;

export const COVERAGE_RELATIONSHIP_OPTIONS = [
  { value: "SELF", label: "The patient is the member" },
  { value: "SPOUSE", label: "Spouse of the member" },
  { value: "CHILD", label: "Child of the member" },
  { value: "OTHER", label: "Other dependant" },
] as const;

export const ELIGIBILITY_PRESENTATION = {
  UNVERIFIED: { label: "Not checked", tone: "neutral" },
  VERIFIED: { label: "Cover confirmed", tone: "positive" },
  PENDING: { label: "Waiting for the payer", tone: "information" },
  NOT_COVERED: { label: "Not covered", tone: "negative" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

export const ELIGIBILITY_RESULT_OPTIONS = [
  {
    value: "VERIFIED",
    label: "Cover confirmed",
    description: "The payer confirmed the patient is covered.",
    tone: "positive",
  },
  {
    value: "PENDING",
    label: "Waiting for the payer",
    description: "Asked, but no answer yet.",
    tone: "information",
  },
  {
    value: "NOT_COVERED",
    label: "Not covered",
    description: "The payer will not pay for this visit.",
    tone: "negative",
  },
] as const;

/** Lists of patients with details still to complete, newest first. */
export const INCOMPLETE_PATIENT_LIMIT = 20;

/** The patient record's tabs; the address keeps the open one as `?section=`. */
export const PATIENT_RECORD_SECTIONS = [
  { value: "overview", label: "Overview" },
  { value: "family", label: "Family and contacts" },
  { value: "consents", label: "Consents" },
  { value: "documents", label: "Documents" },
] as const;

/** Read as "this person is the patient's …". */
export const RELATIONSHIP_TYPE_OPTIONS = [
  { value: "MOTHER", label: "Mother" },
  { value: "FATHER", label: "Father" },
  { value: "PARENT", label: "Parent" },
  { value: "CHILD", label: "Child" },
  { value: "SPOUSE", label: "Spouse" },
  { value: "SIBLING", label: "Brother or sister" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "NEXT_OF_KIN", label: "Next of kin" },
  { value: "OTHER", label: "Other" },
] as const;

/** Relationships seen from the other side, which the API turns round. */
export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  ...Object.fromEntries(
    RELATIONSHIP_TYPE_OPTIONS.map((option) => [option.value, option.label])
  ),
  WARD: "Ward (in their care)",
  RELATED: "Related",
};

export const CONSENT_TYPES = [
  {
    value: "TREATMENT",
    label: "Treatment",
    description: "Agrees to examination and treatment at this facility.",
  },
  {
    value: "DATA_SHARING",
    label: "Sharing records",
    description:
      "Agrees to records being shared with other facilities caring for them.",
  },
  {
    value: "REMINDERS",
    label: "Reminders and messages",
    description: "Agrees to appointment reminders and service messages.",
  },
  {
    value: "MARKETING",
    label: "Marketing",
    description: "Agrees to news and offers from the facility.",
  },
  {
    value: "RESEARCH",
    label: "Research",
    description: "Agrees to their records being used in approved research.",
  },
] as const;

export const CONSENT_METHOD_OPTIONS = [
  { value: "VERBAL", label: "Spoken" },
  { value: "WRITTEN", label: "Written form" },
  { value: "ELECTRONIC_SIGNATURE", label: "Signed on screen" },
] as const;

export const CONSENT_FIELD_LIMITS = {
  name: 200,
  notes: 1000,
  revokeReason: { minimum: 3, maximum: 500 },
} as const;

export const DOCUMENT_CATEGORY_OPTIONS = [
  { value: "PHOTO", label: "Photo of the patient" },
  { value: "ID_DOCUMENT", label: "ID document" },
  { value: "HMO_CARD", label: "Insurance card" },
  { value: "CONSENT_FORM", label: "Signed consent form" },
  { value: "REFERRAL_LETTER", label: "Referral letter" },
  { value: "EXTERNAL_RESULT", label: "Result from elsewhere" },
  { value: "OTHER", label: "Other" },
] as const;

/** Clinical documents: listed for everyone, opened by clinical staff only. */
export const CLINICAL_DOCUMENT_CATEGORIES = [
  "REFERRAL_LETTER",
  "EXTERNAL_RESULT",
] as const;

export const DOCUMENT_UPLOAD_LIMITS = {
  maximumBytes: 10 * 1024 * 1024,
  contentTypes: ["application/pdf", "image/jpeg", "image/png"],
  photoContentTypes: ["image/jpeg", "image/png"],
  titleMaximumLength: 120,
  removeReason: { minimum: 3, maximum: 500 },
} as const;

/** What the file picker offers, in react-dropzone's format. */
export const DOCUMENT_ACCEPTED_FILES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
} as const;

export const PHOTO_ACCEPTED_FILES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
} as const;

/** How a document's virus check went, for the list and the upload dialog. */
export const DOCUMENT_STATUS_PRESENTATION = {
  PENDING_UPLOAD: { label: "Not finished uploading", tone: "warning" },
  CLEAN: { label: "Checked", tone: "positive" },
  REJECTED: {
    label: "Refused: not the file type it claimed",
    tone: "negative",
  },
  INFECTED: { label: "Refused: a virus was found", tone: "negative" },
  REMOVED: { label: "Removed", tone: "neutral" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>;

/** Uploads are checked for viruses; when the scanner is busy, try again shortly. */
export const DOCUMENT_CHECK_RETRY = {
  attemptLimit: 3,
  delayMilliseconds: 3000,
} as const;

/** Registration fields a merge can take from the duplicate. */
export const MERGE_FIELD_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  middleName: "Middle name",
  sex: "Sex",
  dateOfBirth: "Date of birth",
  phone: "Phone",
  email: "Email",
  addressLine: "Address",
  city: "Town or city",
  stateCode: "State",
  nin: "NIN",
  folderNumber: "Folder number",
  preferredLanguage: "Message language",
  contactChannel: "Contact by",
} as const;

export const MERGE_REASON_LENGTH = { minimum: 5, maximum: 500 } as const;
