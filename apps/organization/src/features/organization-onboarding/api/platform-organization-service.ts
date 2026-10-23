import { z } from "zod";
import { nigerianStateOptions } from "~/features/organization-onboarding/model/organization-registration-options";
import { getPlatformHttpClient } from "./platform-http-client";
import { toPlatformApiError } from "./platform-api-error";

const organizationStatusSchema = z.enum([
  "DRAFT",
  "PENDING_VERIFICATION",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "DEACTIVATED",
]);

const organizationTypeSchema = z.enum([
  "CLINIC",
  "HOSPITAL",
  "SPECIALIST_CLINIC",
  "DIAGNOSTIC_CENTRE",
  "LABORATORY",
  "IMAGING_CENTRE",
  "PHARMACY",
  "MULTI_BRANCH_GROUP",
]);

const organizationProfileSchema = z.object({
  id: z.string().uuid(),
  status: organizationStatusSchema,
  version: z.number().int(),
  legalName: z.string(),
  tradingName: z.string(),
  type: organizationTypeSchema.nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  stateCode: z.string().nullable(),
  lga: z.string().nullable(),
  cacNumber: z.string().nullable(),
  facilityLicenceNo: z.string().nullable(),
  directoryListed: z.boolean(),
});

const branchCapabilitySchema = z.object({
  category: z.enum([
    "CONSULTATION",
    "LABORATORY",
    "PHARMACY",
    "RADIOLOGY",
    "EMERGENCY",
    "SURGERY",
    "OTHER",
  ]),
  isEnabled: z.boolean(),
  acceptsExternalReferrals: z.boolean(),
});

const departmentSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  isActive: z.boolean(),
});

const branchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  departments: z.array(departmentSchema),
  capabilities: z.array(branchCapabilitySchema),
});

const branchListSchema = z.object({ data: z.array(branchSchema) });

const departmentPatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Update at least one department field.",
  });

const branchPatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Update at least one branch field.",
  });

const organizationPatchSchema = z
  .object({
    tradingName: z.string().min(1).max(200).optional(),
    email: z.string().email().max(254).optional(),
    phone: z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/)
      .optional(),
    addressLine: z.string().min(1).max(300).optional(),
    city: z.string().min(1).max(100).optional(),
    stateCode: z
      .string()
      .refine(
        (stateCode) =>
          nigerianStateOptions.some(
            (stateOption) => stateOption.value === stateCode
          ),
        "Select a valid Nigerian state."
      )
      .optional(),
    lga: z.string().min(1).max(100).nullable().optional(),
    directoryListed: z.boolean().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Update at least one organisation field.",
  });

export type PlatformOrganizationProfile = z.infer<
  typeof organizationProfileSchema
> & { entityTag: string };
export type PlatformBranch = z.infer<typeof branchSchema>;
export type PlatformDepartment = z.infer<typeof departmentSchema>;
export type PlatformBranchCapability = z.infer<typeof branchCapabilitySchema>;

const unexpectedOrganizationResponse =
  "We received an unexpected organisation response from HealthAlyst. Contact HealthAlyst for help.";

function entityTagForVersion(
  responseEntityTag: string | undefined,
  version: number
) {
  return responseEntityTag ?? String(version);
}

/** Load an ACTIVE organisation profile. Requires `org:read`. */
export async function getPlatformOrganization(): Promise<PlatformOrganizationProfile> {
  try {
    const response =
      await getPlatformHttpClient().get<unknown>("/v1/organization");
    const profile = organizationProfileSchema.safeParse(response.data);
    if (!profile.success) throw new Error(unexpectedOrganizationResponse);
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
  changes: z.input<typeof organizationPatchSchema>
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
      "/v1/organization",
      validatedChanges.data,
      { headers: { "If-Match": entityTag } }
    );
    const profile = organizationProfileSchema.safeParse(response.data);
    if (!profile.success) throw new Error(unexpectedOrganizationResponse);
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
      "/v1/organization/branches"
    );
    const branches = branchListSchema.safeParse(response.data);
    if (!branches.success) throw new Error(unexpectedOrganizationResponse);
    return branches.data.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load your organisation branches."
    );
  }
}

/** Create a branch. The API may generate a unique slug if omitted. */
export async function createPlatformBranch(branch: {
  name: string;
  slug?: string;
}): Promise<PlatformBranch> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      "/v1/organization/branches",
      branch
    );
    const createdBranch = branchSchema.safeParse(response.data);
    if (!createdBranch.success) throw new Error(unexpectedOrganizationResponse);
    return createdBranch.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not add this branch.");
  }
}

/** Rename or deactivate a branch. Requires `branch:manage`. */
export async function updatePlatformBranch(
  branchId: string,
  changes: z.input<typeof branchPatchSchema>
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
      `/v1/organization/branches/${encodeURIComponent(branchId)}`,
      validatedChanges.data
    );
    const branch = branchSchema.safeParse(response.data);
    if (!branch.success) throw new Error(unexpectedOrganizationResponse);
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
  const validatedCapabilities = z
    .array(branchCapabilitySchema)
    .max(7)
    .safeParse(capabilities);
  if (!validatedCapabilities.success) {
    throw new Error("Check the branch capabilities and try again.");
  }

  try {
    const response = await getPlatformHttpClient().put<unknown>(
      `/v1/organization/branches/${encodeURIComponent(branchId)}/capabilities`,
      { capabilities: validatedCapabilities.data }
    );
    const branch = branchSchema.safeParse(response.data);
    if (!branch.success) throw new Error(unexpectedOrganizationResponse);
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
  department: { name: string; code: string }
): Promise<PlatformDepartment> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      `/v1/organization/branches/${encodeURIComponent(branchId)}/departments`,
      department
    );
    const createdDepartment = departmentSchema.safeParse(response.data);
    if (!createdDepartment.success) {
      throw new Error(unexpectedOrganizationResponse);
    }
    return createdDepartment.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not add this department.");
  }
}

/** Rename or deactivate a department. Requires `branch:manage`. */
export async function updatePlatformDepartment(
  departmentId: string,
  changes: z.input<typeof departmentPatchSchema>
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
      `/v1/organization/departments/${encodeURIComponent(departmentId)}`,
      validatedChanges.data
    );
    const department = departmentSchema.safeParse(response.data);
    if (!department.success) throw new Error(unexpectedOrganizationResponse);
    return department.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not update this department.");
  }
}
