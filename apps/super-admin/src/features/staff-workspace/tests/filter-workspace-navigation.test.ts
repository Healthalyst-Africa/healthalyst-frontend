import { describe, expect, it } from "vitest";
import { filterWorkspaceNavigation } from "~/features/staff-workspace/utilities/filter-workspace-navigation";

function labels(platformRoles: readonly string[]) {
  return filterWorkspaceNavigation(platformRoles).map((item) => item.label);
}

describe("staff app navigation", () => {
  it("gives super admins every page", () => {
    expect(labels(["SUPER_ADMIN"])).toEqual([
      "Overview",
      "Organisations",
      "Application reviews",
      "HealthAlyst staff",
      "Audit log",
    ]);
  });

  it("gives auditors the audit log but not staff management", () => {
    expect(labels(["READ_ONLY_AUDITOR"])).toContain("Audit log");
    expect(labels(["READ_ONLY_AUDITOR"])).not.toContain("HealthAlyst staff");
  });

  it("hides both from reviewers", () => {
    expect(labels(["COMPLIANCE_REVIEWER"])).toEqual([
      "Overview",
      "Organisations",
      "Application reviews",
    ]);
  });
});
