import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  organizationProfileSchema,
  branchSchema,
  branchListSchema,
  departmentSchema,
  departmentPatchSchema,
  branchPatchSchema,
  organizationPatchSchema,
  branchCapabilitiesSchema,
} from "~/features/organization-management/schemas/organization-management-schema";
import type {
  PlatformOrganizationProfile,
  PlatformBranch,
  PlatformDepartment,
  OrganizationProfileChanges,
  OrganizationBranchChanges,
  OrganizationDepartmentChanges,
  OrganizationBranchCreation,
  OrganizationDepartmentCreation,
  PlatformBranchCapability,
} from "~/features/organization-management/types/organization-management";

import {
  ORGANIZATION_MANAGEMENT_ENDPOINTS,
  UNEXPECTED_ORGANIZATION_RESPONSE,
} from "~/features/organization-management/config/organization-management";

function entityTagForVersion(
  responseEntityTag: string | undefined,
  version: number
) {
  return responseEntityTag ?? String(version);
}

/** Load an ACTIVE organisation profile. Requires `org:read`. */
export async function getPlatformOrganization(): Promise<PlatformOrganizationProfile> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      ORGANIZATION_MANAGEMENT_ENDPOINTS.organization
    );
    const profile = organizationProfileSchema.safeParse(response.data);
    if (!profile.success) throw new Error(UNEXPECTED_ORGANIZATION_RESPONSE);
    return {
      ...profile.data,
      entityTag: entityTagForVersion(
        response.headers.etag,
        profile.data.version
      ),
    };
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load your organisation profile."
    );
  }
}

/** Update an ACTIVE organisation profile with its current `If-Match` version. */
export async function updatePlatformOrganization(
  entityTag: string,
  changes: OrganizationProfileChanges
): Promise<PlatformOrganizationProfile> {
  const validatedChanges = organizationPatchSchema.safeParse(changes);
  if (!validatedChanges.success) {
    throw new Error(
      validatedChanges.error.issues[0]?.message ??
        "Check the organisation details and try again."
    );
  }

  try {
    const response = await getPlatformHttpClient().patch<unknown>(
      ORGANIZATION_MANAGEMENT_ENDPOINTS.organization,
      validatedChanges.data,
      { headers: { "If-Match": entityTag } }
    );
    const profile = organizationProfileSchema.safeParse(response.data);
    if (!profile.success) throw new Error(UNEXPECTED_ORGANIZATION_RESPONSE);
    return {
      ...profile.data,
      entityTag: entityTagForVersion(
        response.headers.etag,
        profile.data.version
      ),
    };
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save your organisation profile. Try again."
    );
  }
}

/** Load branches, departments, and directory capabilities. Requires `branch:read`. */
export async function getPlatformBranches(): Promise<PlatformBranch[]> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      ORGANIZATION_MANAGEMENT_ENDPOINTS.branches
    );
    const branches = branchListSchema.safeParse(response.data);
    if (!branches.success) throw new Error(UNEXPECTED_ORGANIZATION_RESPONSE);
    return branches.data.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load your organisation branches."
    );
  }
}

/** Create a branch. The API may generate a unique slug if omitted. */
export async function createPlatformBranch(
  branch: OrganizationBranchCreation
): Promise<PlatformBranch> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      ORGANIZATION_MANAGEMENT_ENDPOINTS.branches,
      branch
    );
    const createdBranch = branchSchema.safeParse(response.data);
    if (!createdBranch.success)
      throw new Error(UNEXPECTED_ORGANIZATION_RESPONSE);
    return createdBranch.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not add this branch.");
  }
}

/** Rename or deactivate a branch. Requires `branch:manage`. */
export async function updatePlatformBranch(
  branchId: string,
  changes: OrganizationBranchChanges
): Promise<PlatformBranch> {
  const validatedChanges = branchPatchSchema.safeParse(changes);
  if (!validatedChanges.success) {
    throw new Error(
      validatedChanges.error.issues[0]?.message ??
        "Check the branch details and try again."
    );
  }

  try {
    const response = await getPlatformHttpClient().patch<unknown>(
      `${ORGANIZATION_MANAGEMENT_ENDPOINTS.branches}/${encodeURIComponent(branchId)}`,
      validatedChanges.data
    );
    const branch = branchSchema.safeParse(response.data);
    if (!branch.success) throw new Error(UNEXPECTED_ORGANIZATION_RESPONSE);
    return branch.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not update this branch.");
  }
}

/** Replace a branch capability profile. Requires `branch:manage`. */
export async function replacePlatformBranchCapabilities(
  branchId: string,
  capabilities: PlatformBranchCapability[]
): Promise<PlatformBranch> {
  const validatedCapabilities =
    branchCapabilitiesSchema.safeParse(capabilities);
  if (!validatedCapabilities.success) {
    throw new Error("Check the branch capabilities and try again.");
  }

  try {
    const response = await getPlatformHttpClient().put<unknown>(
      `${ORGANIZATION_MANAGEMENT_ENDPOINTS.branches}/${encodeURIComponent(branchId)}/capabilities`,
      { capabilities: validatedCapabilities.data }
    );
    const branch = branchSchema.safeParse(response.data);
    if (!branch.success) throw new Error(UNEXPECTED_ORGANIZATION_RESPONSE);
    return branch.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save this branch's capabilities."
    );
  }
}

/** Add a department to a branch. Requires `branch:manage`. */
export async function createPlatformDepartment(
  branchId: string,
  department: OrganizationDepartmentCreation
): Promise<PlatformDepartment> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      `${ORGANIZATION_MANAGEMENT_ENDPOINTS.branches}/${encodeURIComponent(branchId)}/departments`,
      department
    );
    const createdDepartment = departmentSchema.safeParse(response.data);
    if (!createdDepartment.success) {
      throw new Error(UNEXPECTED_ORGANIZATION_RESPONSE);
    }
    return createdDepartment.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not add this department.");
  }
}

/** Rename or deactivate a department. Requires `branch:manage`. */
export async function updatePlatformDepartment(
  departmentId: string,
  changes: OrganizationDepartmentChanges
): Promise<PlatformDepartment> {
  const validatedChanges = departmentPatchSchema.safeParse(changes);
  if (!validatedChanges.success) {
    throw new Error(
      validatedChanges.error.issues[0]?.message ??
        "Check the department details and try again."
    );
  }

  try {
    const response = await getPlatformHttpClient().patch<unknown>(
      `${ORGANIZATION_MANAGEMENT_ENDPOINTS.departments}/${encodeURIComponent(departmentId)}`,
      validatedChanges.data
    );
    const department = departmentSchema.safeParse(response.data);
    if (!department.success) throw new Error(UNEXPECTED_ORGANIZATION_RESPONSE);
    return department.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not update this department.");
  }
}
