"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { INVITATION_PREVIEW_QUERY_KEY } from "~/features/invitation-acceptance/config/invitation-acceptance";
import {
  acceptInvitation,
  getInvitationPreview,
} from "~/features/invitation-acceptance/services/invitation-acceptance-service";

export function useInvitationPreviewQuery(invitationToken: string | null) {
  return useQuery({
    // The token identifies a one-time link, so it is kept out of the key.
    queryKey: [INVITATION_PREVIEW_QUERY_KEY],
    queryFn: () => getInvitationPreview(invitationToken ?? ""),
    enabled: invitationToken !== null,
    retry: false,
    gcTime: 0,
  });
}

export function useInvitationAcceptanceMutation(
  invitationToken: string | null
) {
  return useMutation({
    mutationFn: (password?: string) =>
      acceptInvitation(invitationToken ?? "", password),
  });
}
