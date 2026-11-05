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
});
