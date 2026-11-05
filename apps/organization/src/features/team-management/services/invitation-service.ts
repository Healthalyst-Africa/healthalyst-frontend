import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { TEAM_ENDPOINTS } from "~/features/team-management/config/team-management";
import {
  bulkInvitationResultSchema,
  invitationListSchema,
  invitationSchema,
} from "~/features/team-management/schemas/team-response-schemas";
import {
  encodeIdentifier,
  parseTeamResponse,
} from "~/features/team-management/services/parse-team-response";
import type {
  BulkInvitationResult,
  StaffInvitation,
  StaffInvitationRequest,
} from "~/features/team-management/types/team-management";

function invitationEndpoint(invitationId: string) {
  return `${TEAM_ENDPOINTS.invitations}/${encodeIdentifier(invitationId)}`;
}

/** Every invitation, including expired ones. Requires `staff:read`. */
export async function listStaffInvitations(): Promise<StaffInvitation[]> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      TEAM_ENDPOINTS.invitations
    );
    return parseTeamResponse(invitationListSchema, response.data).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load your invitations.");
  }
}

/** Invite one person; they get a link that works for 72 hours. */
export async function inviteStaffMember(
  invitation: StaffInvitationRequest
): Promise<StaffInvitation> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      TEAM_ENDPOINTS.invitations,
      invitation
    );
    return parseTeamResponse(invitationSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(error, "We could not send this invitation.");
  }
}

/**
 * Invite up to 200 people at once. The API answers with one result per row,
 * in the order sent, so failed rows can be shown and fixed.
 */
export async function inviteStaffMembers(
  invitations: StaffInvitationRequest[]
): Promise<BulkInvitationResult[]> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      TEAM_ENDPOINTS.bulkInvitations,
      { invitations }
    );
    return parseTeamResponse(bulkInvitationResultSchema, response.data).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not send these invitations.");
  }
}

/** Send a new link; the old one stops working. */
export async function resendStaffInvitation(
  invitationId: string
): Promise<void> {
  try {
    await getPlatformHttpClient().post(
      `${invitationEndpoint(invitationId)}/resend`
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not resend this invitation.");
  }
}

/** Cancel an invitation that has not been accepted. */
export async function revokeStaffInvitation(
  invitationId: string
): Promise<void> {
  try {
    await getPlatformHttpClient().delete(invitationEndpoint(invitationId));
  } catch (error) {
    throw toPlatformApiError(error, "We could not revoke this invitation.");
  }
}
