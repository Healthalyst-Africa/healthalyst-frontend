import { beforeEach, describe, expect, it, vi } from "vitest";

const organizationAppAddress = vi.hoisted(() => ({
  current: undefined as string | undefined,
}));

vi.mock("~/config/organization-app", async (importOriginal) => ({
  ...(await importOriginal<typeof import("~/config/organization-app")>()),
  getOrganizationAppAddress: () => organizationAppAddress.current,
}));

const { getOrganizationAppLinks } =
  await import("~/features/organization-access/services/organization-app-links");

describe("getOrganizationAppLinks", () => {
  beforeEach(() => {
    organizationAppAddress.current = "https://organisation.example.test";
  });

  it("links to account security in the organisation hub, naming HealthSchedule", () => {
    expect(getOrganizationAppLinks()?.accountSecurity).toBe(
      "https://organisation.example.test/account/security?product=healthschedule"
    );
  });

  it("has no links when the hub address is not configured", () => {
    organizationAppAddress.current = undefined;
    expect(getOrganizationAppLinks()).toBeNull();
  });
});
