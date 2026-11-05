"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PARTNER_QUERY_KEYS } from "~/features/partner-network/config/partner-network";
import {
  acceptPartnerInvitation,
  changePartnership,
  getPartnerInvitationPreview,
  invitePartner,
  listPartnerInvitations,
  listPartnerships,
  requestPartnership,
  searchPartnerDirectory,
  updatePartnershipPreference,
} from "~/features/partner-network/services/partner-network-service";
import type {
  DirectorySearch,
  PartnerScope,
  PartnershipAction,
} from "~/features/partner-network/types/partner-network";

export function usePartnershipsQuery(scope: PartnerScope, enabled: boolean) {
  return useQuery({
    queryKey: [
      PARTNER_QUERY_KEYS.partnerships,
      scope.userId,
      scope.organizationId,
    ],
    queryFn: listPartnerships,
    enabled,
  });
}

export function usePartnerInvitationsQuery(
  scope: PartnerScope,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      PARTNER_QUERY_KEYS.invitations,
      scope.userId,
      scope.organizationId,
    ],
    queryFn: listPartnerInvitations,
    enabled,
  });
}

export function usePartnerDirectoryQuery(
  scope: PartnerScope,
  search: DirectorySearch,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      PARTNER_QUERY_KEYS.directory,
      scope.userId,
      scope.organizationId,
      search,
    ],
    queryFn: () => searchPartnerDirectory(search),
    enabled,
  });
}

function useRefreshPartnerships(scope: PartnerScope) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: [
        PARTNER_QUERY_KEYS.partnerships,
        scope.userId,
        scope.organizationId,
      ],
    });
}

export function usePartnershipRequestMutation(scope: PartnerScope) {
  const refreshPartnerships = useRefreshPartnerships(scope);
  return useMutation({
    mutationFn: requestPartnership,
    onSuccess: refreshPartnerships,
  });
}

export function usePartnershipPreferenceMutation(scope: PartnerScope) {
  const refreshPartnerships = useRefreshPartnerships(scope);
  return useMutation({
    mutationFn: ({
      partnershipId,
      preference,
    }: {
      partnershipId: string;
      preference: { isPreferred: boolean; priority: number };
    }) => updatePartnershipPreference(partnershipId, preference),
    onSuccess: refreshPartnerships,
  });
}

export function usePartnershipChangeMutation(scope: PartnerScope) {
  const refreshPartnerships = useRefreshPartnerships(scope);
  return useMutation({
    mutationFn: ({
      partnershipId,
      action,
    }: {
      partnershipId: string;
      action: PartnershipAction;
    }) => changePartnership(partnershipId, action),
    onSuccess: refreshPartnerships,
  });
}

export function usePartnerInvitationMutation(scope: PartnerScope) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: invitePartner,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [
          PARTNER_QUERY_KEYS.invitations,
          scope.userId,
          scope.organizationId,
        ],
      }),
  });
}

/**
 * Public: who sent a partner invitation link, read before signing in. Wait
 * for the sign-in check first: restoring the session clears cached queries.
 */
export function usePartnerInvitationPreviewQuery(
  invitationToken: string,
  enabled: boolean
) {
  return useQuery({
    // The token identifies a one-time link, so it is kept out of the key.
    queryKey: [PARTNER_QUERY_KEYS.invitationPreview],
    queryFn: () => getPartnerInvitationPreview(invitationToken),
    enabled,
    retry: false,
    gcTime: 0,
  });
}

export function usePartnerInvitationAcceptanceMutation(
  invitationToken: string
) {
  return useMutation({
    mutationFn: () => acceptPartnerInvitation(invitationToken),
  });
}
