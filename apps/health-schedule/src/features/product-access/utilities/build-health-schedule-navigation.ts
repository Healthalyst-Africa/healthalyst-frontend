import {
  AccessReviewIcon,
  AppointmentsIcon,
  AppointmentTypesIcon,
  ConsultationIcon,
  DashboardIcon,
  FrontDeskIcon,
  HealthScheduleIcon,
  NoteTemplatesIcon,
  OrganizationIcon,
  PatientRecordsIcon,
  QueueIcon,
  ReviewResultsIcon,
  ScheduleCalendarsIcon,
  TeamIcon,
  TestsAndScansIcon,
  TimeOffIcon,
  VitalsIcon,
} from "@healthalyst/icons";
import type { DashboardNavigationSection } from "@healthalyst/ui/components/dashboard-shell";
import type { WorkspaceSwitcherSection } from "@healthalyst/ui/components/workspace-switcher";
import { HEALTH_SCHEDULE_ROUTES } from "~/config/routes";
import type { OrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";

/** The HealthSchedule permission that shows the schedule setup pages. */
const SCHEDULE_READ_PERMISSION = "schedule:read";

/** The HealthSchedule permissions that show the front desk and queue boards. */
const PATIENT_FLOW_PAGE_PERMISSIONS = {
  frontDesk: "queue:check-in",
  appointments: "appointment:read",
  triage: "triage:record",
  queues: "queue:read",
} as const;

/** Doctors see patients in the consultation workspace. */
const CONSULTATION_PERMISSIONS = ["note:write", "queue:read"] as const;

/** Doctors review the results of the tests and scans they order. */
const RESULTS_PERMISSION = "order:create";

/** The test catalogue is listed for people who can see patients. */
const TESTS_AND_SCANS_PERMISSION = "patient:read";

/** The HealthSchedule permission that shows patient records. */
const PATIENT_RECORDS_PERMISSION = "patient:read";

/** Managers review emergency access to restricted records. */
const ACCESS_REVIEW_PERMISSION = "audit:read";

/** Note templates are shown to people who read clinical notes. */
const NOTE_TEMPLATES_PERMISSION = "note:read";

/** The Platform API permission that shows each organisation page. */
const ORGANIZATION_PAGE_PERMISSIONS = {
  team: "staff:read",
} as const;

export type HealthScheduleNavigation = {
  /** HealthSchedule's own pages, the only links in its sidebar. */
  sidebar: DashboardNavigationSection[];
  /** The header menu: other apps, then the organisation's pages in the hub. */
  switcher: WorkspaceSwitcherSection[];
};

/**
 * HealthSchedule keeps its sidebar for its own work. Moving to the
 * organisation hub, and managing the team or settings there, lives in the
 * header's switcher, mirroring the hub's own switcher. Without a configured
 * hub address the switcher offers nothing to move to.
 */
export function buildHealthScheduleNavigation({
  permissions,
  organizationAppLinks,
  organizations = [],
  currentOrganizationId = null,
  switchOrganization,
}: {
  permissions: readonly string[];
  organizationAppLinks: OrganizationAppLinks | null;
  /** Every organisation the person belongs to. */
  organizations?: readonly WorkspaceOrganization[];
  currentOrganizationId?: string | null;
  switchOrganization?: (organization: WorkspaceOrganization) => void;
}): HealthScheduleNavigation {
  const patientFlowItems = [
    ...(permissions.includes(PATIENT_FLOW_PAGE_PERMISSIONS.frontDesk)
      ? [
          {
            label: "Front desk",
            href: HEALTH_SCHEDULE_ROUTES.frontDesk,
            icon: FrontDeskIcon,
          },
        ]
      : []),
    ...(permissions.includes(PATIENT_FLOW_PAGE_PERMISSIONS.appointments)
      ? [
          {
            label: "Appointments",
            href: HEALTH_SCHEDULE_ROUTES.appointments,
            icon: AppointmentsIcon,
          },
        ]
      : []),
    ...(permissions.includes(PATIENT_FLOW_PAGE_PERMISSIONS.triage)
      ? [
          {
            label: "Vital signs",
            href: HEALTH_SCHEDULE_ROUTES.triage,
            icon: VitalsIcon,
          },
        ]
      : []),
    ...(permissions.includes(PATIENT_FLOW_PAGE_PERMISSIONS.queues)
      ? [
          {
            label: "Queues",
            href: HEALTH_SCHEDULE_ROUTES.queues,
            icon: QueueIcon,
          },
        ]
      : []),
    ...(CONSULTATION_PERMISSIONS.every((permission) =>
      permissions.includes(permission)
    )
      ? [
          {
            label: "Consultation",
            href: HEALTH_SCHEDULE_ROUTES.consultation,
            icon: ConsultationIcon,
          },
        ]
      : []),
    ...(permissions.includes(RESULTS_PERMISSION)
      ? [
          {
            label: "Results to review",
            href: HEALTH_SCHEDULE_ROUTES.results,
            icon: ReviewResultsIcon,
          },
        ]
      : []),
  ];
  const recordItems = [
    ...(permissions.includes(PATIENT_RECORDS_PERMISSION)
      ? [
          {
            label: "Patients",
            href: HEALTH_SCHEDULE_ROUTES.patients,
            icon: PatientRecordsIcon,
          },
        ]
      : []),
    ...(permissions.includes(ACCESS_REVIEW_PERMISSION)
      ? [
          {
            label: "Access reviews",
            href: HEALTH_SCHEDULE_ROUTES.accessReviews,
            icon: AccessReviewIcon,
          },
        ]
      : []),
  ];
  const sidebar: DashboardNavigationSection[] = [
    {
      label: "HealthSchedule",
      items: [
        {
          label: "Overview",
          href: HEALTH_SCHEDULE_ROUTES.overview,
          icon: DashboardIcon,
        },
      ],
    },
    ...(patientFlowItems.length > 0
      ? [{ label: "Patient visits", items: patientFlowItems }]
      : []),
    ...(recordItems.length > 0
      ? [{ label: "Patients", items: recordItems }]
      : []),
    ...(permissions.includes(SCHEDULE_READ_PERMISSION)
      ? [
          {
            label: "Setup",
            items: [
              {
                label: "Calendars",
                href: HEALTH_SCHEDULE_ROUTES.scheduleCalendars,
                icon: ScheduleCalendarsIcon,
              },
              {
                label: "Time off and holidays",
                href: HEALTH_SCHEDULE_ROUTES.scheduleTimeOff,
                icon: TimeOffIcon,
              },
              {
                label: "Appointment types",
                href: HEALTH_SCHEDULE_ROUTES.scheduleAppointmentTypes,
                icon: AppointmentTypesIcon,
              },
              ...(permissions.includes(NOTE_TEMPLATES_PERMISSION)
                ? [
                    {
                      label: "Note templates",
                      href: HEALTH_SCHEDULE_ROUTES.scheduleNoteTemplates,
                      icon: NoteTemplatesIcon,
                    },
                  ]
                : []),
              ...(permissions.includes(TESTS_AND_SCANS_PERMISSION)
                ? [
                    {
                      label: "Tests and scans",
                      href: HEALTH_SCHEDULE_ROUTES.scheduleTestsAndScans,
                      icon: TestsAndScansIcon,
                    },
                  ]
                : []),
            ],
          },
        ]
      : []),
  ];
  const currentApp = {
    label: "HealthSchedule",
    href: HEALTH_SCHEDULE_ROUTES.overview,
    icon: HealthScheduleIcon,
    isCurrent: true,
  };
  const organizationSection = buildOrganizationSwitchSection({
    organizations,
    currentOrganizationId,
    switchOrganization,
  });
  if (!organizationAppLinks) {
    return {
      sidebar,
      switcher: [
        { label: "Apps", items: [currentApp] },
        ...organizationSection,
      ],
    };
  }

  return {
    sidebar,
    switcher: [
      {
        label: "Apps",
        items: [
          currentApp,
          {
            label: "Organisation",
            href: organizationAppLinks.products,
            icon: OrganizationIcon,
            opensAnotherApp: true,
            opensInNewWindow: true,
          },
        ],
      },
      // Organisation settings, with roles and permissions inside them, open
      // from the account menu; only the team is offered here.
      ...(permissions.includes(ORGANIZATION_PAGE_PERMISSIONS.team)
        ? [
            {
              label: "Manage your organisation",
              items: [
                {
                  label: "Team",
                  href: organizationAppLinks.team,
                  icon: TeamIcon,
                  opensAnotherApp: true,
                  opensInNewWindow: true,
                },
              ],
            },
          ]
        : []),
      ...organizationSection,
    ],
  };
}

export type WorkspaceOrganization = { id: string; name: string };

/**
 * "Your organisations", for people who belong to more than one, such as a
 * doctor who works at two hospitals. It matches the organisation hub's
 * section of the same name.
 */
function buildOrganizationSwitchSection({
  organizations,
  currentOrganizationId,
  switchOrganization,
}: {
  organizations: readonly WorkspaceOrganization[];
  currentOrganizationId: string | null;
  switchOrganization?: (organization: WorkspaceOrganization) => void;
}): WorkspaceSwitcherSection[] {
  if (organizations.length < 2 || !switchOrganization) return [];
  return [
    {
      label: "Your organisations",
      items: [...organizations]
        .sort((first, second) => first.name.localeCompare(second.name))
        .map((organization) => ({
          label: organization.name,
          icon: OrganizationIcon,
          isCurrent: organization.id === currentOrganizationId,
          onSelect: () => switchOrganization(organization),
        })),
    },
  ];
}
