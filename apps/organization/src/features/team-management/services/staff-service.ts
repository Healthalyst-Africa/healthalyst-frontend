import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  TEAM_ENDPOINTS,
  TEAM_FIELD_LIMITS,
} from "~/features/team-management/config/team-management";
import {
  emailChangeRequestResponseSchema,
  staffListSchema,
  staffMemberSchema,
} from "~/features/team-management/schemas/team-response-schemas";
import {
  encodeIdentifier,
  parseTeamResponse,
} from "~/features/team-management/services/parse-team-response";
import type {
  LicenceVerificationRequest,
  MemberEmailChangeRequest,
  MemberEmailChangeResult,
  StaffListFilters,
  StaffMember,
  StaffMemberChanges,
  StaffPage,
} from "~/features/team-management/types/team-management";

function staffMemberEndpoint(membershipId: string, action?: string) {
  const memberPath = `${TEAM_ENDPOINTS.staff}/${encodeIdentifier(membershipId)}`;
  return action ? `${memberPath}/${action}` : memberPath;
}

/** One page of members. Requires `staff:read`. */
export async function listStaffMembers(
  filters: StaffListFilters,
  cursor: string | null
): Promise<StaffPage> {
  const searchText = filters.searchText?.trim() ?? "";
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      TEAM_ENDPOINTS.staff,
      {
        params: {
          limit: TEAM_FIELD_LIMITS.pageSize,
          ...(filters.status && { status: filters.status }),
          ...(filters.branchId && { branchId: filters.branchId }),
          ...(searchText.length >= TEAM_FIELD_LIMITS.searchMinimumLength && {
            q: searchText.slice(0, TEAM_FIELD_LIMITS.searchMaximumLength),
          }),
          ...(cursor && { cursor }),
        },
      }
    );
    const staffList = parseTeamResponse(staffListSchema, response.data);
    return {
      members: staffList.data,
      nextCursor: staffList.page.hasMore ? staffList.page.nextCursor : null,
    };
  } catch (error) {
    throw toPlatformApiError(error, "We could not load your team.");
  }
}

/** One member, as saved now. Requires `staff:read`. */
export async function getStaffMember(
  membershipId: string
): Promise<StaffMember> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      staffMemberEndpoint(membershipId)
    );
    return parseTeamResponse(staffMemberSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(error, "We could not load this team member.");
  }
}

/** Change roles, branches, job details, licence or limits. Requires `staff:update`. */
export async function updateStaffMember(
  membershipId: string,
  changes: StaffMemberChanges
): Promise<StaffMember> {
  try {
    const response = await getPlatformHttpClient().patch<unknown>(
      staffMemberEndpoint(membershipId),
      changes
    );
    return parseTeamResponse(staffMemberSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save this team member's changes."
    );
  }
}

/** Record how a member's licence was confirmed. Requires `staff:update`. */
export async function verifyStaffLicence(
  membershipId: string,
  verification: LicenceVerificationRequest
): Promise<StaffMember> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      staffMemberEndpoint(membershipId, "licence/verify"),
      verification
    );
    return parseTeamResponse(staffMemberSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(error, "We could not record the licence check.");
  }
}

/** Suspend a member; they are signed out of this organisation. */
export async function suspendStaffMember(
  membershipId: string
): Promise<StaffMember> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      staffMemberEndpoint(membershipId, "suspend")
    );
    return parseTeamResponse(staffMemberSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(error, "We could not suspend this team member.");
  }
}

/** Give a suspended member their access back. */
export async function reactivateStaffMember(
  membershipId: string
): Promise<StaffMember> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      staffMemberEndpoint(membershipId, "reactivate")
    );
    return parseTeamResponse(staffMemberSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not reactivate this team member."
    );
  }
}

/**
 * Make a member set up their authenticator again. The API asks for a recent
 * authenticator check from the person doing it.
 */
export async function resetStaffAuthenticator(
  membershipId: string
): Promise<void> {
  try {
    await getPlatformHttpClient().post(
      staffMemberEndpoint(membershipId, "reset-mfa")
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not reset this team member's authenticator."
    );
  }
}

/**
 * Starts changing the sign-in email of a member who lost access to theirs.
 * Nothing changes until they confirm from the new address and choose a new
 * password; the old address is told. Requires `staff:update` and a recent
 * authenticator check.
 */
export async function requestStaffEmailChange(
  membershipId: string,
  request: MemberEmailChangeRequest
): Promise<MemberEmailChangeResult> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      staffMemberEndpoint(membershipId, "email-change"),
      request
    );
    return parseTeamResponse(emailChangeRequestResponseSchema, response.data);
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not start the email change. Try again.",
      { newEmail: "newEmail", reason: "reason" }
    );
  }
}

/** Remove a member from the organisation. Requires `staff:remove`. */
export async function removeStaffMember(membershipId: string): Promise<void> {
  try {
    await getPlatformHttpClient().delete(staffMemberEndpoint(membershipId));
  } catch (error) {
    throw toPlatformApiError(error, "We could not remove this team member.");
  }
}
