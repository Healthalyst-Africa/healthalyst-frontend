"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TEAM_INVITATIONS_QUERY_KEY,
  TEAM_MEMBERS_QUERY_KEY,
} from "~/features/team-management/config/team-management";
import type { TeamScope } from "~/features/team-management/hooks/use-team-members";
import {
  inviteStaffMember,
  inviteStaffMembers,
  listStaffInvitations,
  resendStaffInvitation,
  revokeStaffInvitation,
} from "~/features/team-management/services/invitation-service";
import type { StaffInvitationRequest } from "~/features/team-management/types/team-management";

export function useTeamInvitationsQuery(scope: TeamScope, enabled: boolean) {
  return useQuery({
    queryKey: [TEAM_INVITATIONS_QUERY_KEY, scope.userId, scope.organizationId],
    queryFn: listStaffInvitations,
    enabled,
    retry: false,
  });
}

function useRefreshInvitations(scope: TeamScope) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          TEAM_INVITATIONS_QUERY_KEY,
          scope.userId,
          scope.organizationId,
        ],
      }),
      // Invited people appear in the member list as well.
      queryClient.invalidateQueries({
        queryKey: [TEAM_MEMBERS_QUERY_KEY, scope.userId, scope.organizationId],
      }),
    ]);
}

export function useStaffInvitationMutation(scope: TeamScope) {
  const refreshInvitations = useRefreshInvitations(scope);
  return useMutation({
    mutationFn: (invitation: StaffInvitationRequest) =>
      inviteStaffMember(invitation),
    onSuccess: refreshInvitations,
  });
}

export function useBulkStaffInvitationMutation(scope: TeamScope) {
  const refreshInvitations = useRefreshInvitations(scope);
  return useMutation({
    mutationFn: (invitations: StaffInvitationRequest[]) =>
      inviteStaffMembers(invitations),
    onSuccess: refreshInvitations,
  });
}

export function useInvitationActionMutation(scope: TeamScope) {
  const refreshInvitations = useRefreshInvitations(scope);
  return useMutation({
    mutationFn: ({
      invitationId,
      action,
    }: {
      invitationId: string;
      action: "resend" | "revoke";
    }) =>
      action === "resend"
        ? resendStaffInvitation(invitationId)
        : revokeStaffInvitation(invitationId),
    onSuccess: refreshInvitations,
  });
}
