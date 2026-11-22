/** HealthSchedule API paths for restricted records and emergency access. */
export const SENSITIVE_RECORD_ENDPOINTS = {
  sensitivity: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/sensitivity`,
  labels: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/sensitivity-labels`,
  removeLabel: (patientId: string, labelId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/sensitivity-labels/${encodeURIComponent(labelId)}/remove`,
  emergencyAccess: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/break-glass`,
  accessGrants: "/v1/break-glass",
  reviewGrant: (grantId: string) =>
    `/v1/break-glass/${encodeURIComponent(grantId)}/review`,
} as const;

export const SENSITIVE_RECORD_PERMISSIONS = {
  /** Add and remove sensitivity labels. */
  manageLabels: "sensitive:manage",
  /** Clinical staff outside the care team may open a restricted record. */
  emergencyAccess: "triage:record",
  /** Owners, administrators and managers review emergency access. */
  reviewAccess: "audit:read",
} as const;

export const SENSITIVITY_CATEGORY_OPTIONS = [
  { value: "HIV", label: "HIV" },
  { value: "MENTAL_HEALTH", label: "Mental health" },
  {
    value: "SEXUAL_REPRODUCTIVE_HEALTH",
    label: "Sexual and reproductive health",
  },
  { value: "SUBSTANCE_USE", label: "Substance use" },
  { value: "RESTRICTED_PERSON", label: "Restricted person" },
] as const;

export const ACCESS_REVIEW_OUTCOME_OPTIONS = [
  {
    value: "JUSTIFIED",
    label: "Justified",
    description: "The access was needed for the patient's care.",
  },
  {
    value: "NOT_JUSTIFIED",
    label: "Not justified",
    description: "The access was not needed. Follow your facility's process.",
  },
] as const;

export const SENSITIVE_RECORD_LIMITS = {
  labelReasonMinimum: 3,
  labelReasonMaximum: 500,
  emergencyReasonMinimum: 10,
  emergencyReasonMaximum: 500,
  reviewNoteMinimum: 3,
  reviewNoteMaximum: 1000,
  grantsPage: 200,
  /** How long emergency access lasts, as the API grants it. */
  emergencyAccessHours: 4,
} as const;
