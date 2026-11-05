import { describe, expect, it } from "vitest";
import { buildOrganizationWorkspaceNavigation } from "~/features/organization-workspace/utilities/build-workspace-navigation";

const HEALTH_SCHEDULE_ADDRESS = "https://healthschedule.example.test";

function labels(sections: readonly { items: readonly { label: string }[] }[]) {
  return sections.map((section) => section.items.map((item) => item.label));
}

describe("organisation hub navigation", () => {
  it("keeps the hub's own pages in the sidebar", () => {
    const { sidebar } = buildOrganizationWorkspaceNavigation({
      permissions: ["staff:read", "role:read"],
      enabledProductCodes: ["HEALTHSCHEDULE"],
      productAddresses: { HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS },
    });
    expect(labels(sidebar)).toEqual([
      ["Products", "Team", "Roles and permissions", "Settings"],
    ]);
  });

  it("lists the products it can open in the switcher, with the hub ticked", () => {
    const { switcher } = buildOrganizationWorkspaceNavigation({
      permissions: [],
      enabledProductCodes: ["HEALTHSCHEDULE"],
      productAddresses: { HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS },
    });
    expect(labels(switcher)).toEqual([["HealthSchedule", "Organisation"]]);
    expect(switcher[0]?.items[0]).toMatchObject({
      href: HEALTH_SCHEDULE_ADDRESS,
      opensAnotherApp: true,
    });
    expect(switcher[0]?.items[1]?.isCurrent).toBe(true);
  });

  it("leaves out products and pages the organisation or person lacks", () => {
    const navigation = buildOrganizationWorkspaceNavigation({
      permissions: [],
      enabledProductCodes: [],
      productAddresses: { HEALTHSCHEDULE: HEALTH_SCHEDULE_ADDRESS },
    });
    expect(labels(navigation.sidebar)).toEqual([["Products", "Settings"]]);
    expect(labels(navigation.switcher)).toEqual([["Organisation"]]);
  });

  it("lets people in several organisations switch between them", () => {
    const chosen: string[] = [];
    const { switcher } = buildOrganizationWorkspaceNavigation({
      permissions: [],
      enabledProductCodes: [],
      productAddresses: {},
      organizations: [
        { id: "second", name: "Zenith Clinic" },
        { id: "first", name: "Abuja General" },
      ],
      currentOrganizationId: "first",
      switchOrganization: (organization) => chosen.push(organization.id),
    });
    const organizationSection = switcher[1];
    expect(organizationSection?.label).toBe("Your organisations");
    expect(organizationSection?.items.map((item) => item.label)).toEqual([
      "Abuja General",
      "Zenith Clinic",
    ]);
    expect(organizationSection?.items[0]?.isCurrent).toBe(true);
    organizationSection?.items[1]?.onSelect?.();
    expect(chosen).toEqual(["second"]);
  });

  it("offers no organisation choice to people in only one", () => {
    const { switcher } = buildOrganizationWorkspaceNavigation({
      permissions: [],
      enabledProductCodes: [],
      productAddresses: {},
      organizations: [{ id: "only", name: "Abuja General" }],
      currentOrganizationId: "only",
      switchOrganization: () => undefined,
    });
    expect(switcher.map((section) => section.label)).toEqual(["Apps"]);
  });
});
