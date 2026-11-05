"use client";

import { useState } from "react";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { MultiSelectField } from "@healthalyst/ui/components/multi-select-field";
import type { PlatformBranch } from "~/features/organization-management/types/organization-management";
import type { TeamRole } from "~/features/team-management/types/team-management";

export type TeamAccessDefaults = {
  roleIds: readonly string[];
  allBranches: boolean;
  branchIds: readonly string[];
  departmentIds: readonly string[];
};

const EMPTY_ACCESS: TeamAccessDefaults = {
  roleIds: [],
  allBranches: true,
  branchIds: [],
  departmentIds: [],
};

/**
 * Roles, branches and departments for a person. Departments follow the chosen
 * branches, so people only see teams at the places this person works.
 * `branches` is null when the signed-in person cannot see branches.
 */
export function TeamAccessFields({
  identifierPrefix,
  roles,
  branches,
  defaults = EMPTY_ACCESS,
  errors,
}: {
  identifierPrefix: string;
  roles: readonly TeamRole[];
  branches: readonly PlatformBranch[] | null;
  defaults?: TeamAccessDefaults;
  errors: Record<string, string>;
}) {
  const [allBranches, setAllBranches] = useState(defaults.allBranches);
  const [chosenBranchIds, setChosenBranchIds] = useState<readonly string[]>(
    defaults.branchIds
  );
  const activeBranches = (branches ?? []).filter((branch) => branch.isActive);
  const departmentBranches = allBranches
    ? activeBranches
    : activeBranches.filter((branch) => chosenBranchIds.includes(branch.id));
  const departmentOptions = departmentBranches.flatMap((branch) =>
    branch.departments
      .filter((department) => department.isActive)
      .map((department) => ({
        value: department.id,
        label: department.name,
        description: branch.name,
        selectedLabel:
          activeBranches.length > 1
            ? `${department.name} (${branch.name})`
            : department.name,
      }))
  );
  const availableDepartmentIds = new Set(
    departmentOptions.map((option) => option.value)
  );

  return (
    <>
      <MultiSelectField
        id={`${identifierPrefix}-roleIds`}
        label="Roles"
        name="roleIds"
        placeholder="Choose roles"
        searchPlaceholder="Search roles"
        options={roles.map((role) => ({
          value: role.id,
          label: role.name,
          description: role.isPreset ? "Preset role" : "Custom role",
        }))}
        defaultValues={defaults.roleIds}
        description="What this person can see and do. They can hold several roles."
        error={errors.roleIds}
      />

      <CheckboxField
        id={`${identifierPrefix}-allBranches`}
        name="allBranches"
        label="Works at every branch"
        description="Includes branches you add later."
        checked={allBranches}
        onCheckedChange={setAllBranches}
      />

      {!allBranches &&
        (branches === null ? (
          <p className="text-sm text-muted-foreground">
            You cannot see this organisation&apos;s branches, so this person can
            only be given every branch. Ask an administrator with branch access
            to narrow it.
          </p>
        ) : (
          <MultiSelectField
            id={`${identifierPrefix}-branchIds`}
            label="Branches"
            name="branchIds"
            placeholder="Choose branches"
            searchPlaceholder="Search branches"
            options={activeBranches.map((branch) => ({
              value: branch.id,
              label: branch.name,
            }))}
            defaultValues={defaults.branchIds}
            error={errors.branchIds}
            onValueChange={setChosenBranchIds}
          />
        ))}

      {departmentOptions.length > 0 && (
        <MultiSelectField
          // Remount when the branches change so hidden departments drop out.
          key={departmentBranches.map((branch) => branch.id).join(",")}
          id={`${identifierPrefix}-departmentIds`}
          label="Departments (optional)"
          name="departmentIds"
          placeholder="Choose departments"
          searchPlaceholder="Search departments"
          options={departmentOptions}
          defaultValues={defaults.departmentIds.filter((departmentId) =>
            availableDepartmentIds.has(departmentId)
          )}
          description="The teams this person works in, such as Outpatients."
          error={errors.departmentIds}
        />
      )}
    </>
  );
}
