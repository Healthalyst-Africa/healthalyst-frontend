import type { StatusTone } from "@healthalyst/ui/types/status-tone";

export const PARTNER_ENDPOINTS = {
  partnerships: "/v1/partners",
  directory: "/v1/partners/directory",
  invitations: "/v1/partners/invitations",
  partnership: (partnershipId: string) =>
    `/v1/partners/${encodeURIComponent(partnershipId)}`,
  partnershipAction: (
    partnershipId: string,
    action: "accept" | "decline" | "suspend" | "terminate"
  ) => `/v1/partners/${encodeURIComponent(partnershipId)}/${action}`,
  invitationPreview: (invitationToken: string) =>
    `/v1/partner-invitations/${encodeURIComponent(invitationToken)}`,
  acceptInvitation: (invitationToken: string) =>
    `/v1/partner-invitations/${encodeURIComponent(invitationToken)}/accept`,
} as const;

/** Platform API permissions for the partners page. */
export const PARTNER_PERMISSIONS = {
  read: "partner:read",
  manage: "partner:manage",
} as const;

/**
 * The data-sharing agreement version a partner accepts. It must match the
 * Platform API's current version, or acceptance is refused.
 */
export const DATA_SHARING_AGREEMENT_VERSION = "2026-10";

/** The Platform API's status when a partner invitation link is used up or expired. */
export const PARTNER_INVITATION_GONE_STATUS = 410;

export const UNEXPECTED_PARTNER_RESPONSE =
  "We received an unexpected partner response from HealthAlyst. Contact HealthAlyst for help.";

/** Limits from the Platform API's partner request bodies. */
export const PARTNER_FIELD_LIMITS = {
  reasonMaximumLength: 500,
  partnerNameMinimumLength: 2,
  partnerNameMaximumLength: 200,
  emailMaximumLength: 254,
  priorityMinimum: 1,
  priorityMaximum: 1000,
  priorityDefault: 100,
  searchMinimumLength: 2,
  searchMaximumLength: 100,
} as const;

export const SERVICE_CATEGORIES = [
  "CONSULTATION",
  "LABORATORY",
  "PHARMACY",
  "RADIOLOGY",
  "EMERGENCY",
  "SURGERY",
  "OTHER",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  CONSULTATION: "Consultation",
  LABORATORY: "Laboratory",
  PHARMACY: "Pharmacy",
  RADIOLOGY: "Radiology",
  EMERGENCY: "Emergency",
  SURGERY: "Surgery",
  OTHER: "Other services",
};

export const SERVICE_CATEGORY_OPTIONS = SERVICE_CATEGORIES.map((category) => ({
  value: category,
  label: SERVICE_CATEGORY_LABELS[category],
}));

export const PARTNERSHIP_STATUSES = [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "TERMINATED",
  "DECLINED",
] as const;

export type PartnershipStatus = (typeof PARTNERSHIP_STATUSES)[number];

export const PARTNERSHIP_STATUS_PRESENTATION: Record<
  PartnershipStatus,
  { label: string; tone: StatusTone }
> = {
  PENDING: { label: "Waiting for a reply", tone: "information" },
  ACTIVE: { label: "Active", tone: "positive" },
  SUSPENDED: { label: "Paused", tone: "warning" },
  TERMINATED: { label: "Ended", tone: "neutral" },
  DECLINED: { label: "Declined", tone: "negative" },
};

export const ACCESS_LEVELS = [
  "L0_CONTACT",
  "L1_PORTAL_LITE",
  "L2_PRODUCT",
  "L3_API",
] as const;

export const ACCESS_LEVEL_LABELS: Record<
  (typeof ACCESS_LEVELS)[number],
  string
> = {
  L0_CONTACT: "Contact details only",
  L1_PORTAL_LITE: "Partner portal",
  L2_PRODUCT: "On HealthAlyst",
  L3_API: "System integration",
};

/** How an organisation not on HealthAlyst can work with you. */
export const INVITATION_ACCESS_OPTIONS = [
  {
    value: "L0_CONTACT",
    label: "Contact details only",
    description: "You keep their contact details for referrals.",
  },
  {
    value: "L1_PORTAL_LITE",
    label: "Partner portal",
    description: "Limited access through a HealthAlyst partner portal.",
  },
] as const;

export const PARTNER_INVITATION_STATUS_PRESENTATION: Record<
  "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED",
  { label: string; tone: StatusTone }
> = {
  PENDING: { label: "Waiting", tone: "information" },
  ACCEPTED: { label: "Joined", tone: "positive" },
  REVOKED: { label: "Withdrawn", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "warning" },
};

export const PARTNER_DATE_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

export const PARTNER_QUERY_KEYS = {
  partnerships: "platform-partnerships",
  directory: "platform-partner-directory",
  invitations: "platform-partner-invitations",
  invitationPreview: "platform-partner-invitation-preview",
} as const;
