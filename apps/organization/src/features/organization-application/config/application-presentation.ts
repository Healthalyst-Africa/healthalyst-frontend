export const ORGANIZATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_VERIFICATION: "Waiting for verification",
  UNDER_REVIEW: "Under review",
  CHANGES_REQUESTED: "Changes requested",
  ACTIVE: "Approved",
  SUSPENDED: "Suspended",
  REJECTED: "Not approved",
  DEACTIVATED: "Deactivated",
};

export const ORGANIZATION_STATUS_DESCRIPTIONS: Record<string, string> = {
  DRAFT: "Complete the checklist items below to prepare your application.",
  PENDING_VERIFICATION: "Confirm the administrator details to continue.",
  UNDER_REVIEW: "HealthAlyst is reviewing your application.",
  CHANGES_REQUESTED: "Review the requested updates below and make the changes.",
  ACTIVE: "Your organisation has been approved.",
  SUSPENDED: "Access is paused. Contact HealthAlyst for assistance.",
  REJECTED: "The review team could not approve this application.",
  DEACTIVATED: "This organisation is no longer active.",
};

export const CHECKLIST_ITEMS = [
  { key: "profileComplete", label: "Organisation profile" },
  { key: "emailVerified", label: "Administrator email verified" },
  { key: "phoneVerified", label: "Administrator phone verified" },
  { key: "mfaEnrolled", label: "Authenticator app set up" },
  { key: "documentsComplete", label: "Required documents provided" },
] as const;

export const DOCUMENT_LABELS: Record<string, string> = {
  CAC_CERTIFICATE: "CAC certificate",
  FACILITY_LICENCE: "Facility licence",
  MEDICAL_DIRECTOR_LICENCE: "Medical director licence",
  MLSCN_LICENCE: "Medical Laboratory Science Council licence",
  PCN_PREMISES_LICENCE: "PCN premises licence",
  NHIA_ACCREDITATION: "NHIA accreditation",
  PROOF_OF_ADDRESS: "Proof of address",
  OTHER: "Other supporting document",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  UPLOADING: "Uploading",
  SCANNING: "Security check in progress",
  CLEAN: "Received",
  INFECTED: "Could not be accepted",
  ACCEPTED: "Accepted",
  REJECTED: "Needs a replacement",
};
