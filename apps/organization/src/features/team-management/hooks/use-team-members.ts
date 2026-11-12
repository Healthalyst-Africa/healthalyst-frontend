"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  TEAM_INVITATIONS_QUERY_KEY,
  TEAM_MEMBERS_QUERY_KEY,
  TEAM_ROLES_QUERY_KEY,
} from "~/features/team-management/config/team-management";
import {
  getStaffMember,
  listStaffMembers,
  reactivateStaffMember,
  removeStaffMember,
  requestStaffEmailChange,
  resetStaffAuthenticator,
  suspendStaffMember,
  updateStaffMember,
  verifyStaffLicence,
} from "~/features/team-management/services/staff-service";
import type {
  MemberEmailChangeRequest,
  LicenceVerificationRequest,
  StaffListFilters,
  StaffMember,
  StaffMemberChanges,
} from "~/features/team-management/types/team-management";

export type TeamScope = { organizationId: string; userId: string };

export function useTeamMembersQuery(
  scope: TeamScope,
  filters: StaffListFilters,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: [
      TEAM_MEMBERS_QUERY_KEY,
      scope.userId,
      scope.organizationId,
      "list",
      filters,
    ],
    queryFn: ({ pageParam }) => listStaffMembers(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    retry: false,
  });
}

/** A member as saved now, shown straight away from the list while it loads. */
export function useTeamMemberQuery(
  scope: TeamScope,
  member: StaffMember | null
) {
  return useQuery({
    queryKey: [
      TEAM_MEMBERS_QUERY_KEY,
      scope.userId,
      scope.organizationId,
      "member",
      member?.membershipId,
    ],
    queryFn: () => getStaffMember(member?.membershipId ?? ""),
    enabled: member !== null,
    placeholderData: member ?? undefined,
    retry: false,
  });
}

function useRefreshTeam(scope: TeamScope) {
  const queryClient = useQueryClient();
  return (updatedMember?: StaffMember) => {
    if (updatedMember) {
      queryClient.setQueryData(
        [
          TEAM_MEMBERS_QUERY_KEY,
          scope.userId,
          scope.organizationId,
          "member",
          updatedMember.membershipId,
        ],
        updatedMember
      );
    }
    return Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          TEAM_MEMBERS_QUERY_KEY,
          scope.userId,
          scope.organizationId,
          "list",
        ],
      }),
      // Role member counts change when people join, leave or change roles.
      queryClient.invalidateQueries({
        queryKey: [TEAM_ROLES_QUERY_KEY, scope.userId, scope.organizationId],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          TEAM_INVITATIONS_QUERY_KEY,
          scope.userId,
          scope.organizationId,
        ],
      }),
    ]);
  };
}

export function useTeamMemberUpdateMutation(scope: TeamScope) {
  const refreshTeam = useRefreshTeam(scope);
  return useMutation({
    mutationFn: ({
      membershipId,
      changes,
    }: {
      membershipId: string;
      changes: StaffMemberChanges;
    }) => updateStaffMember(membershipId, changes),
    onSuccess: refreshTeam,
  });
}

export function useLicenceVerificationMutation(scope: TeamScope) {
  const refreshTeam = useRefreshTeam(scope);
  return useMutation({
    mutationFn: ({
      membershipId,
      verification,
    }: {
      membershipId: string;
      verification: LicenceVerificationRequest;
    }) => verifyStaffLicence(membershipId, verification),
    onSuccess: refreshTeam,
  });
}

export function useTeamMemberAccessMutation(scope: TeamScope) {
  const refreshTeam = useRefreshTeam(scope);
  return useMutation({
    mutationFn: ({
      membershipId,
      action,
    }: {
      membershipId: string;
      action: "suspend" | "reactivate";
    }) =>
      action === "suspend"
        ? suspendStaffMember(membershipId)
        : reactivateStaffMember(membershipId),
    onSuccess: refreshTeam,
  });
}

export function useAuthenticatorResetMutation() {
  return useMutation({
    mutationFn: (membershipId: string) => resetStaffAuthenticator(membershipId),
  });
}

export function useMemberEmailChangeMutation() {
  return useMutation({
    mutationFn: ({
      membershipId,
      request,
    }: {
      membershipId: string;
      request: MemberEmailChangeRequest;
    }) => requestStaffEmailChange(membershipId, request),
  });
}

export function useTeamMemberRemovalMutation(scope: TeamScope) {
  const refreshTeam = useRefreshTeam(scope);
  return useMutation({
    mutationFn: (membershipId: string) => removeStaffMember(membershipId),
    onSuccess: () => refreshTeam(),
  });
}
