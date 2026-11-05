import type { StatusTone } from "@healthalyst/ui/types/status-tone";

/** Platform roles the API accepts for reading and checking the audit log. */
export const AUDIT_LOG_ROLES = ["SUPER_ADMIN", "READ_ONLY_AUDITOR"] as const;

export const AUDIT_LOG_ENDPOINTS = {
  events: "/v1/admin/audit",
  chains: "/v1/admin/audit/chains",
} as const;

/** The API's value for events outside any organisation, such as sign-ins. */
export const PLATFORM_EVENTS_FILTER = "platform";

/** Limits from the Platform API's audit search parameters. */
export const AUDIT_LOG_LIMITS = {
  pageSize: 50,
  actionMaximumLength: 100,
  maximumRangeDays: 366,
  defaultRangeDays: 30,
} as const;

/** Lowercase words joined by dots; a trailing dot matches every action that starts with it. */
export const AUDIT_ACTION_PATTERN = /^[a-z0-9_]+(\.[a-z0-9_]+)*\.?$/;

/** Dates are chosen as Lagos calendar days. */
export const AUDIT_TIME_ZONE_OFFSET = "+01:00";

export const AUDIT_ACTOR_TYPE_LABELS = {
  USER: "Organisation member",
  PLATFORM_STAFF: "HealthAlyst staff",
  SERVICE: "Service",
  SYSTEM: "System",
} as const;

export const AUDIT_OUTCOME_PRESENTATION: Record<
  "SUCCESS" | "FAILURE",
  { label: string; tone: StatusTone }
> = {
  SUCCESS: { label: "Succeeded", tone: "positive" },
  FAILURE: { label: "Failed", tone: "negative" },
};

export const AUDIT_CHAIN_PROBLEM_LABELS = {
  EDITED: "An event's content was changed",
  BROKEN_LINK: "An earlier event is missing",
  FORK: "Two events claim the same predecessor",
  EXTRA_START: "The chain starts more than once",
  HEAD: "The newest events were deleted",
} as const;

export const AUDIT_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "Africa/Lagos",
});

export const auditLogQueryKeys = {
  events: (staffAccountId: string, filters: unknown) =>
    ["platform-staff", staffAccountId, "audit-events", filters] as const,
  chains: (staffAccountId: string, organizationId: string) =>
    ["platform-staff", staffAccountId, "audit-chains", organizationId] as const,
};
