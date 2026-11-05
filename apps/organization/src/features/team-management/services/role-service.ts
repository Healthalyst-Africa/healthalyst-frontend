import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { TEAM_ENDPOINTS } from "~/features/team-management/config/team-management";
import {
  permissionListSchema,
  roleListSchema,
  roleSchema,
} from "~/features/team-management/schemas/team-response-schemas";
import {
  encodeIdentifier,
  parseTeamResponse,
} from "~/features/team-management/services/parse-team-response";
import type {
  TeamPermission,
  TeamRole,
  TeamRoleRequest,
} from "~/features/team-management/types/team-management";

function roleEndpoint(roleId: string) {
  return `${TEAM_ENDPOINTS.roles}/${encodeIdentifier(roleId)}`;
}

/** Every permission a role can include. Requires `role:read`. */
export async function listTeamPermissions(): Promise<TeamPermission[]> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      TEAM_ENDPOINTS.permissions
    );
    return parseTeamResponse(permissionListSchema, response.data).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the permission list.");
  }
}

/** Preset and custom roles with how many people hold each. */
export async function listTeamRoles(): Promise<TeamRole[]> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      TEAM_ENDPOINTS.roles
    );
    return parseTeamResponse(roleListSchema, response.data).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load your roles.");
  }
}

/** Create a custom role from permissions the creator holds. */
export async function createTeamRole(role: TeamRoleRequest): Promise<TeamRole> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      TEAM_ENDPOINTS.roles,
      role
    );
    return parseTeamResponse(roleSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(error, "We could not create this role.");
  }
}

/** Rename a custom role or change its permissions; holders update at once. */
export async function updateTeamRole(
  roleId: string,
  changes: Partial<TeamRoleRequest>
): Promise<TeamRole> {
  try {
    const response = await getPlatformHttpClient().patch<unknown>(
      roleEndpoint(roleId),
      changes
    );
    return parseTeamResponse(roleSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(error, "We could not save this role.");
  }
}

/** Delete a custom role that nobody holds. */
export async function deleteTeamRole(roleId: string): Promise<void> {
  try {
    await getPlatformHttpClient().delete(roleEndpoint(roleId));
  } catch (error) {
    throw toPlatformApiError(error, "We could not delete this role.");
  }
}
