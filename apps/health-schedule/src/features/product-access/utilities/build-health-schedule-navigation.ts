import {
  DashboardIcon,
  HealthScheduleIcon,
  OrganizationIcon,
  RolesIcon,
  TeamIcon,
} from "@healthalyst/icons";
import type { DashboardNavigationSection } from "@healthalyst/ui/components/dashboard-shell";
import type { WorkspaceSwitcherSection } from "@healthalyst/ui/components/workspace-switcher";
import type { OrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";

/** The Platform API permission that shows each organisation page. */
const ORGANIZATION_PAGE_PERMISSIONS = {
  team: "staff:read",
  roles: "role:read",
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
  const sidebar: DashboardNavigationSection[] = [
    {
      label: "HealthSchedule",
      items: [{ label: "Overview", href: "/", icon: DashboardIcon }],
    },
  ];
  const currentApp = {
    label: "HealthSchedule",
    href: "/",
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
          },
        ],
      },
      {
        label: "Manage your organisation",
        items: [
          ...(permissions.includes(ORGANIZATION_PAGE_PERMISSIONS.team)
            ? [
                {
                  label: "Team",
                  href: organizationAppLinks.team,
                  icon: TeamIcon,
                  opensAnotherApp: true,
                },
              ]
            : []),
          ...(permissions.includes(ORGANIZATION_PAGE_PERMISSIONS.roles)
            ? [
                {
                  label: "Roles and permissions",
                  href: organizationAppLinks.teamRoles,
                  icon: RolesIcon,
                  opensAnotherApp: true,
                },
              ]
            : []),
          {
            label: "Settings",
            href: organizationAppLinks.organizationSettings,
            icon: OrganizationIcon,
            opensAnotherApp: true,
          },
        ],
      },
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
