/** The Platform API name for an approved organisation; products open only then. */
export const APPROVED_ORGANIZATION_STATUS = "ACTIVE";

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
  DRAFT: "Complete your organisation setup to prepare your application.",
  PENDING_VERIFICATION: "Confirm the administrator details to continue.",
  UNDER_REVIEW: "HealthAlyst is reviewing your application.",
  CHANGES_REQUESTED: "Review the requested updates below and make the changes.",
  ACTIVE: "Your organisation has been approved.",
  SUSPENDED: "Access is paused. Contact HealthAlyst for assistance.",
  REJECTED: "The review team could not approve this application.",
  DEACTIVATED: "This organisation is no longer active.",
};
