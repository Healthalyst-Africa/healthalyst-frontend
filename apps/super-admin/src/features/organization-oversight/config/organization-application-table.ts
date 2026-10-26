import type { FilterBarOption } from "@healthalyst/ui/types/filter-bar";
import type {
  DataTableCell,
  DataTableColumn,
} from "@healthalyst/ui/types/data-table";
import type {
  OrganizationApplication,
  RegistrationStatus,
} from "~/features/organization-oversight/types/organization-types";

export const APPLICATION_STATUS_PRESENTATION = {
  DRAFT: { label: "Draft", tone: "highlight" },
  PENDING_VERIFICATION: { label: "Pending review", tone: "information" },
  UNDER_REVIEW: { label: "Under review", tone: "information" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "warning" },
  ACTIVE: { label: "Active", tone: "positive" },
  SUSPENDED: { label: "Suspended", tone: "negative" },
  REJECTED: { label: "Rejected", tone: "negative" },
  DEACTIVATED: { label: "Deactivated", tone: "neutral" },
} as const satisfies Record<
  RegistrationStatus,
  Omit<Extract<DataTableCell, { kind: "status" }>, "kind">
>;

export const ORGANIZATION_TYPE_LABELS = {
  CLINIC: "Clinic",
  HOSPITAL: "Hospital",
  SPECIALIST_CLINIC: "Specialist clinic",
  DIAGNOSTIC_CENTRE: "Diagnostic centre",
  LABORATORY: "Laboratory",
  IMAGING_CENTRE: "Imaging centre",
  PHARMACY: "Pharmacy",
  MULTI_BRANCH_GROUP: "Multi-branch group",
} as const satisfies Record<
  NonNullable<OrganizationApplication["type"]>,
  string
>;

export const APPLICATION_STATUS_FILTER_OPTIONS = Object.entries(
  APPLICATION_STATUS_PRESENTATION
).map(([status, presentation]): FilterBarOption => ({
  value: status,
  label: presentation.label,
}));

export const ORGANIZATION_TYPE_FILTER_OPTIONS = Object.entries(
  ORGANIZATION_TYPE_LABELS
).map(([organizationType, label]): FilterBarOption => ({
  value: organizationType,
  label,
}));

export const APPLICATION_DATE_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeZone: "Africa/Lagos",
});

export const ORGANIZATION_APPLICATION_TABLE_COLUMNS = [
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
    key: "state",
    label: "State",
    size: "compact",
    getCell: (application) => ({
      kind: "text",
      primary: application.stateCode || "Not provided",
    }),
  },
  {
    key: "registeredAt",
    label: "Registered",
    getCell: (application) => ({
      kind: "date",
      dateTime: application.createdAt,
      label: APPLICATION_DATE_FORMATTER.format(new Date(application.createdAt)),
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
] as const satisfies readonly DataTableColumn<OrganizationApplication>[];

export const ORGANIZATION_DIRECTORY_TABLE_COLUMNS =
  ORGANIZATION_APPLICATION_TABLE_COLUMNS.map(
    (column): DataTableColumn<OrganizationApplication> =>
      column.key === "registeredAt"
        ? {
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
          }
        : column
  );
