import type { RegistrationStatus } from "~/features/organization-oversight/types/organization-types";

export type OrganizationLifecycleAction =
  "suspend" | "reinstate" | "deactivate";

/** Limits from the Platform API's `ReasonBody` and `NoteBody`. */
export const ORGANIZATION_LIFECYCLE_LIMITS = {
  reasonMinimumLength: 5,
  reasonMaximumLength: 2000,
  noteMaximumLength: 2000,
} as const;

/** Platform roles the API accepts for writing an internal note. */
export const INTERNAL_NOTE_ROLES = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "COMPLIANCE_REVIEWER",
] as const;

type LifecycleActionPresentation = {
  /** Statuses the action can start from. */
  fromStatuses: readonly RegistrationStatus[];
  /** Platform roles the API accepts for the action. */
  roles: readonly string[];
  buttonLabel: string;
  title: string;
  description: string;
  reasonLabel: string;
  reasonDescription: string;
  submitLabel: string;
  submittingLabel: string;
  tone: "default" | "destructive";
  /** Completes "For security, enter a code from your authenticator app to …". */
  stepUpDescription: string;
  confirmation: { title: string; description: string };
};

export const ORGANIZATION_LIFECYCLE_ACTIONS: Record<
  OrganizationLifecycleAction,
  LifecycleActionPresentation
> = {
  suspend: {
    fromStatuses: ["ACTIVE"],
    roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"],
    buttonLabel: "Suspend",
    title: "Suspend organisation",
    description:
      "Every member is signed out and cannot use HealthAlyst products until the organisation is reinstated.",
    reasonLabel: "Reason for suspending",
    reasonDescription: "Recorded in the organisation's history.",
    submitLabel: "Suspend organisation",
    submittingLabel: "Suspending organisation",
    tone: "destructive",
    stepUpDescription: "suspend this organisation",
    confirmation: {
      title: "Organisation suspended",
      description:
        "Every member was signed out. You can reinstate the organisation from this panel.",
    },
  },
  reinstate: {
    fromStatuses: ["SUSPENDED"],
    roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"],
    buttonLabel: "Reinstate",
    title: "Reinstate organisation",
    description:
      "Members can sign in and use the organisation's enabled products again.",
    reasonLabel: "Reason for reinstating",
    reasonDescription: "Recorded in the organisation's history.",
    submitLabel: "Reinstate organisation",
    submittingLabel: "Reinstating organisation",
    tone: "default",
    stepUpDescription: "reinstate this organisation",
    confirmation: {
      title: "Organisation reinstated",
      description: "Members can sign in and use their products again.",
    },
  },
  deactivate: {
    fromStatuses: ["ACTIVE", "SUSPENDED"],
    roles: ["SUPER_ADMIN"],
    buttonLabel: "Deactivate",
    title: "Deactivate organisation",
    description:
      "Deactivation is permanent. The organisation cannot be reinstated and its members lose access for good.",
    reasonLabel: "Reason for deactivating",
    reasonDescription: "Recorded in the organisation's history.",
    submitLabel: "Deactivate permanently",
    submittingLabel: "Deactivating organisation",
    tone: "destructive",
    stepUpDescription: "deactivate this organisation",
    confirmation: {
      title: "Organisation deactivated",
      description:
        "The organisation is closed permanently and its members no longer have access.",
    },
  },
};

export const ORGANIZATION_HISTORY_DATE_FORMATTER = new Intl.DateTimeFormat(
  "en-NG",
  { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }
);
