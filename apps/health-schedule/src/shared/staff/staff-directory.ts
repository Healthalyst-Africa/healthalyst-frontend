"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { useWorkspace } from "~/shared/workspace/workspace-context";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

/** Platform API list of the organisation's members. */
const STAFF_ENDPOINT = "/v1/staff";
const STAFF_DIRECTORY_LIMIT = 100;
const STAFF_READ_PERMISSION = "staff:read";

const staffDirectorySchema = z.object({
  data: z.array(
    z.object({
      userId: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
  ),
});

async function listStaffNames(): Promise<Map<string, string>> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      STAFF_ENDPOINT,
      {
        params: { limit: STAFF_DIRECTORY_LIMIT },
      }
    );
    const directory = parseHealthScheduleResponse(
      staffDirectorySchema,
      response.data,
      response.status
    );
    return new Map(
      directory.data.map((member) => [
        member.userId,
        `${member.firstName} ${member.lastName}`,
      ])
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load staff names.");
  }
}

/**
 * Staff names by user id, so records can say who wrote or opened them.
 * Needs `staff:read`; without it, or for someone beyond the first 100
 * members, `describeStaff` falls back to a neutral description.
 */
export function useStaffNames() {
  const { platformSession, permissions } = useWorkspace();
  const organizationIdentifier =
    platformSession.activeContext.organizationId ?? "";
  const canReadStaff = permissions.includes(STAFF_READ_PERMISSION);
  const namesQuery = useQuery({
    queryKey: ["platform", organizationIdentifier, "staff", "names"],
    queryFn: listStaffNames,
    enabled: canReadStaff,
    staleTime: 10 * 60_000,
  });

  return function describeStaff(userId: string): string {
    if (userId === platformSession.user.id) return "You";
    return namesQuery.data?.get(userId) ?? "A colleague";
  };
}
