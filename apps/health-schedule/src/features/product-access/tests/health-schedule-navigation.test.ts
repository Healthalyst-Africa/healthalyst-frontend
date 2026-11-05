import { describe, expect, it } from "vitest";
import type { OrganizationAppLinks } from "~/features/organization-access/services/organization-app-links";
import { buildHealthScheduleNavigation } from "~/features/product-access/utilities/build-health-schedule-navigation";

const HUB_ADDRESS = "https://organisation.example.test";

const HUB_LINKS: OrganizationAppLinks = {
  registration: `${HUB_ADDRESS}/?product=healthschedule`,
  signIn: `${HUB_ADDRESS}/sign-in?product=healthschedule`,
  application: `${HUB_ADDRESS}/onboarding`,
  accountSecurity: `${HUB_ADDRESS}/account/security?product=healthschedule`,
  organizationSettings: `${HUB_ADDRESS}/settings`,
  team: `${HUB_ADDRESS}/team`,
  teamRoles: `${HUB_ADDRESS}/team/roles`,
  products: `${HUB_ADDRESS}/products`,
};

function describeSections(
  sections: readonly { label: string; items: readonly { label: string }[] }[]
) {
  return sections.map((section) => ({
    label: section.label,
    items: section.items.map((item) => item.label),
  }));
}

describe("HealthSchedule navigation", () => {
  it("keeps the sidebar for HealthSchedule's own pages", () => {
    const navigation = buildHealthScheduleNavigation({
      permissions: ["staff:read", "role:read"],
      organizationAppLinks: HUB_LINKS,
    });
    expect(describeSections(navigation.sidebar)).toEqual([
      { label: "HealthSchedule", items: ["Overview"] },
    ]);
  });

  it("puts the other app and the organisation's pages in the switcher", () => {
    const { switcher } = buildHealthScheduleNavigation({
      permissions: ["staff:read", "role:read"],
      organizationAppLinks: HUB_LINKS,
    });
    expect(describeSections(switcher)).toEqual([
      { label: "Apps", items: ["HealthSchedule", "Organisation"] },
      {
        label: "Manage your organisation",
        items: ["Team", "Roles and permissions", "Settings"],
      },
    ]);
    expect(switcher[0]?.items[0]?.isCurrent).toBe(true);
    // Every hub page loads as another app.
    expect(
      switcher
        .flatMap((section) => section.items)
        .filter((item) => !item.isCurrent)
        .every(
          (item) => item.opensAnotherApp && item.href.startsWith(HUB_ADDRESS)
        )
    ).toBe(true);
  });

  it("hides organisation pages a person's roles would only refuse", () => {
    const { switcher } = buildHealthScheduleNavigation({
      permissions: [],
      organizationAppLinks: HUB_LINKS,
    });
    expect(switcher[1]?.items.map((item) => item.label)).toEqual(["Settings"]);
  });

  it("offers nowhere else to go without a hub address", () => {
    expect(
      describeSections(
        buildHealthScheduleNavigation({
          permissions: ["staff:read"],
          organizationAppLinks: null,
        }).switcher
      )
    ).toEqual([{ label: "Apps", items: ["HealthSchedule"] }]);
  });

  it("lets people in several organisations switch between them", () => {
    const chosen: string[] = [];
    const { switcher } = buildHealthScheduleNavigation({
      permissions: [],
      organizationAppLinks: HUB_LINKS,
      organizations: [
        { id: "second", name: "Zenith Clinic" },
        { id: "first", name: "Abuja General" },
      ],
      currentOrganizationId: "second",
      switchOrganization: (organization) => chosen.push(organization.id),
    });
    const organizationSection = switcher.at(-1);
    expect(organizationSection?.label).toBe("Your organisations");
    expect(
      organizationSection?.items.map((item) => [item.label, item.isCurrent])
    ).toEqual([
      ["Abuja General", false],
      ["Zenith Clinic", true],
    ]);
    organizationSection?.items[0]?.onSelect?.();
    expect(chosen).toEqual(["first"]);
  });
});
