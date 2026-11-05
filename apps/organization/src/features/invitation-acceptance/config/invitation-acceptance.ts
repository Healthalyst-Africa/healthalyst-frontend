export const UNEXPECTED_INVITATION_RESPONSE =
  "We received an unexpected invitation response from HealthAlyst. Contact HealthAlyst for help.";

export function getInvitationEndpoint(invitationToken: string): string {
  return `/v1/invitations/${encodeURIComponent(invitationToken)}`;
}

export const INVITATION_PREVIEW_QUERY_KEY = "platform-invitation-preview";

/** The Platform API's status when an invitation link is used up or expired. */
export const INVITATION_GONE_STATUS = 410;
