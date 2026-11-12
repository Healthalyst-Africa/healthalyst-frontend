import { describe, expect, it } from "vitest";
import {
  addPlatformStaffFormSchema,
  removePlatformStaffFormSchema,
  removeSuperAdminFormSchema,
  removedPlatformStaffMemberSchema,
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

describe("removing someone from HealthAlyst staff", () => {
  it("needs a reason of at least 5 characters", () => {
    expect(
      removePlatformStaffFormSchema.safeParse({ reason: " left " }).success
    ).toBe(false);
    expect(
      removePlatformStaffFormSchema.parse({ reason: "  Left the company  " })
    ).toEqual({ reason: "Left the company" });
  });

  it("reads which claimed applications went back to the review queue", () => {
    const removed = removedPlatformStaffMemberSchema.parse({
      id: "6f1d7c1e-8a52-4a7e-9b0f-2a1f7f3c9d10",
      email: "reviewer@healthalyst.example",
      firstName: "Ada",
      lastName: "Okafor",
      status: "ACTIVE",
      roles: [],
      mfaEnrolled: true,
      lastLoginAt: null,
      createdAt: "2026-11-01T09:00:00.000Z",
      releasedApplications: ["0b6c2f4e-5d1a-4c3b-8e7f-9a0b1c2d3e4f"],
    });
    expect(removed.releasedApplications).toHaveLength(1);
  });
});
