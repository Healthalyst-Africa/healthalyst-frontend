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
}: {
  permissions: readonly string[];
  organizationAppLinks: OrganizationAppLinks | null;
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
  if (!organizationAppLinks) {
    return { sidebar, switcher: [{ label: "Apps", items: [currentApp] }] };
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
    ],
  };
}
