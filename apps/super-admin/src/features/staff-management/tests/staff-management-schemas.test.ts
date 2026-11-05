import { describe, expect, it } from "vitest";
import {
  addPlatformStaffFormSchema,
  removeSuperAdminFormSchema,
} from "~/features/staff-management/schemas/staff-management-schemas";
import {
  describePlatformRoles,
  readGrantableRoles,
} from "~/features/staff-management/utilities/describe-platform-staff";

describe("adding HealthAlyst staff", () => {
  it("needs a name, a valid email and at least one role", () => {
    const result = addPlatformStaffFormSchema.safeParse({
      firstName: " ",
      lastName: "Okafor",
      email: "not an email",
      roles: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
      "firstName",
      "email",
      "roles",
    ]);
  });

  it("never grants super admin", () => {
    expect(
      addPlatformStaffFormSchema.safeParse({
        firstName: "Ada",
        lastName: "Okafor",
        email: "ada@example.test",
        roles: ["SUPER_ADMIN"],
      }).success
    ).toBe(false);
  });

  it("keeps super admin aside when changing roles", () => {
    expect(readGrantableRoles(["SUPER_ADMIN", "SUPPORT_AGENT"])).toEqual([
      "SUPPORT_AGENT",
    ]);
    expect(describePlatformRoles(["SUPER_ADMIN", "READ_ONLY_AUDITOR"])).toBe(
      "Super admin, Read-only auditor"
    );
  });

  it("needs a real reason to remove a super admin", () => {
    expect(
      removeSuperAdminFormSchema.safeParse({
        reason: "left",
        deactivate: false,
      }).success
    ).toBe(false);
  });
});
