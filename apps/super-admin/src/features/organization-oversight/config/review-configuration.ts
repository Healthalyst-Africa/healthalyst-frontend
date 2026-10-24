export const REVIEW_PRODUCTS = [
  { code: "HEALTHSCHEDULE", label: "HealthSchedule" },
  { code: "LABCONNECT", label: "LabConnect" },
  { code: "PHARMADESK", label: "PharmaDesk" },
] as const;

export const REVIEW_PRODUCT_CODES = REVIEW_PRODUCTS.map(
  (product) => product.code
);

export const REVIEW_CHECKLIST_ITEMS = [
  { name: "cacVerified", label: "CAC certificate checked" },
  { name: "facilityLicenceVerified", label: "Facility licence checked" },
  { name: "directorLicenceVerified", label: "Director licence checked" },
  { name: "addressPlausible", label: "Organisation address is plausible" },
  { name: "duplicateChecked", label: "Possible duplicates checked" },
] as const;

export const REVIEW_REJECTION_REASONS = [
  { code: "INCOMPLETE_INFORMATION", label: "Incomplete information" },
  { code: "INVALID_DOCUMENTS", label: "Invalid documents" },
  { code: "UNVERIFIABLE_LICENCE", label: "Licence cannot be verified" },
  { code: "DUPLICATE_ORGANIZATION", label: "Duplicate organisation" },
  { code: "OUT_OF_SERVICE_AREA", label: "Outside service area" },
  { code: "NOT_A_HEALTH_FACILITY", label: "Not a health facility" },
  { code: "FRAUD_SUSPECTED", label: "Suspected fraud" },
  { code: "OTHER", label: "Other" },
] as const;

export const REVIEW_REJECTION_CODES = REVIEW_REJECTION_REASONS.map(
  (reason) => reason.code
);

export const REVIEW_VALIDATION_LIMITS = {
  noteMaximumLength: 2000,
  rejectionMessageMinimumLength: 10,
  changeFieldMaximumLength: 100,
  changeMessageMinimumLength: 3,
  changeMessageMaximumLength: 500,
} as const;
