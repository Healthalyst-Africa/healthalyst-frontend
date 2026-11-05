import {
  HealthScheduleIcon,
  OrganizationIcon,
  PartnersIcon,
  ProductsIcon,
  RolesIcon,
  TeamIcon,
} from "@healthalyst/icons";
import type { DashboardNavigationSection } from "@healthalyst/ui/components/dashboard-shell";
import type { WorkspaceSwitcherSection } from "@healthalyst/ui/components/workspace-switcher";
import { ORGANIZATION_ROUTES } from "~/config/routes";
import {
  ORGANIZATION_PRODUCTS,
  type OrganizationProductCode,
} from "~/shared/organization/config/organization-products";

/** The Platform API permission that shows each organisation page. */
const ORGANIZATION_PAGE_PERMISSIONS = {
  team: "staff:read",
  roles: "role:read",
  partners: "partner:read",
} as const;

const PRODUCT_ICONS: Record<
  OrganizationProductCode,
  WorkspaceSwitcherSection["items"][number]["icon"]
> = {
  HEALTHSCHEDULE: HealthScheduleIcon,
  LABCONNECT: ProductsIcon,
  PHARMADESK: ProductsIcon,
};

export type OrganizationWorkspaceNavigation = {
  /** The hub's own pages, the only links in its sidebar. */
  sidebar: DashboardNavigationSection[];
  /** The header menu: the products this organisation can open. */
  switcher: WorkspaceSwitcherSection[];
};

/**
 * The organisation hub's sidebar holds its own pages. Moving to a product
 * lives in the header's switcher, the same menu HealthSchedule has, with the
 * current app ticked. Pages are hidden when the person's permissions would
 * only show a refusal; the Platform API still checks every request.
 */
export function buildOrganizationWorkspaceNavigation({
  permissions,
  enabledProductCodes,
  productAddresses,
  organizations = [],
  currentOrganizationId = null,
  switchOrganization,
}: {
  permissions: readonly string[];
  enabledProductCodes: readonly string[];
  productAddresses: Partial<Record<OrganizationProductCode, string>>;
  /** Every organisation the person belongs to. */
  organizations?: readonly WorkspaceOrganization[];
  currentOrganizationId?: string | null;
  switchOrganization?: (organization: WorkspaceOrganization) => void;
}): OrganizationWorkspaceNavigation {
  const openableProducts = ORGANIZATION_PRODUCTS.flatMap((product) => {
    const address = productAddresses[product.code];
    return address && enabledProductCodes.includes(product.code)
      ? [
          {
            label: product.name,
            href: address,
            icon: PRODUCT_ICONS[product.code],
            opensAnotherApp: true,
          },
        ]
      : [];
  });

  return {
    sidebar: [
      {
        label: "Organisation",
        items: [
          {
            label: "Products",
            href: ORGANIZATION_ROUTES.products,
            icon: ProductsIcon,
          },
          ...(permissions.includes(ORGANIZATION_PAGE_PERMISSIONS.team)
            ? [
                {
                  label: "Team",
                  href: ORGANIZATION_ROUTES.team,
                  icon: TeamIcon,
                },
              ]
            : []),
          ...(permissions.includes(ORGANIZATION_PAGE_PERMISSIONS.roles)
            ? [
                {
                  label: "Roles and permissions",
                  href: ORGANIZATION_ROUTES.teamRoles,
                  icon: RolesIcon,
                },
              ]
            : []),
          ...(permissions.includes(ORGANIZATION_PAGE_PERMISSIONS.partners)
            ? [
                {
                  label: "Partners",
                  href: ORGANIZATION_ROUTES.partners,
                  icon: PartnersIcon,
                },
              ]
            : []),
          {
            label: "Settings",
            href: ORGANIZATION_ROUTES.organizationSettings,
            icon: OrganizationIcon,
          },
        ],
      },
    ],
    switcher: [
      {
        label: "Apps",
        items: [
          ...openableProducts,
          {
            label: "Organisation",
            href: ORGANIZATION_ROUTES.products,
            icon: OrganizationIcon,
            isCurrent: true,
          },
        ],
      },
      ...buildOrganizationSwitchSection({
        organizations,
        currentOrganizationId,
        switchOrganization,
      }),
    ],
  };
}

export type WorkspaceOrganization = { id: string; name: string };

/**
 * "Your organisations", for people who belong to more than one, such as a
 * doctor who works at two hospitals. Choosing one switches the session to it.
 * HealthSchedule's switcher has the same section.
 */
export function buildOrganizationSwitchSection({
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
