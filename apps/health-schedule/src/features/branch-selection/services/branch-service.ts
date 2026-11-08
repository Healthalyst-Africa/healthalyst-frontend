import {
  PlatformApiError,
  toPlatformApiError,
} from "@healthalyst/platform-api/api-error";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { BRANCHES_ENDPOINT } from "~/features/branch-selection/config/branch-selection";
import {
  workspaceBranchListSchema,
  type WorkspaceBranch,
} from "~/features/branch-selection/schemas/branch-schema";

export const BRANCH_SELECTION_QUERY_KEYS = {
  branches: (organizationId: string) =>
    ["platform", "organization", organizationId, "branches"] as const,
};

/** The organisation's branches, from the Platform API. */
export async function getWorkspaceBranches(): Promise<WorkspaceBranch[]> {
  try {
    const response =
      await getPlatformHttpClient().get<unknown>(BRANCHES_ENDPOINT);
    const branchList = workspaceBranchListSchema.safeParse(response.data);
    if (!branchList.success) {
      throw new PlatformApiError(
        "HealthAlyst sent a branch list we did not recognise. Try again.",
        "INVALID_PLATFORM_RESPONSE",
        null,
        response.status,
        {},
        branchList.error
      );
    }
    return branchList.data.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load your branches.");
  }
}
