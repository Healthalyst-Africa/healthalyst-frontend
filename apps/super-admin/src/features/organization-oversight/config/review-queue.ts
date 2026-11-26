import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import type { FilterBarOption } from "@healthalyst/ui/types/filter-bar";
import type { StatusPresentation } from "@healthalyst/ui/types/status-tone";
import {
  APPLICATION_DATE_FORMATTER,
  APPLICATION_STATUS_PRESENTATION,
  ORGANIZATION_TYPE_LABELS,
} from "~/features/organization-oversight/config/organization-application-table";
import type {
  OrganizationApplication,
  OrganizationDocument,
} from "~/features/organization-oversight/types/organization-types";
import {
  CancelledIcon,
  CompletedIcon,
  FileCheckedIcon,
  FileRefusedIcon,
  PauseIcon,
  PendingIcon,
  SwitchOnIcon,
  UnderReviewIcon,
  UploadDocumentIcon,
  VirusFoundIcon,
} from "@healthalyst/icons";

/** The address query parameter that holds the application open for review. */
export const REVIEW_APPLICATION_QUERY_PARAMETER = "application";

export const REVIEW_ASSIGNMENT_OPTIONS = [
  { value: "UNASSIGNED", label: "Waiting for a reviewer" },
  { value: "MINE", label: "Assigned to me" },
  { value: "OTHERS", label: "Assigned to others" },
] as const satisfies readonly FilterBarOption[];

export type ReviewAssignment =
  (typeof REVIEW_ASSIGNMENT_OPTIONS)[number]["value"];

export function getReviewAssignment(
  application: OrganizationApplication,
  staffAccountId: string
): ReviewAssignment {
  if (!application.reviewerId) return "UNASSIGNED";
  return application.reviewerId === staffAccountId ? "MINE" : "OTHERS";
}

const REVIEWER_LABELS: Record<ReviewAssignment, string> = {
  UNASSIGNED: "Unassigned",
  MINE: "You",
  OTHERS: "Another reviewer",
};

export function createReviewQueueColumns(
  staffAccountId: string
): DataTableColumn<OrganizationApplication>[] {
  return [
    {
      key: "organization",
      label: "Organisation",
      size: "wide",
      getCell: (application) => ({
        kind: "text",
        primary: application.displayName || application.legalName,
        secondary:
          application.displayName &&
          application.displayName !== application.legalName
            ? application.legalName
            : undefined,
      }),
    },
    {
      key: "facilityType",
      label: "Facility type",
      getCell: (application) => ({
        kind: "text",
        primary: application.type
          ? ORGANIZATION_TYPE_LABELS[application.type]
          : "Not provided",
      }),
    },
    {
      key: "submittedAt",
      label: "Submitted",
      getCell: (application) =>
        application.submittedAt
          ? {
              kind: "date",
              dateTime: application.submittedAt,
              label: APPLICATION_DATE_FORMATTER.format(
                new Date(application.submittedAt)
              ),
            }
          : { kind: "text", primary: "Not submitted" },
    },
    {
      key: "reviewer",
      label: "Reviewer",
      size: "compact",
      getCell: (application) => ({
        kind: "text",
        primary:
          REVIEWER_LABELS[getReviewAssignment(application, staffAccountId)],
      }),
    },
    {
      key: "status",
      label: "Status",
      getCell: (application) => ({
        kind: "status",
        ...APPLICATION_STATUS_PRESENTATION[application.status],
      }),
    },
  ];
}

export const REVIEW_DOCUMENT_TYPE_LABELS: Record<
  OrganizationDocument["type"],
  string
> = {
  CAC_CERTIFICATE: "CAC certificate",
  FACILITY_LICENCE: "Facility licence",
  MEDICAL_DIRECTOR_LICENCE: "Medical director licence",
  MLSCN_LICENCE: "Medical laboratory licence",
  PCN_PREMISES_LICENCE: "Pharmacy premises licence",
  NHIA_ACCREDITATION: "NHIA accreditation",
  PROOF_OF_ADDRESS: "Proof of address",
  OTHER: "Other supporting document",
};

export const REVIEW_DOCUMENT_STATUS_PRESENTATION: Record<
  OrganizationDocument["status"],
  StatusPresentation
> = {
  UPLOADING: {
    label: "Upload not finished",
    tone: "warning",
    icon: UploadDocumentIcon,
  },
  SCANNING: {
    label: "Checking file",
    tone: "information",
    icon: UnderReviewIcon,
  },
  CLEAN: {
    label: "Passed security check",
    tone: "positive",
    icon: FileCheckedIcon,
  },
  ACCEPTED: { label: "Accepted", tone: "positive", icon: CompletedIcon },
  INFECTED: {
    label: "Failed security check",
    tone: "negative",
    icon: VirusFoundIcon,
  },
  REJECTED: { label: "Rejected", tone: "negative", icon: FileRefusedIcon },
};

export const REVIEW_CONTENT_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
};

export const REVIEW_PRODUCT_STATUS_PRESENTATION: Record<
  string,
  StatusPresentation
> = {
  PENDING: { label: "Requested", tone: "information", icon: PendingIcon },
  ACTIVE: { label: "Active", tone: "positive", icon: SwitchOnIcon },
  SUSPENDED: { label: "Suspended", tone: "negative", icon: PauseIcon },
  CANCELLED: { label: "Cancelled", tone: "neutral", icon: CancelledIcon },
};
