"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TEAM_MEMBERS_QUERY_KEY,
  TEAM_PERMISSIONS_QUERY_KEY,
  TEAM_ROLES_QUERY_KEY,
} from "~/features/team-management/config/team-management";
import type { TeamScope } from "~/features/team-management/hooks/use-team-members";
import {
  createTeamRole,
  deleteTeamRole,
  listTeamPermissions,
  listTeamRoles,
  updateTeamRole,
} from "~/features/team-management/services/role-service";
import type { TeamRoleRequest } from "~/features/team-management/types/team-management";

export function useTeamRolesQuery(scope: TeamScope, enabled: boolean) {
  return useQuery({
    queryKey: [TEAM_ROLES_QUERY_KEY, scope.userId, scope.organizationId],
    queryFn: listTeamRoles,
    enabled,
    retry: false,
  });
}

export function useTeamPermissionsQuery(scope: TeamScope, enabled: boolean) {
  return useQuery({
    queryKey: [TEAM_PERMISSIONS_QUERY_KEY, scope.userId, scope.organizationId],
    queryFn: listTeamPermissions,
    enabled,
    retry: false,
    // The catalogue changes only when HealthAlyst releases new permissions.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

function useRefreshRoles(scope: TeamScope) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: [TEAM_ROLES_QUERY_KEY, scope.userId, scope.organizationId],
      }),
      // Member rows show role names.
      queryClient.invalidateQueries({
        queryKey: [TEAM_MEMBERS_QUERY_KEY, scope.userId, scope.organizationId],
      }),
    ]);
}

export function useTeamRoleCreateMutation(scope: TeamScope) {
  const refreshRoles = useRefreshRoles(scope);
  return useMutation({
    mutationFn: (role: TeamRoleRequest) => createTeamRole(role),
    onSuccess: refreshRoles,
  });
}

export function useTeamRoleUpdateMutation(scope: TeamScope) {
  const refreshRoles = useRefreshRoles(scope);
  return useMutation({
    mutationFn: ({
      roleId,
      changes,
    }: {
      roleId: string;
      changes: Partial<TeamRoleRequest>;
    }) => updateTeamRole(roleId, changes),
    onSuccess: refreshRoles,
  });
}

export function useTeamRoleDeleteMutation(scope: TeamScope) {
  const refreshRoles = useRefreshRoles(scope);
  return useMutation({
    mutationFn: (roleId: string) => deleteTeamRole(roleId),
    onSuccess: refreshRoles,
  });
}
