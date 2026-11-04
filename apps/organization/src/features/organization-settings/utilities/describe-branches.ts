import type {
  PlatformBranch,
  PlatformDepartment,
} from "~/features/organization-management/types/organization-management";
import { BRANCH_CAPABILITY_OPTIONS } from "~/features/organization-settings/config/organization-settings";

/** The services a branch offers, in the order people see them. */
export function describeBranchServices(branch: PlatformBranch): string {
  const offered = BRANCH_CAPABILITY_OPTIONS.filter((option) =>
    branch.capabilities.some(
      (capability) =>
        capability.category === option.category && capability.isEnabled
    )
  ).map((option) => option.label);
  return offered.length > 0 ? offered.join(", ") : "None chosen";
}

/** How many departments are in use, with inactive ones counted apart. */
export function describeBranchDepartments(branch: PlatformBranch): string {
  const activeCount = branch.departments.filter(
    (department) => department.isActive
  ).length;
  const inactiveCount = branch.departments.length - activeCount;
  if (branch.departments.length === 0) return "None yet";
  if (activeCount === 0) return `${inactiveCount} inactive`;
  const activeLabel = `${activeCount} ${activeCount === 1 ? "department" : "departments"}`;
  return inactiveCount > 0
    ? `${activeLabel}, ${inactiveCount} inactive`
    : activeLabel;
}

function compareByActivityThenName<
  RecordType extends { isActive: boolean; name: string },
>(firstRecord: RecordType, secondRecord: RecordType): number {
  return (
    Number(secondRecord.isActive) - Number(firstRecord.isActive) ||
    firstRecord.name.localeCompare(secondRecord.name, "en-NG")
  );
}

/** Branches in use first, each group in name order. */
export function sortBranches(
  branches: readonly PlatformBranch[]
): PlatformBranch[] {
  return [...branches].sort(compareByActivityThenName);
}

/** Departments in use first, each group in name order. */
export function sortDepartments(
  departments: readonly PlatformDepartment[]
): PlatformDepartment[] {
  return [...departments].sort(compareByActivityThenName);
}
